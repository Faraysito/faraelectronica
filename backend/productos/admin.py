from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Producto, ProductoImagen, Orden, OrdenItem, Gasto, Venta, VentaItem,
    MetodoPago, Negocio, FacturaElectronica, PrecioEscalonado
)


@admin.register(Negocio)
class NegocioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'owner', 'es_activo', 'created_at')
    list_filter = ('es_activo',)
    search_fields = ('nombre', 'slug')


class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 1


class PrecioEscalonadoInline(admin.TabularInline):
    model = PrecioEscalonado
    extra = 1


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    inlines = [ProductoImagenInline, PrecioEscalonadoInline]
    list_display = ('nombre', 'sku', 'categoria', 'precio', 'costo', 'margen_col', 'stock', 'estado_stock')
    list_filter = ('categoria',)
    search_fields = ('nombre', 'sku')
    list_editable = ('precio', 'costo', 'stock')
    fieldsets = (
        ('Información', {
            'fields': ('nombre', 'sku', 'categoria', 'descripcion', 'descripcion_larga', 'imagen_principal')
        }),
        ('Precios y Rentabilidad', {
            'fields': ('precio', 'costo', 'stock'),
        }),
    )

    def margen_col(self, obj):
        color = '#4caf50' if obj.margen_porcentaje >= 30 else ('#f5c800' if obj.margen_porcentaje >= 10 else '#ff6b6b')
        return format_html('<b style="color:{}">${} ({}%)</b>', color, f"{obj.margen_unitario:,}".replace(",", "."), obj.margen_porcentaje)
    margen_col.short_description = 'Margen'

    def estado_stock(self, obj):
        if obj.agotado:
            return format_html('<span style="color:#ff6b6b;font-weight:600">AGOTADO</span>')
        elif obj.stock <= 5:
            return format_html('<span style="color:#f5c800;font-weight:600">BAJO ({})</span>', obj.stock)
        return format_html('<span style="color:#4caf50">OK</span>')
    estado_stock.short_description = 'Estado'


class OrdenItemInline(admin.TabularInline):
    model = OrdenItem
    extra = 0
    can_delete = False
    readonly_fields = ('nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal')
    fields = ('nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal')

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    inlines = [OrdenItemInline]
    list_display = ('id', 'usuario', 'tipo_venta', 'total_col', 'utilidad_col', 'estado_col', 'metodo_pago', 'created_at')
    list_filter = ('estado', 'tipo_venta', 'created_at')
    search_fields = ('usuario__email', 'buy_order')
    readonly_fields = ('usuario', 'total', 'buy_order', 'costo_total', 'utilidad', 'created_at', 'updated_at')

    def total_col(self, obj):
        return format_html('<b>${}</b>', f"{obj.total:,}".replace(",", "."))
    total_col.short_description = 'Total'

    def utilidad_col(self, obj):
        return format_html('<span style="color:#4caf50">${}</span>', f"{obj.utilidad:,}".replace(",", "."))
    utilidad_col.short_description = 'Utilidad'

    def estado_col(self, obj):
        colores = {'pagada': '#4caf50', 'pendiente': '#f5c800', 'rechazada': '#ff6b6b', 'preparando': '#4a9eff', 'entregada': '#9c7bff', 'cancelada': '#888'}
        return format_html('<span style="color:{};font-weight:600">{}</span>', colores.get(obj.estado, '#000'), obj.get_estado_display())
    estado_col.short_description = 'Estado'


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    list_display = ('get_tipo_display', 'descripcion_corta', 'monto', 'metodo_pago', 'created_at')
    list_filter = ('tipo', 'created_at')
    search_fields = ('descripcion',)
    fieldsets = (
        ('Información del Gasto', {
            'fields': ('tipo', 'descripcion', 'monto', 'metodo_pago', 'comprobante')
        }),
    )

    def descripcion_corta(self, obj):
        return obj.descripcion[:50] + '...' if len(obj.descripcion) > 50 else obj.descripcion
    descripcion_corta.short_description = 'Descripción'


class VentaItemInline(admin.TabularInline):
    model = VentaItem
    extra = 0
    can_delete = False
    readonly_fields = ('nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal')
    fields = ('nombre_producto', 'precio_unitario', 'costo_unitario', 'cantidad', 'subtotal')


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    inlines = [VentaItemInline]
    list_display = ('id', 'total_col', 'utilidad_col', 'metodo_pago', 'estado', 'created_at')
    list_filter = ('estado', 'created_at')
    readonly_fields = ('total', 'costo_total', 'utilidad', 'created_at')

    def total_col(self, obj):
        return format_html('<b>${}</b>', f"{obj.total:,}".replace(",", "."))
    total_col.short_description = 'Total'

    def utilidad_col(self, obj):
        return format_html('<span style="color:#4caf50">${}</span>', f"{obj.utilidad:,}".replace(",", "."))
    utilidad_col.short_description = 'Utilidad'


@admin.register(MetodoPago)
class MetodoPagoAdmin(admin.ModelAdmin):
    list_display = ('get_tipo_display', 'descripcion', 'es_activo')
    list_filter = ('es_activo',)


@admin.register(FacturaElectronica)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('numero', 'tipo', 'estado', 'total', 'created_at')
    list_filter = ('estado', 'tipo', 'created_at')
    search_fields = ('numero',)
    readonly_fields = ('numero', 'xml_dte', 'respuesta_sii')
