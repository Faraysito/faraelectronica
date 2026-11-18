import csv
import uuid
from collections import defaultdict
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum, Count, Avg, F, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.timezone import now, timedelta
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from transbank.common.integration_type import IntegrationType
from transbank.common.options import WebpayOptions
from transbank.webpay.webpay_plus.transaction import Transaction

from . import meta_capi, precios
from .models import (
    Producto, Orden, OrdenItem, Gasto, Venta, VentaItem, 
    MetodoPago, Negocio, FacturaElectronica, PrecioEscalonado, Resena, Suscripcion
)
from .serializers import (
    ProductoSerializer, OrdenSerializer, OrdenClienteSerializer, GastoSerializer,
    VentaSerializer, FacturaSerializer, NegocioSerializer, ResenaSerializer, SuscripcionSerializer
)

# estados en que la orden ya se pagó (sirven para "compra verificada")
ESTADOS_PAGADOS = ('pagada', 'preparando', 'entregada')


class NegocioViewSet(viewsets.ModelViewSet):
    """Multi-negocio: gestionar varios negocios por usuario."""
    serializer_class = NegocioSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Negocio.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProductoViewSet(viewsets.ModelViewSet):
    """Inventario: stock, categorías, SKU y precio por cantidad.

    Lectura pública (es el catálogo de la tienda); escritura solo admin.
    """
    serializer_class = ProductoSerializer
    acciones_publicas = ('list', 'retrieve', 'por_categoria', 'precios_escalonados')

    def get_permissions(self):
        if self.action in self.acciones_publicas:
            return [AllowAny()]
        if self.action == 'resenas':
            return [IsAuthenticated()] if self.request.method == 'POST' else [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Producto.objects.all()
        negocio_id = self.request.query_params.get('negocio_id')
        if negocio_id:
            qs = qs.filter(negocio_id=negocio_id)
        categoria = self.request.query_params.get('categoria')
        if categoria:
            qs = qs.filter(categoria__iexact=categoria)
        return qs.annotate(
            rating_avg=Avg('resenas__calificacion', filter=Q(resenas__visible=True)),
            rating_count=Count('resenas', filter=Q(resenas__visible=True)),
        ).prefetch_related('imagenes', 'precios_escalonados', 'complementos')

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Listar productos por categoría."""
        categoria = request.query_params.get('categoria')
        productos = self.get_queryset().filter(categoria=categoria)
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ajustar_stock(self, request, pk=None):
        """Ajustar stock manualmente."""
        producto = self.get_object()
        try:
            producto.stock = int(request.data.get('cantidad'))
        except (TypeError, ValueError):
            return Response({'error': 'cantidad inválida'}, status=400)
        producto.save()
        return Response({'stock': producto.stock})

    @action(detail=True, methods=['get'])
    def precios_escalonados(self, request, pk=None):
        """Ver precios por cantidad."""
        producto = self.get_object()
        precios_db = PrecioEscalonado.objects.filter(producto=producto)
        data = [{'min': p.cantidad_minima, 'max': p.cantidad_maxima, 'precio': p.precio} 
                for p in precios_db]
        return Response(data)

    @action(detail=True, methods=['get', 'post'])
    def resenas(self, request, pk=None):
        """GET: reseñas visibles + resumen. POST: solo clientes con compra pagada del producto."""
        producto = get_object_or_404(Producto, pk=pk)
        if request.method == 'GET':
            visibles = producto.resenas.filter(visible=True).select_related('usuario')
            resumen = visibles.aggregate(promedio=Avg('calificacion'), total=Count('id'))
            distribucion = {str(n): 0 for n in range(5, 0, -1)}
            for fila in visibles.order_by().values('calificacion').annotate(c=Count('id')):
                distribucion[str(fila['calificacion'])] = fila['c']
            return Response({
                'resumen': {
                    'promedio': round(float(resumen['promedio']), 1) if resumen['promedio'] else None,
                    'total': resumen['total'],
                    'distribucion': distribucion,
                },
                'resenas': ResenaSerializer(visibles, many=True, context={'request': request}).data,
            })

        compro = OrdenItem.objects.filter(
            producto=producto, orden__usuario=request.user, orden__estado__in=ESTADOS_PAGADOS,
        ).exists()
        if not compro:
            return Response({'error': 'Solo pueden opinar clientes con una compra pagada de este producto.'}, status=403)
        if Resena.objects.filter(producto=producto, usuario=request.user).exists():
            return Response({'error': 'Ya dejaste una reseña para este producto.'}, status=400)
        serializer = ResenaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(producto=producto, usuario=request.user, compra_verificada=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrdenViewSet(viewsets.ModelViewSet):
    """Órdenes web y ventas presenciales."""
    serializer_class = OrdenSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Orden.objects.filter(usuario=self.request.user)

    @action(detail=False, methods=['post'])
    def crear_venta_manual(self, request):
        """Registra una venta presencial (POS)."""
        datos = request.data
        negocio_id = datos.get('negocio_id')
        items = datos.get('items', [])
        metodo_pago_id = datos.get('metodo_pago_id')
        
        # Crear orden de tipo presencial
        orden = Orden.objects.create(
            usuario=request.user,
            negocio_id=negocio_id,
            metodo_pago_id=metodo_pago_id,
            tipo_venta='presencial',
            total=0
        )
        
        total = 0
        for item in items:
            producto = Producto.objects.get(id=item['producto_id'])
            producto.stock -= item['cantidad']
            producto.save()
            
            orden_item = OrdenItem.objects.create(
                orden=orden,
                producto=producto,
                nombre_producto=producto.nombre,
                precio_unitario=item.get('precio', producto.precio),
                costo_unitario=producto.costo,
                cantidad=item['cantidad']
            )
            total += orden_item.subtotal
        
        orden.total = total
        orden.estado = 'pagada'
        orden.save()
        
        serializer = self.get_serializer(orden)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def registrar_pago(self, request):
        """Marca el método de pago de una orden."""
        orden_id = request.data.get('orden_id')
        metodo_pago_id = request.data.get('metodo_pago_id')
        
        orden = Orden.objects.get(id=orden_id)
        orden.metodo_pago_id = metodo_pago_id
        orden.save()
        
        return Response({'status': 'Método de pago registrado'})


class GastoViewSet(viewsets.ModelViewSet):
    """Libro de caja: gastos."""
    serializer_class = GastoSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        negocio_id = self.request.query_params.get('negocio_id')
        if negocio_id:
            return Gasto.objects.filter(negocio_id=negocio_id)
        return Gasto.objects.all()

    @action(detail=False, methods=['get'])
    def balance_del_mes(self, request):
        """Balance de caja del mes actual."""
        ahora = now()
        inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Ingresos: órdenes pagadas
        ingresos_ordenes = Orden.objects.filter(
            estado='pagada',
            created_at__gte=inicio_mes
        ).aggregate(total=Sum('total'))['total'] or 0
        
        ingresos_ventas = Venta.objects.filter(
            created_at__gte=inicio_mes
        ).aggregate(total=Sum('total'))['total'] or 0
        
        ingresos_totales = ingresos_ordenes + ingresos_ventas
        
        # Egresos: gastos
        egresos = Gasto.objects.filter(
            created_at__gte=inicio_mes
        ).aggregate(total=Sum('monto'))['total'] or 0
        
        # Ganancia total
        ganancia_ordenes = Orden.objects.filter(
            estado='pagada',
            created_at__gte=inicio_mes
        ).aggregate(total=Sum('utilidad'))['total'] or 0
        
        ganancia_ventas = Venta.objects.filter(
            created_at__gte=inicio_mes
        ).aggregate(total=Sum('utilidad'))['total'] or 0
        
        ganancia_total = ganancia_ordenes + ganancia_ventas
        
        return Response({
            'periodo': f"{ahora.strftime('%B %Y')}",
            'ingresos_ordenes_web': ingresos_ordenes,
            'ingresos_ventas_presenciales': ingresos_ventas,
            'ingresos_totales': ingresos_totales,
            'egresos': egresos,
            'neto': ingresos_totales - egresos,
            'ganancia': ganancia_total,
        })

    @action(detail=False, methods=['get'])
    def gastos_por_tipo(self, request):
        """Desglose de gastos por tipo."""
        negocio_id = request.query_params.get('negocio_id')
        gastos = Gasto.objects.filter(negocio_id=negocio_id) if negocio_id else Gasto.objects.all()
        
        desglose = {}
        for tipo, label in Gasto.TIPO_CHOICES:
            total = gastos.filter(tipo=tipo).aggregate(Sum('monto'))['monto__sum'] or 0
            desglose[label] = total
        
        return Response(desglose)


class VentaViewSet(viewsets.ModelViewSet):
    """Ventas presenciales (POS)."""
    serializer_class = VentaSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['post'])
    def crear_rapido(self, request):
        """POS rápida: crear venta presencial en 1 llamada."""
        datos = request.data
        items = datos.get('items', [])
        metodo_pago_id = datos.get('metodo_pago_id')
        negocio_id = datos.get('negocio_id')
        
        venta = Venta.objects.create(
            negocio_id=negocio_id,
            metodo_pago_id=metodo_pago_id,
            total=0
        )
        
        total = 0
        for item in items:
            producto = Producto.objects.get(id=item['producto_id'])
            producto.stock -= item['cantidad']
            producto.save()
            
            venta_item = VentaItem.objects.create(
                venta=venta,
                producto=producto,
                nombre_producto=producto.nombre,
                precio_unitario=item.get('precio', producto.precio),
                costo_unitario=producto.costo,
                cantidad=item['cantidad']
            )
            total += venta_item.subtotal
        
        venta.total = total
        venta.save()
        
        serializer = self.get_serializer(venta)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReportesViewSet(viewsets.ViewSet):
    """Reportes descargables y estadísticas."""
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas para el dashboard."""
        negocio_id = request.query_params.get('negocio_id')
        
        # Filtrar por negocio si se proporciona
        ordenes = Orden.objects.filter(negocio_id=negocio_id) if negocio_id else Orden.objects.all()
        ventas = Venta.objects.filter(negocio_id=negocio_id) if negocio_id else Venta.objects.all()
        gastos = Gasto.objects.filter(negocio_id=negocio_id) if negocio_id else Gasto.objects.all()
        
        # Totales
        ingresos_web = ordenes.filter(estado='pagada').aggregate(Sum('total'))['total__sum'] or 0
        ingresos_presencial = ventas.aggregate(Sum('total'))['total__sum'] or 0
        ingresos_totales = ingresos_web + ingresos_presencial
        
        egresos = gastos.aggregate(Sum('monto'))['monto__sum'] or 0
        
        ganancia_web = ordenes.filter(estado='pagada').aggregate(Sum('utilidad'))['utilidad__sum'] or 0
        ganancia_presencial = ventas.aggregate(Sum('utilidad'))['utilidad__sum'] or 0
        ganancia_total = ganancia_web + ganancia_presencial
        
        return Response({
            'ingresos_web': ingresos_web,
            'ingresos_presencial': ingresos_presencial,
            'ingresos_totales': ingresos_totales,
            'egresos': egresos,
            'ganancia_web': ganancia_web,
            'ganancia_presencial': ganancia_presencial,
            'ganancia_total': ganancia_total,
            'neto': ingresos_totales - egresos,
            'cantidad_ordenes': ordenes.filter(estado='pagada').count(),
            'cantidad_ventas': ventas.count(),
        })

    @action(detail=False, methods=['get'])
    def descargar_csv(self, request):
        """Descarga de reportes en CSV."""
        reporte_tipo = request.query_params.get('tipo', 'ordenes')
        negocio_id = request.query_params.get('negocio_id')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="reporte_{reporte_tipo}.csv"'
        
        writer = csv.writer(response)
        
        if reporte_tipo == 'ordenes':
            writer.writerow(['ID', 'Usuario', 'Total', 'Estado', 'Tipo', 'Fecha'])
            ordenes = Orden.objects.filter(negocio_id=negocio_id) if negocio_id else Orden.objects.all()
            for orden in ordenes:
                writer.writerow([orden.id, orden.usuario.email, orden.total, orden.get_estado_display(), orden.tipo_venta, orden.created_at])
        
        elif reporte_tipo == 'gastos':
            writer.writerow(['Tipo', 'Descripción', 'Monto', 'Método', 'Fecha'])
            gastos = Gasto.objects.filter(negocio_id=negocio_id) if negocio_id else Gasto.objects.all()
            for gasto in gastos:
                writer.writerow([gasto.get_tipo_display(), gasto.descripcion, gasto.monto, gasto.metodo_pago, gasto.created_at])
        
        elif reporte_tipo == 'ventas':
            writer.writerow(['ID', 'Total', 'Método', 'Fecha'])
            ventas = Venta.objects.filter(negocio_id=negocio_id) if negocio_id else Venta.objects.all()
            for venta in ventas:
                writer.writerow([venta.id, venta.total, venta.metodo_pago, venta.created_at])
        
        return response

    @action(detail=False, methods=['get'])
    def ganancia_por_producto(self, request):
        """Ganancia acumulada por producto."""
        negocio_id = request.query_params.get('negocio_id')
        
        productos = Producto.objects.filter(negocio_id=negocio_id) if negocio_id else Producto.objects.all()
        
        data = []
        for producto in productos:
            # Sumar ganancia de todas las órdenes
            ordenes_ganancia = OrdenItem.objects.filter(
                producto=producto
            ).aggregate(ganancia=Sum('cantidad') * (producto.precio - producto.costo))['ganancia'] or 0
            
            data.append({
                'producto': producto.nombre,
                'sku': producto.sku,
                'ganancia': ordenes_ganancia,
                'margen_porcentaje': producto.margen_porcentaje,
            })
        
        return Response(data)


class FacturaViewSet(viewsets.ModelViewSet):
    """Boletas y facturas electrónicas (SII)."""
    serializer_class = FacturaSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['post'])
    def generar_boleta(self, request):
        """Genera la boleta de una orden o venta."""
        orden_id = request.data.get('orden_id')
        venta_id = request.data.get('venta_id')
        tipo = request.data.get('tipo', 'boleta')
        
        numero = f"BOL-{now().strftime('%Y%m%d')}-{Orden.objects.count() + Venta.objects.count()}"
        
        factura = FacturaElectronica.objects.create(
            orden_id=orden_id,
            venta_id=venta_id,
            tipo=tipo,
            numero=numero,
            total=Orden.objects.get(id=orden_id).total if orden_id else Venta.objects.get(id=venta_id).total,
            estado='generada'
        )
        
        return Response({
            'numero': factura.numero,
            'estado': factura.estado,
            'mensaje': 'Boleta generada. Estructura lista para integración con LibreDTE o similar.'
        })

    @action(detail=True, methods=['post'])
    def enviar_sii(self, request, pk=None):
        """Enviar factura al SII (requiere integración externa)."""
        factura = self.get_object()
        
        # TODO: integrar con LibreDTE o similar
        factura.estado = 'enviada'
        factura.save()
        
        return Response({
            'numero': factura.numero,
            'estado': factura.estado,
            'nota': 'Integración con SII recomendada vía LibreDTE (requiere configuración adicional)'
        })


