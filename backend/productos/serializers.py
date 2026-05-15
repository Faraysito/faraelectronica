from rest_framework import serializers
from .models import Producto, ProductoImagen

class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['imagen']

class ProductoSerializer(serializers.ModelSerializer):
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    imagen_principal = serializers.ImageField(use_url=True)

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'precio', 'descripcion', 'descripcion_larga', 'imagen_principal', 'categoria', 'imagenes']