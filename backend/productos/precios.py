"""Precios del lado del servidor: combos (precio por cantidad) y descuento de suscripción.

El front muestra lo mismo usando `tramos` del serializer, pero el que cobra es esto.
"""
from django.conf import settings


def aplicar_pct(precio, pct):
    """Aplica un % de descuento redondeando a favor del cliente (piso)."""
    return precio * (100 - pct) // 100


def descuento_suscripcion_pct():
    try:
        pct = int(getattr(settings, 'SUSCRIPCION_DESCUENTO_PCT', 0) or 0)
    except (TypeError, ValueError):
        return 0
    return max(0, min(pct, 90))


def tramos_producto(producto):
    """Tramos [{min, max, precio_unitario}] ordenados por cantidad mínima.

    Si el producto tiene precios escalonados en el admin se usan esos; si no,
    los % globales de COMBO_DESCUENTOS (ej: {2: 10, 3: 15}).
    """
    escalonados = sorted(producto.precios_escalonados.all(), key=lambda e: e.cantidad_minima)
    if escalonados:
        return [
            {'min': e.cantidad_minima, 'max': e.cantidad_maxima, 'precio_unitario': e.precio}
            for e in escalonados
        ]
    tramos = []
    for cantidad, pct in sorted((getattr(settings, 'COMBO_DESCUENTOS', {}) or {}).items()):
        cantidad, pct = int(cantidad), int(pct)
        if cantidad > 1 and 0 < pct < 100:
            tramos.append({'min': cantidad, 'max': None, 'precio_unitario': aplicar_pct(producto.precio, pct)})
    return tramos


def tramo_para(tramos, cantidad):
    """El tramo con mayor cantidad mínima que aplica a `cantidad` (o None)."""
    candidatos = [
        t for t in tramos
        if t['min'] <= cantidad and (t['max'] is None or cantidad <= t['max'])
    ]
    return max(candidatos, key=lambda t: t['min']) if candidatos else None


def precio_unitario(producto, cantidad=1, suscripcion=False):
    tramo = tramo_para(tramos_producto(producto), cantidad)
    unitario = tramo['precio_unitario'] if tramo else producto.precio
    if suscripcion:
        unitario = aplicar_pct(unitario, descuento_suscripcion_pct())
    return unitario
