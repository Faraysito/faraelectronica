from rest_framework import serializers
from .models import (
    Producto, Orden, OrdenItem, Gasto, Venta, VentaItem,
    MetodoPago, Negocio, FacturaElectronica
)


class NegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = ['id', 'nombre', 'slug', 'descripcion', 'color_primario', 'color_secundario', 'es_activo']


class ProductoSerializer(serializers.ModelSerializer):
    margen_porcentaje = serializers.ReadOnlyField()
    margen_unitario = serializers.ReadOnlyField()
    agotado = serializers.ReadOnlyField()

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'sku', 'precio', 'costo', 'stock', 'descripcion', 
                  'imagen_principal', 'categoria', 'margen_porcentaje', 'margen_unitario', 'agotado']


class OrdenItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrdenItem
        fields = ['id', 'nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal']


class OrdenSerializer(serializers.ModelSerializer):
    items = OrdenItemSerializer(many=True, read_only=True)
    costo_total = serializers.ReadOnlyField()
    utilidad = serializers.ReadOnlyField()
    metodo_pago_nombre = serializers.CharField(source='metodo_pago.get_tipo_display', read_only=True)

    class Meta:
        model = Orden
        fields = ['id', 'usuario', 'total', 'estado', 'tipo_venta', 'metodo_pago', 
                  'metodo_pago_nombre', 'items', 'costo_total', 'utilidad', 'created_at']


class GastoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Gasto
        fields = ['id', 'tipo', 'tipo_display', 'descripcion', 'monto', 'metodo_pago', 'created_at']


class VentaItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = VentaItem
        fields = ['id', 'nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal']


class VentaSerializer(serializers.ModelSerializer):
    items = VentaItemSerializer(many=True, read_only=True)
    costo_total = serializers.ReadOnlyField()
    utilidad = serializers.ReadOnlyField()
    metodo_pago_nombre = serializers.CharField(source='metodo_pago.get_tipo_display', read_only=True)

    class Meta:
        model = Venta
        fields = ['id', 'total', 'estado', 'metodo_pago', 'metodo_pago_nombre', 
                  'items', 'costo_total', 'utilidad', 'notas', 'created_at']


class FacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacturaElectronica
        fields = ['id', 'numero', 'tipo', 'estado', 'total', 'created_at']
