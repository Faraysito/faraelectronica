from django.db import models

class Producto(models.Model):
    CATEGORIA_CHOICES = [
        ('camaras', 'Cámaras de Seguridad'),
        ('calefaccion', 'Calefacción'),
    ]

    nombre = models.CharField(max_length=100)
    precio = models.IntegerField()
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

class ProductoImagen(models.Model):
    producto = models.ForeignKey(Producto, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='productos/galeria/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Imagen de {self.producto.nombre}"