from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'negocios', views.NegocioViewSet, basename='negocio')
router.register(r'productos', views.ProductoViewSet, basename='producto')
router.register(r'ordenes', views.OrdenViewSet, basename='orden')
router.register(r'gastos', views.GastoViewSet, basename='gasto')
router.register(r'ventas', views.VentaViewSet, basename='venta')
router.register(r'reportes', views.ReportesViewSet, basename='reporte')
router.register(r'facturas', views.FacturaViewSet, basename='factura')

urlpatterns = [
    path('', include(router.urls)),
    path('estadisticas/', views.estadisticas, name='estadisticas'),
    path('auth/google/', views.google_login, name='google-login'),
    path('webpay/crear/', views.webpay_crear, name='webpay-crear'),
    path('webpay/confirmar/', views.webpay_confirmar, name='webpay-confirmar'),
    path('historial/', views.HistorialComprasView.as_view(), name='historial'),
    path('tienda/config/', views.tienda_config, name='tienda-config'),
    path('suscripciones/', views.MisSuscripcionesView.as_view(), name='suscripciones'),
    path('suscripciones/<int:pk>/cancelar/', views.cancelar_suscripcion, name='suscripcion-cancelar'),
]