# ── Estadísticas para el admin ─────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def estadisticas(request):
    """
    Devuelve métricas de ventas y rentabilidad. Solo para staff/admin.
    Cuenta únicamente órdenes pagadas.
    """
    items_pagados = OrdenItem.objects.filter(orden__estado='pagada')

    # Más y menos vendidos (por unidades)
    ranking = (
        items_pagados
        .values('nombre_producto')
        .annotate(unidades=Sum('cantidad'),
                  ingresos=Sum(F('precio_unitario') * F('cantidad')))
        .order_by('-unidades')
    )
    ranking = list(ranking)

    ordenes_pagadas = Orden.objects.filter(estado='pagada')
    ingresos_totales = ordenes_pagadas.aggregate(s=Sum('total'))['s'] or 0

    # Utilidad total = ingresos - costos
    costo_total = sum(
        i['c'] for i in items_pagados.values('orden').annotate(
            c=Sum(F('costo_unitario') * F('cantidad'))
        )
    ) if items_pagados.exists() else 0
    utilidad_total = ingresos_totales - costo_total

    margen_pct = round(utilidad_total / ingresos_totales * 100, 1) if ingresos_totales else 0

    return Response({
        'ordenes_pagadas': ordenes_pagadas.count(),
        'ingresos_totales': ingresos_totales,
        'costo_total': costo_total,
        'utilidad_total': utilidad_total,
        'margen_porcentaje': margen_pct,
        'mas_vendidos': ranking[:5],
        'menos_vendidos': ranking[-5:][::-1] if len(ranking) > 5 else [],
    })


