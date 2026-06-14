from django.contrib import admin
from django.utils.html import format_html
from .models import Producto, ProductoImagen, Orden, OrdenItem


class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 3
    fields = ['imagen']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    inlines = [ProductoImagenInline]
    list_display = ('nombre', 'categoria', 'precio', 'costo', 'margen_col', 'stock', 'estado_stock')
    list_filter = ('categoria',)
    search_fields = ('nombre',)
    list_editable = ('precio', 'costo', 'stock')
    fieldsets = (
        ('Información del producto', {
            'fields': ('nombre', 'categoria', 'descripcion', 'descripcion_larga', 'imagen_principal')
        }),
        ('Precio y rentabilidad', {
            'fields': ('precio', 'costo', 'stock'),
            'description': 'El "costo" es lo que te cuesta a ti el producto. El margen se calcula solo. Nunca se muestra al cliente.'
        }),
    )

    def margen_col(self, obj):
        color = '#4caf50' if obj.margen_porcentaje >= 30 else ('#f5c800' if obj.margen_porcentaje >= 10 else '#ff6b6b')
        return format_html(
            '<b style="color:{}">${} ({}%)</b>',
            color, f"{obj.margen_unitario:,}".replace(",", "."), obj.margen_porcentaje
        )
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
    list_display = ('id', 'usuario', 'total_col', 'utilidad_col', 'estado_col', 'created_at')
    list_filter = ('estado', 'created_at')
    search_fields = ('usuario__email', 'buy_order')
    readonly_fields = ('usuario', 'total', 'buy_order', 'token_ws', 'authorization_code',
                       'payment_type_code', 'created_at', 'updated_at')

    def total_col(self, obj):
        return format_html('<b>${}</b>', f"{obj.total:,}".replace(",", "."))
    total_col.short_description = 'Total'

    def utilidad_col(self, obj):
        return format_html('<span style="color:#4caf50">${}</span>', f"{obj.utilidad:,}".replace(",", "."))
    utilidad_col.short_description = 'Utilidad'

    def estado_col(self, obj):
        colores = {
            'pagada': '#4caf50', 'pendiente': '#f5c800', 'rechazada': '#ff6b6b',
            'preparando': '#4a9eff', 'entregada': '#9c7bff', 'cancelada': '#888'
        }
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>',
            colores.get(obj.estado, '#fff'), obj.get_estado_display()
        )
    estado_col.short_description = 'Estado'


# ── Proxy de Calefacción (lo que ya tenías) ────────────────────────
class CalefaccionProxy(Producto):
    class Meta:
        proxy = True
        verbose_name = 'Calefacción'
        verbose_name_plural = 'Calefacción'


@admin.register(CalefaccionProxy)
class CalefaccionAdmin(ProductoAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(categoria='calefaccion')
