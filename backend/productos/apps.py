from django.apps import AppConfig


class ProductosConfig(AppConfig):
    # sin esto makemigrations quiere volver a alterar los id
    default_auto_field = "django.db.models.AutoField"
    name = "productos"
