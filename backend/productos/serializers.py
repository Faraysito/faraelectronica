from django.db.models import Avg, Count
from rest_framework import serializers
from .models import (
    Producto, ProductoImagen, Orden, OrdenItem, Gasto, Venta, VentaItem,
    MetodoPago, Negocio, FacturaElectronica, Resena, Suscripcion
)
from . import precios

MAX_FOTO_MB = 5


class NegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = ['id', 'nombre', 'slug', 'descripcion', 'color_primario', 'color_secundario', 'es_activo']


class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['imagen']


def _lineas(texto):
    return [l.strip() for l in (texto or '').splitlines() if l.strip()]


class ProductoSerializer(serializers.ModelSerializer):
    """Catálogo público. OJO: 'costo' y márgenes NO se exponen (info interna del negocio)."""
    agotado = serializers.ReadOnlyField()
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    tramos = serializers.SerializerMethodField()
    especificaciones = serializers.SerializerMethodField()
    certificaciones = serializers.SerializerMethodField()
    rating_promedio = serializers.SerializerMethodField()
    rating_total = serializers.SerializerMethodField()
    complementos = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'sku', 'precio', 'stock', 'agotado', 'descripcion', 'descripcion_larga',
            'imagen_principal', 'imagenes', 'categoria', 'titular', 'especificaciones', 'modo_uso',
            'ficha_tecnica_url', 'certificaciones', 'permite_suscripcion', 'tramos',
            'rating_promedio', 'rating_total', 'complementos',
        ]

    def get_tramos(self, obj):
        return precios.tramos_producto(obj)

    def get_especificaciones(self, obj):
        specs = []
        for linea in _lineas(obj.especificaciones):
            nombre, _, valor = linea.partition(':')
            specs.append({'nombre': nombre.strip(), 'valor': valor.strip()} if valor else {'nombre': '', 'valor': linea})
        return specs

    def get_certificaciones(self, obj):
        return _lineas(obj.certificaciones)

    def _rating(self, obj):
        # viene anotado desde el viewset; si no, se calcula
        if not hasattr(obj, 'rating_avg'):
            datos = obj.resenas.filter(visible=True).aggregate(a=Avg('calificacion'), c=Count('id'))
            obj.rating_avg, obj.rating_count = datos['a'], datos['c']
        return obj.rating_avg, obj.rating_count

    def get_rating_promedio(self, obj):
        promedio, _ = self._rating(obj)
        return round(float(promedio), 1) if promedio else None

    def get_rating_total(self, obj):
        _, total = self._rating(obj)
        return total or 0


class ResenaSerializer(serializers.ModelSerializer):
    autor = serializers.ReadOnlyField(source='autor_publico')
    foto = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Resena
        fields = ['id', 'autor', 'calificacion', 'titulo', 'comentario', 'foto', 'compra_verificada', 'created_at']
        read_only_fields = ['id', 'autor', 'compra_verificada', 'created_at']

    def validate_foto(self, foto):
        if foto and foto.size > MAX_FOTO_MB * 1024 * 1024:
            raise serializers.ValidationError(f'La foto no puede pesar más de {MAX_FOTO_MB} MB.')
        return foto


class SuscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suscripcion
        fields = ['id', 'producto', 'nombre_producto', 'cantidad', 'frecuencia_dias', 'descuento_pct',
                  'activa', 'proxima_fecha', 'created_at']


class OrdenItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrdenItem
        fields = ['id', 'nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal']


class OrdenSerializer(serializers.ModelSerializer):
    """Gestión (admin). Incluye costos/utilidad."""
    items = OrdenItemSerializer(many=True, read_only=True)
    costo_total = serializers.ReadOnlyField()
    utilidad = serializers.ReadOnlyField()
    metodo_pago_nombre = serializers.CharField(source='metodo_pago.get_tipo_display', read_only=True)

    class Meta:
        model = Orden
        fields = ['id', 'usuario', 'total', 'estado', 'tipo_venta', 'metodo_pago', 
                  'metodo_pago_nombre', 'items', 'costo_total', 'utilidad', 'created_at']


class OrdenClienteItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrdenItem
        fields = ['nombre_producto', 'precio_unitario', 'cantidad', 'subtotal', 'es_suscripcion', 'frecuencia_dias']


class OrdenClienteSerializer(serializers.ModelSerializer):
    """Historial de compras del cliente (sin costos)."""
    items = OrdenClienteItemSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Orden
        fields = ['id', 'total', 'estado', 'estado_display', 'envio_gratis', 'created_at', 'items']


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
