from django.db import models
from django.contrib.auth.models import User


class Negocio(models.Model):
    """Modelo para multi-negocio. Un admin puede manejar varios negocios."""
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='negocios')
    nombre = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    descripcion = models.TextField(null=True, blank=True)
    logo = models.ImageField(upload_to='negocios/', null=True, blank=True)
    color_primario = models.CharField(max_length=7, default='#f5c800')
    color_secundario = models.CharField(max_length=7, default='#0a0a0a')
    es_activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    CATEGORIA_CHOICES = [
        ('camaras', 'Cámaras de Seguridad'),
        ('calefaccion', 'Calefacción'),
    ]

    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='productos', null=True, blank=True)
    nombre = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, default="SKU-LEGACY", help_text="Código del producto")
    precio = models.IntegerField(help_text="Precio de venta al público")
    costo = models.IntegerField(default=0, help_text="Costo de compra/adquisición")
    stock = models.IntegerField(default=0, help_text="Unidades disponibles")
    descripcion = models.TextField(help_text="Descripción corta para la card")
    descripcion_larga = models.TextField(null=True, blank=True)
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
        return self.precio - self.costo

    @property
    def margen_porcentaje(self):
        if self.precio == 0:
            return 0
        return round((self.precio - self.costo) / self.precio * 100, 1)

    @property
    def agotado(self):
        return self.stock <= 0


class PrecioEscalonado(models.Model):
    """Precio por cantidad."""
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='precios_escalonados')
    cantidad_minima = models.IntegerField()
    cantidad_maxima = models.IntegerField(null=True, blank=True)
    precio = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cantidad_minima']

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad_minima}-{self.cantidad_maxima or '∞'}: ${self.precio}"


class ProductoImagen(models.Model):
    producto = models.ForeignKey(Producto, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='productos/galeria/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Imagen de {self.producto.nombre}"


class MetodoPago(models.Model):
    TIPO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia bancaria'),
        ('tarjeta', 'Tarjeta de crédito/débito'),
        ('webpay', 'Webpay (online)'),
        ('otro', 'Otro'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.CharField(max_length=100, null=True, blank=True)
    es_activo = models.BooleanField(default=True)

    def __str__(self):
        return self.get_tipo_display()


class Orden(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente de pago'),
        ('pagada', 'Pagada'),
        ('rechazada', 'Rechazada'),
        ('preparando', 'Preparando'),
        ('entregada', 'Entregada'),
        ('cancelada', 'Cancelada'),
    ]

    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='ordenes', null=True, blank=True)
    usuario = models.ForeignKey(User, related_name='ordenes', on_delete=models.CASCADE)
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    total = models.IntegerField(default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    tipo_venta = models.CharField(max_length=10, choices=[('web', 'Web'), ('presencial', 'Presencial')], default='web')
    buy_order = models.CharField(max_length=64, unique=True, null=True, blank=True)
    token_ws = models.CharField(max_length=128, null=True, blank=True)
    authorization_code = models.CharField(max_length=32, null=True, blank=True)
    payment_type_code = models.CharField(max_length=8, null=True, blank=True)
    numero_boleta = models.CharField(max_length=20, null=True, blank=True)
    dte_enviado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Orden #{self.id} - {self.usuario.email}"

    @property
    def costo_total(self):
        return sum(item.costo_unitario * item.cantidad for item in self.items.all())

    @property
    def utilidad(self):
        return self.total - self.costo_total


class OrdenItem(models.Model):
    orden = models.ForeignKey(Orden, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    nombre_producto = models.CharField(max_length=100)
    precio_unitario = models.IntegerField()
    costo_unitario = models.IntegerField(default=0)
    cantidad = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.nombre_producto} x{self.cantidad}"

    @property
    def subtotal(self):
        return self.precio_unitario * self.cantidad


class Gasto(models.Model):
    """Libro de caja - Egresos."""
    TIPO_CHOICES = [
        ('arriendo', 'Arriendo'),
        ('servicios', 'Servicios'),
        ('salarios', 'Salarios'),
        ('compra_stock', 'Compra de stock'),
        ('marketing', 'Marketing'),
        ('mantenimiento', 'Mantenimiento'),
        ('impuestos', 'Impuestos'),
        ('otro', 'Otro'),
    ]

    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='gastos', null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    monto = models.IntegerField()
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    comprobante = models.FileField(upload_to='comprobantes/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_tipo_display()} - ${self.monto:,}"


class Venta(models.Model):
    """Venta presencial (POS)."""
    ESTADO_CHOICES = [
        ('registrada', 'Registrada'),
        ('devuelta', 'Devuelta'),
    ]

    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='ventas', null=True, blank=True)
    total = models.IntegerField(default=0)
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='registrada')
    notas = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Venta #{self.id} - ${self.total:,}"

    @property
    def costo_total(self):
        return sum(item.costo_unitario * item.cantidad for item in self.items.all())

    @property
    def utilidad(self):
        return self.total - self.costo_total


class VentaItem(models.Model):
    """Items de venta presencial."""
    venta = models.ForeignKey(Venta, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    nombre_producto = models.CharField(max_length=100)
    precio_unitario = models.IntegerField()
    costo_unitario = models.IntegerField(default=0)
    cantidad = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.nombre_producto} x{self.cantidad}"

    @property
    def subtotal(self):
        return self.precio_unitario * self.cantidad


class FacturaElectronica(models.Model):
    """Boletas/Facturas electrónicas (DTE SII)."""
    TIPO_CHOICES = [
        ('boleta', 'Boleta electrónica'),
        ('factura', 'Factura electrónica'),
    ]

    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('generada', 'Generada'),
        ('enviada', 'Enviada al SII'),
        ('aceptada', 'Aceptada'),
        ('rechazada', 'Rechazada'),
        ('anulada', 'Anulada'),
    ]

    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='facturas', null=True, blank=True)
    orden = models.OneToOneField(Orden, on_delete=models.SET_NULL, null=True, blank=True, related_name='factura')
    venta = models.OneToOneField(Venta, on_delete=models.SET_NULL, null=True, blank=True, related_name='factura')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    numero = models.CharField(max_length=20, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    total = models.IntegerField()
    xml_dte = models.TextField(null=True, blank=True)
    respuesta_sii = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_tipo_display()} #{self.numero}"
