from django.apps import AppConfig


class ProductosConfig(AppConfig):
    # Esta línea resuelve el "drift" de migraciones que Django reportaba
    # (querer re-alterar los campos id). Al fijar el tipo de PK por defecto,
    # `python manage.py makemigrations --check` queda limpio.
    # No requiere migración nueva ni toca la base de datos.
    default_auto_field = "django.db.models.AutoField"
    name = "productos"