# ── Config pública de la tienda ────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def tienda_config(request):
    """Lo que el front necesita para mostrar lo mismo que después cobra el backend."""
    return Response({
        'moneda': 'CLP',
        'suscripcion': {
            'descuento_pct': precios.descuento_suscripcion_pct(),
            'frecuencias_dias': list(getattr(settings, 'SUSCRIPCION_FRECUENCIAS', [])),
        },
        'envio': {'gratis_desde': int(getattr(settings, 'ENVIO_GRATIS_DESDE', 0) or 0)},
    })


# ── Login con Google ───────────────────────────────────────────────
@api_view(['POST'])
@throttle_classes([AnonRateThrottle])
def google_login(request):
    token = request.data.get('token')

    if not token:
        return Response({'error': 'Token requerido'}, status=400)

    try:
        decoded = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_OAUTH2_CLIENT_ID
        )

        email = decoded.get('email')
        name = decoded.get('name', email)
        picture = decoded.get('picture')

        if not email:
            return Response({'error': 'Token inválido'}, status=400)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'first_name': name}
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name,
                'foto': picture,
                'created': created
            }
        })
    except ValueError:
        return Response({'error': 'Token de Google inválido'}, status=401)
    except Exception:
        return Response({'error': 'Error de autenticación'}, status=400)


