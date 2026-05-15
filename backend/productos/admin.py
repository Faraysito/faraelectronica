from django.contrib import admin
from .models import Producto, ProductoImagen

class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 3  # Espacios vacíos para subir fotos
    fields = ['imagen']

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    inlines = [ProductoImagenInline]
    list_display = ('nombre', 'categoria', 'precio')
    list_filter = ('categoria',)
    search_fields = ('nombre',)

# Configuración para el Proxy de Calefacción
class CalefaccionProxy(Producto):
    class Meta:
        proxy = True
        verbose_name = 'Calefacción'
        verbose_name_plural = 'Calefacción'

@admin.register(CalefaccionProxy)
class CalefaccionAdmin(admin.ModelAdmin):
    inlines = [ProductoImagenInline]
    def get_queryset(self, request):
        return super().get_queryset(request).filter(categoria='calefaccion')