from django.db import models
from django.contrib.auth.models import User


class Producto(models.Model):
    CATEGORIA_CHOICES = [
        ('camaras', 'Cámaras de Seguridad'),
        ('calefaccion', 'Calefacción'),
    ]

    nombre = models.CharField(max_length=100)
    precio = models.IntegerField(help_text="Precio de venta al público")
    costo = models.IntegerField(
        default=0,
        help_text="Costo de compra/adquisición. Se usa para calcular el margen de ganancia. No se muestra al cliente."
    )
    stock = models.IntegerField(
        default=0,
        help_text="Unidades disponibles. Si es 0, el producto aparece como agotado."
    )
    descripcion = models.TextField(help_text="Descripción corta para la card")
    descripcion_larga = models.TextField(null=True, blank=True, help_text="Descripción detallada para el modal")
    imagen_principal = models.ImageField(upload_to='productos/')
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='camaras')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nombre

    @property
    def margen_unitario(self):
        """Ganancia por unidad (precio - costo)."""
        return self.precio - self.costo

    @property
    def margen_porcentaje(self):
        """Margen de ganancia en % sobre el precio de venta."""
        if self.precio == 0:
            return 0
        return round((self.precio - self.costo) / self.precio * 100, 1)

    @property
    def agotado(self):
        return self.stock <= 0


class ProductoImagen(models.Model):
    producto = models.ForeignKey(Producto, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='productos/galeria/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Imagen de {self.producto.nombre}"


class Orden(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de pago'),
        ('pagada', 'Pagada'),
        ('rechazada', 'Rechazada'),
        ('preparando', 'Preparando'),
        ('entregada', 'Entregada'),
        ('cancelada', 'Cancelada'),
    ]

    usuario = models.ForeignKey(User, related_name='ordenes', on_delete=models.CASCADE)
    total = models.IntegerField(default=0, help_text="Total en CLP, calculado en el servidor")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')

    # Campos de Webpay (Transbank)
    buy_order = models.CharField(max_length=64, unique=True, help_text="Identificador de orden enviado a Transbank")
    token_ws = models.CharField(max_length=128, null=True, blank=True, help_text="Token devuelto por Webpay")
    authorization_code = models.CharField(max_length=32, null=True, blank=True)
    payment_type_code = models.CharField(max_length=8, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Orden'
        verbose_name_plural = 'Órdenes'

    def __str__(self):
        return f"Orden #{self.id} - {self.usuario.email} - {self.get_estado_display()}"

    @property
    def costo_total(self):
        """Suma del costo de todos los items (para calcular utilidad de la orden)."""
        return sum(item.costo_unitario * item.cantidad for item in self.items.all())

    @property
    def utilidad(self):
        """Ganancia de la orden completa (total cobrado - costo total)."""
        return self.total - self.costo_total


class OrdenItem(models.Model):
    orden = models.ForeignKey(Orden, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    # Guardamos copias del nombre/precio/costo al momento de la compra,
    # para que el historial no cambie si luego editas o borras el producto.
    nombre_producto = models.CharField(max_length=100)
    precio_unitario = models.IntegerField()
    costo_unitario = models.IntegerField(default=0)
    cantidad = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.nombre_producto} x{self.cantidad} (Orden #{self.orden_id})"

    @property
    def subtotal(self):
        return self.precio_unitario * self.cantidad