# ── Webpay (Transbank) ─────────────────────────────────────────────
def get_webpay_transaction():
    """
    Devuelve una instancia de Transaction configurada.
    - En integración (DEBUG=True): credenciales de prueba de Transbank.
    - En producción (DEBUG=False): credenciales reales desde variables de entorno.
    """
    if settings.DEBUG:
        return Transaction(WebpayOptions(
            commerce_code='597055555532',
            api_key='579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
            integration_type=IntegrationType.TEST
        ))
    return Transaction(WebpayOptions(
        commerce_code=settings.TBK_COMMERCE_CODE,
        api_key=settings.TBK_API_KEY,
        integration_type=IntegrationType.LIVE
    ))


def _es_true(valor):
    return valor in (True, 1, '1', 'true', 'True', 'on')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webpay_crear(request):
    """
    Recibe el carrito [{id, cantidad, suscripcion?, frecuencia_dias?}, ...], valida contra la BD,
    crea una Orden 'pendiente' y devuelve la URL + token de Webpay.
    Combos y descuento de suscripción se calculan acá: nunca se confía en el precio del front.
    """
    items = request.data.get('items', [])
    if not isinstance(items, list) or not items:
        return Response({'error': 'El carrito está vacío'}, status=400)

    pct_suscripcion = precios.descuento_suscripcion_pct()
    frecuencias = list(getattr(settings, 'SUSCRIPCION_FRECUENCIAS', []))
    pedido_por_producto = defaultdict(int)
    lineas = []
    total = 0
    for item in items:
        if not isinstance(item, dict):
            return Response({'error': 'Item inválido'}, status=400)
        try:
            producto = Producto.objects.prefetch_related('precios_escalonados').get(id=item.get('id'))
        except (Producto.DoesNotExist, ValueError, TypeError):
            return Response({'error': f"Producto {item.get('id')} no existe"}, status=400)

        try:
            cantidad = int(item.get('cantidad', 1))
        except (TypeError, ValueError):
            return Response({'error': 'Cantidad inválida'}, status=400)
        if cantidad < 1:
            continue

        es_suscripcion = _es_true(item.get('suscripcion'))
        frecuencia = None
        if es_suscripcion:
            if not producto.permite_suscripcion or pct_suscripcion <= 0:
                return Response({'error': f"{producto.nombre} no tiene suscripción disponible"}, status=400)
            try:
                frecuencia = int(item.get('frecuencia_dias') or (frecuencias[0] if frecuencias else 0))
            except (TypeError, ValueError):
                frecuencia = None
            if frecuencia not in frecuencias:
                return Response({'error': 'Frecuencia de suscripción inválida'}, status=400)

        pedido_por_producto[producto.id] += cantidad
        if producto.stock < pedido_por_producto[producto.id]:
            return Response(
                {'error': f"Stock insuficiente para {producto.nombre} (quedan {producto.stock})"},
                status=400
            )

        unitario = precios.precio_unitario(producto, cantidad, suscripcion=es_suscripcion)
        total += unitario * cantidad
        lineas.append((producto, cantidad, unitario, es_suscripcion, frecuencia))

    if total <= 0:
        return Response({'error': 'Total inválido'}, status=400)

    # buy_order: único, máx 26 caracteres para Webpay
    buy_order = uuid.uuid4().hex[:26]
    session_id = str(request.user.id)
    umbral_envio = int(getattr(settings, 'ENVIO_GRATIS_DESDE', 0) or 0)

    orden = Orden.objects.create(
        usuario=request.user,
        total=total,
        estado='pendiente',
        buy_order=buy_order,
        envio_gratis=umbral_envio > 0 and total >= umbral_envio,
    )
    for producto, cantidad, unitario, es_suscripcion, frecuencia in lineas:
        OrdenItem.objects.create(
            orden=orden,
            producto=producto,
            nombre_producto=producto.nombre,
            precio_unitario=unitario,
            costo_unitario=producto.costo,
            cantidad=cantidad,
            es_suscripcion=es_suscripcion,
            frecuencia_dias=frecuencia,
        )

    try:
        tx = get_webpay_transaction()
        response = tx.create(buy_order, session_id, total, settings.WEBPAY_RETURN_URL)
        orden.token_ws = response['token']
        orden.save()
        return Response({
            'url': response['url'],
            'token': response['token'],
            'orden_id': orden.id,
            'total': total,
        })
    except Exception as e:
        orden.estado = 'rechazada'
        orden.save()
        return Response({'error': f'Error al iniciar el pago: {str(e)}'}, status=500)


