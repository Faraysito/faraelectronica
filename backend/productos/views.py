import uuid
from rest_framework import generics
from rest_framework.decorators import api_view, throttle_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Sum, Count, F
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import Producto, Orden, OrdenItem
from .serializers import ProductoSerializer, OrdenSerializer

# ── Transbank / Webpay ─────────────────────────────────────────────
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.integration_type import IntegrationType
from transbank.common.options import WebpayOptions


def get_webpay_transaction():
    """
    Devuelve una instancia de Transaction configurada.
    - En integración (DEBUG=True): usa credenciales de prueba de Transbank.
    - En producción (DEBUG=False): usa TUS credenciales reales desde variables de entorno.
    """
    if settings.DEBUG:
        # Credenciales de PRUEBA (plata falsa). Vienen pre-cargadas en el SDK.
        return Transaction(WebpayOptions(
            commerce_code='597055555532',
            api_key='579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
            integration_type=IntegrationType.TEST
        ))
    else:
        # Credenciales REALES de producción (las pones en Render como variables de entorno).
        return Transaction(WebpayOptions(
            commerce_code=settings.TBK_COMMERCE_CODE,
            api_key=settings.TBK_API_KEY,
            integration_type=IntegrationType.LIVE
        ))


# ── Productos ──────────────────────────────────────────────────────
class ProductoListView(generics.ListAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_queryset(self):
        categoria = self.request.query_params.get('categoria')
        if categoria:
            return Producto.objects.filter(categoria__iexact=categoria)
        return Producto.objects.all()


class ProductoDetailView(generics.RetrieveAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer


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


# ── Webpay: crear transacción ──────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def webpay_crear(request):
    """
    Recibe el carrito [{id, cantidad}, ...], valida contra la BD,
    crea una Orden 'pendiente' y devuelve la URL + token de Webpay
    para redirigir al usuario al formulario de pago.
    """
    items = request.data.get('items', [])
    if not items:
        return Response({'error': 'El carrito está vacío'}, status=400)

    # Recalcular TODO en el servidor. Nunca confiar en el precio que manda el front.
    orden_items = []
    total = 0
    for item in items:
        try:
            producto = Producto.objects.get(id=item.get('id'))
        except Producto.DoesNotExist:
            return Response({'error': f"Producto {item.get('id')} no existe"}, status=400)

        cantidad = int(item.get('cantidad', 1))
        if cantidad < 1:
            continue

        if producto.stock < cantidad:
            return Response(
                {'error': f"Stock insuficiente para {producto.nombre} (quedan {producto.stock})"},
                status=400
            )

        total += producto.precio * cantidad
        orden_items.append((producto, cantidad))

    if total <= 0:
        return Response({'error': 'Total inválido'}, status=400)

    # buy_order: único, máx 26 caracteres para Webpay
    buy_order = uuid.uuid4().hex[:26]
    session_id = str(request.user.id)
    return_url = f"{settings.WEBPAY_RETURN_URL}"

    orden = Orden.objects.create(
        usuario=request.user,
        total=total,
        estado='pendiente',
        buy_order=buy_order,
    )
    for producto, cantidad in orden_items:
        OrdenItem.objects.create(
            orden=orden,
            producto=producto,
            nombre_producto=producto.nombre,
            precio_unitario=producto.precio,
            costo_unitario=producto.costo,
            cantidad=cantidad,
        )

    try:
        tx = get_webpay_transaction()
        response = tx.create(buy_order, session_id, total, return_url)
        orden.token_ws = response['token']
        orden.save()
        return Response({
            'url': response['url'],
            'token': response['token'],
        })
    except Exception as e:
        orden.estado = 'rechazada'
        orden.save()
        return Response({'error': f'Error al iniciar el pago: {str(e)}'}, status=500)


# ── Webpay: confirmar transacción (retorno) ────────────────────────
@api_view(['POST', 'GET'])
def webpay_confirmar(request):
    """
    Webpay redirige aquí tras el pago con un token_ws.
    Confirmamos contra Transbank, actualizamos la orden y descontamos stock.
    """
    token = request.data.get('token_ws') or request.query_params.get('token_ws')
    if not token:
        return Response({'error': 'Token no recibido'}, status=400)

    try:
        orden = Orden.objects.get(token_ws=token)
    except Orden.DoesNotExist:
        return Response({'error': 'Orden no encontrada'}, status=404)

    try:
        tx = get_webpay_transaction()
        result = tx.commit(token)

        aprobada = result.get('status') == 'AUTHORIZED' and result.get('response_code') == 0

        if aprobada:
            orden.estado = 'pagada'
            orden.authorization_code = result.get('authorization_code', '')
            orden.payment_type_code = result.get('payment_type_code', '')
            orden.save()
            # Descontar stock ahora que el pago está confirmado
            for item in orden.items.all():
                if item.producto:
                    item.producto.stock = max(0, item.producto.stock - item.cantidad)
                    item.producto.save()
            return Response({'estado': 'pagada', 'orden_id': orden.id, 'total': orden.total})
        else:
            orden.estado = 'rechazada'
            orden.save()
            return Response({'estado': 'rechazada', 'orden_id': orden.id})
    except Exception as e:
        return Response({'error': f'Error al confirmar el pago: {str(e)}'}, status=500)


# ── Historial de compras del cliente ───────────────────────────────
class HistorialComprasView(generics.ListAPIView):
    serializer_class = OrdenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Solo las órdenes del usuario logueado, y solo las que avanzaron de 'pendiente'.
        return Orden.objects.filter(usuario=self.request.user).exclude(estado='pendiente')


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
