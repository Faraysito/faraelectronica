from rest_framework import serializers
from .models import Producto, ProductoImagen, Orden, OrdenItem


class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['imagen']


class ProductoSerializer(serializers.ModelSerializer):
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    imagen_principal = serializers.ImageField(use_url=True)
    agotado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        # OJO: 'costo' NO se expone en la API pública (es información interna del negocio).
        fields = [
            'id', 'nombre', 'precio', 'stock', 'agotado',
            'descripcion', 'descripcion_larga', 'imagen_principal',
            'categoria', 'imagenes'
        ]


class OrdenItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrdenItem
        fields = ['nombre_producto', 'precio_unitario', 'cantidad', 'subtotal']


class OrdenSerializer(serializers.ModelSerializer):
    """Usado para el historial de compras del cliente."""
    items = OrdenItemSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Orden
        fields = ['id', 'total', 'estado', 'estado_display', 'created_at', 'items']