def _items_orden(orden):
    return [
        {
            'id': i.producto_id,
            'nombre': i.nombre_producto,
            'cantidad': i.cantidad,
            'precio_unitario': i.precio_unitario,
            'suscripcion': i.es_suscripcion,
        }
        for i in orden.items.all()
    ]


def _ip_cliente(request):
    reenviada = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return reenviada.split(',')[0].strip() if reenviada else request.META.get('REMOTE_ADDR')


def _registrar_suscripciones(orden):
    """Crea (o renueva) la suscripción de cada item pagado con suscripción."""
    hoy = now().date()
    pct = precios.descuento_suscripcion_pct()
    for item in orden.items.filter(es_suscripcion=True).select_related('producto'):
        if not item.producto:
            continue
        frecuencia = item.frecuencia_dias or 30
        Suscripcion.objects.update_or_create(
            usuario=orden.usuario,
            producto=item.producto,
            activa=True,
            defaults={
                'nombre_producto': item.nombre_producto,
                'cantidad': item.cantidad,
                'frecuencia_dias': frecuencia,
                'descuento_pct': pct,
                'proxima_fecha': hoy + timedelta(days=frecuencia),
                'recordatorio_enviado_para': None,
                'orden_origen': orden,
            },
        )


@api_view(['POST', 'GET'])
def webpay_confirmar(request):
    """
    Webpay redirige al front con un token_ws y el front lo manda acá.
    Confirmamos contra Transbank, actualizamos la orden, descontamos stock,
    registramos suscripciones y avisamos la compra a Meta (CAPI).
    """
    token = request.data.get('token_ws') or request.query_params.get('token_ws')
    if not token:
        return Response({'error': 'Token no recibido'}, status=400)

    try:
        orden = Orden.objects.get(token_ws=token)
    except Orden.DoesNotExist:
        return Response({'error': 'Orden no encontrada'}, status=404)

    # idempotente: si recargan /pago/retorno no se confirma ni se descuenta stock 2 veces
    if orden.estado == 'pagada':
        return Response({'estado': 'pagada', 'orden_id': orden.id, 'total': orden.total, 'items': _items_orden(orden)})
    if orden.estado == 'rechazada':
        return Response({'estado': 'rechazada', 'orden_id': orden.id})

    try:
        tx = get_webpay_transaction()
        result = tx.commit(token)

        aprobada = result.get('status') == 'AUTHORIZED' and result.get('response_code') == 0
        if not aprobada:
            orden.estado = 'rechazada'
            orden.save()
            return Response({'estado': 'rechazada', 'orden_id': orden.id})

        with transaction.atomic():
            orden.estado = 'pagada'
            orden.authorization_code = result.get('authorization_code', '')
            orden.payment_type_code = result.get('payment_type_code', '')
            orden.save()
            # Descontar stock ahora que el pago está confirmado
            for item in orden.items.select_related('producto'):
                if item.producto:
                    item.producto.stock = max(0, item.producto.stock - item.cantidad)
                    item.producto.save()
            _registrar_suscripciones(orden)
    except Exception as e:
        return Response({'error': f'Error al confirmar el pago: {str(e)}'}, status=500)

    meta_capi.enviar_purchase(
        orden,
        ip=_ip_cliente(request),
        user_agent=request.META.get('HTTP_USER_AGENT'),
        fbp=request.data.get('fbp'),
        fbc=request.data.get('fbc'),
    )
    return Response({'estado': 'pagada', 'orden_id': orden.id, 'total': orden.total, 'items': _items_orden(orden)})


# ── Cliente ────────────────────────────────────────────────────────
class HistorialComprasView(generics.ListAPIView):
    """Historial de compras del usuario logueado."""
    serializer_class = OrdenClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Solo las órdenes del usuario logueado, y solo las que avanzaron de 'pendiente'.
        return Orden.objects.filter(usuario=self.request.user).exclude(estado='pendiente')


class MisSuscripcionesView(generics.ListAPIView):
    """Suscripciones activas del usuario logueado."""
    serializer_class = SuscripcionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Suscripcion.objects.filter(usuario=self.request.user, activa=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancelar_suscripcion(request, pk):
    suscripcion = get_object_or_404(Suscripcion, pk=pk, usuario=request.user)
    suscripcion.activa = False
    suscripcion.save()
    return Response(SuscripcionSerializer(suscripcion).data)
