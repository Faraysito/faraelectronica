from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils.timezone import now, timedelta
from datetime import datetime
import csv
from django.http import HttpResponse
from .models import (
    Producto, Orden, OrdenItem, Gasto, Venta, VentaItem, 
    MetodoPago, Negocio, FacturaElectronica, PrecioEscalonado
)
from .serializers import (
    ProductoSerializer, OrdenSerializer, GastoSerializer, 
    VentaSerializer, FacturaSerializer, NegocioSerializer
)


class NegocioViewSet(viewsets.ModelViewSet):
    """Multi-negocio: gestionar varios negocios por usuario."""
    serializer_class = NegocioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Negocio.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProductoViewSet(viewsets.ModelViewSet):
    """1. INVENTARIO: stock, categorías, SKU, precio por cantidad."""
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        negocio_id = self.request.query_params.get('negocio_id')
        if negocio_id:
            return Producto.objects.filter(negocio_id=negocio_id)
        return Producto.objects.all()

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Listar productos por categoría."""
        categoria = request.query_params.get('categoria')
        productos = Producto.objects.filter(categoria=categoria)
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ajustar_stock(self, request):
        """Ajustar stock manualmente."""
        producto = self.get_object()
        cantidad = request.data.get('cantidad')
        producto.stock = cantidad
        producto.save()
        return Response({'stock': producto.stock})

    @action(detail=True, methods=['get'])
    def precios_escalonados(self, request):
        """Ver precios por cantidad."""
        producto = self.get_object()
        precios = PrecioEscalonado.objects.filter(producto=producto)
        data = [{'min': p.cantidad_minima, 'max': p.cantidad_maxima, 'precio': p.precio} 
                for p in precios]
        return Response(data)


class OrdenViewSet(viewsets.ModelViewSet):
    """Órdenes web + presenciales. 1. POS 4. Métodos de pago."""
    serializer_class = OrdenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Orden.objects.filter(usuario=self.request.user)

    @action(detail=False, methods=['post'])
    def crear_venta_manual(self, request):
        """1. POS - Registrar venta presencial rápidamente."""
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
        """4. Métodos de pago - Marcar método de pago de una orden."""
        orden_id = request.data.get('orden_id')
        metodo_pago_id = request.data.get('metodo_pago_id')
        
        orden = Orden.objects.get(id=orden_id)
        orden.metodo_pago_id = metodo_pago_id
        orden.save()
        
        return Response({'status': 'Método de pago registrado'})


class GastoViewSet(viewsets.ModelViewSet):
    """3. INGRESOS/EGRESOS - Libro de caja, registrar gastos."""
    serializer_class = GastoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        negocio_id = self.request.query_params.get('negocio_id')
        if negocio_id:
            return Gasto.objects.filter(negocio_id=negocio_id)
        return Gasto.objects.all()

    @action(detail=False, methods=['get'])
    def balance_del_mes(self, request):
        """3. Balance - Caja del mes actual."""
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
    """1. POS - Ventas presenciales rápidas."""
    serializer_class = VentaSerializer
    permission_classes = [IsAuthenticated]

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
    """5. REPORTES descargables + estadísticas en tiempo real."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """5. Estadísticas en vivo - Dashboard."""
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
        """5. Reportes - Descargar en CSV."""
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
    """7. FACTURACIÓN SII - Boletas/Facturas electrónicas."""
    serializer_class = FacturaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def generar_boleta(self, request):
        """7. Generar boleta de orden o venta."""
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
        
        # Placeholder: aquí irá la integración con LibreDTE o similar
        factura.estado = 'enviada'
        factura.save()
        
        return Response({
            'numero': factura.numero,
            'estado': factura.estado,
            'nota': 'Integración con SII recomendada vía LibreDTE (requiere configuración adicional)'
        })


def estadisticas(request):
    """Endpoint existente, ahora mejorado."""
    negocio_id = request.query_params.get('negocio_id')
    
    # Misma lógica que en ReportesViewSet.estadisticas
    ordenes = Orden.objects.filter(negocio_id=negocio_id) if negocio_id else Orden.objects.all()
    ventas = Venta.objects.filter(negocio_id=negocio_id) if negocio_id else Venta.objects.all()
    gastos = Gasto.objects.filter(negocio_id=negocio_id) if negocio_id else Gasto.objects.all()
    
    ingresos_web = ordenes.filter(estado='pagada').aggregate(Sum('total'))['total__sum'] or 0
    ingresos_presencial = ventas.aggregate(Sum('total'))['total__sum'] or 0
    
    return Response({
        'ingresos_web': ingresos_web,
        'ingresos_presencial': ingresos_presencial,
        'ingresos_totales': ingresos_web + ingresos_presencial,
        'egresos': gastos.aggregate(Sum('monto'))['monto__sum'] or 0,
        'ganancia': (ordenes.filter(estado='pagada').aggregate(Sum('utilidad'))['utilidad__sum'] or 0) + 
                   (ventas.aggregate(Sum('utilidad'))['utilidad__sum'] or 0),
    })


# ── Webpay (Transbank) ─────────────────────────────────────────────
from rest_framework.decorators import api_view, permission_classes
from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, F

def get_webpay_transaction():
    """Simular instancia Webpay. En producción usar SDK real de Transbank."""
    class MockWebpay:
        def create(self, buy_order, session_id, amount, return_url):
            return {'url': 'https://webpay.test.com', 'token': f'token_{buy_order}'}
        def commit(self, token):
            return {'status': 'AUTHORIZED', 'response_code': 0, 'authorization_code': '123456'}
    return MockWebpay()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webpay_crear(request):
    """Crear pago Webpay. Genera token y retorna URL de redirección."""
    try:
        orden_id = request.data.get('orden_id')
        orden = Orden.objects.get(id=orden_id, usuario=request.user)
        
        buy_order = f"ORD-{orden.id}-{now().timestamp()}"
        orden.buy_order = buy_order
        orden.save()
        
        return Response({'mensaje': 'Orden creada. Webpay mock listo para integración real.'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST', 'GET'])
def webpay_confirmar(request):
    """Confirmar pago Webpay."""
    token = request.data.get('token_ws') or request.query_params.get('token_ws')
    if not token:
        return Response({'error': 'Token no recibido'}, status=400)

    try:
        orden = Orden.objects.get(token_ws=token)
        orden.estado = 'pagada'
        orden.save()
        
        # Descontar stock
        for item in orden.items.all():
            if item.producto:
                item.producto.stock = max(0, item.producto.stock - item.cantidad)
                item.producto.save()
        
        return Response({'estado': 'pagada', 'orden_id': orden.id})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


class HistorialComprasView(generics.ListAPIView):
    """Historial de compras del usuario logueado."""
    serializer_class = OrdenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Orden.objects.filter(usuario=self.request.user).exclude(estado='pendiente')


@api_view(['GET'])
@permission_classes([IsAdminUser])
def google_login(request):
    """Placeholder para Google OAuth. Implementar en frontend."""
    return Response({'mensaje': 'Google login endpoint. Configurar en frontend.'})
