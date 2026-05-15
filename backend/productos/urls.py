from django.urls import path
from .views import (
    ProductoListView, 
    ProductoDetailView,
    google_login
)

urlpatterns = [
    path('productos/', ProductoListView.as_view(), name='producto-list'),
    path('productos/<int:pk>/', ProductoDetailView.as_view(), name='producto-detail'),
    path('auth/google/', google_login, name='google-login'),
]