from django.urls import path
from .views import (
    ProductoListView,
    ProductoDetailView,
    google_login,
    webpay_crear,
    webpay_confirmar,
    HistorialComprasView,
    estadisticas,
)

urlpatterns = [
    path('productos/', ProductoListView.as_view(), name='producto-list'),
    path('productos/<int:pk>/', ProductoDetailView.as_view(), name='producto-detail'),
    path('auth/google/', google_login, name='google-login'),

    # Pagos Webpay
    path('webpay/crear/', webpay_crear, name='webpay-crear'),
    path('webpay/confirmar/', webpay_confirmar, name='webpay-confirmar'),

    # Cliente
    path('historial/', HistorialComprasView.as_view(), name='historial'),

    # Admin
    path('estadisticas/', estadisticas, name='estadisticas'),
]
