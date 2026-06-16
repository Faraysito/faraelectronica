"""
Tests del backend de Fara Electrónica.

Cubre lo que más importa demostrar en un portafolio:
  1. Lógica de negocio (margen, utilidad, agotado).
  2. Seguridad: el precio se recalcula SIEMPRE en el servidor (nadie paga menos editando el JS).
  3. Validación de stock antes de permitir una compra.
  4. El costo NUNCA se expone en la API pública.
  5. El historial solo devuelve órdenes del usuario logueado.

Colocar en: backend/productos/tests.py  (reemplaza el archivo vacío actual)

Ejecutar:
    python manage.py test productos
"""
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Producto, Orden, OrdenItem


# ─────────────────────────────────────────────────────────────────
#  1. Lógica de negocio en el modelo Producto
# ─────────────────────────────────────────────────────────────────
class ProductoModeloTests(APITestCase):
    def test_margen_unitario(self):
        p = Producto(nombre="Cam", precio=10000, costo=6000, stock=5)
        self.assertEqual(p.margen_unitario, 4000)

    def test_margen_porcentaje(self):
        p = Producto(nombre="Cam", precio=10000, costo=6000, stock=5)
        self.assertEqual(p.margen_porcentaje, 40.0)

    def test_margen_porcentaje_precio_cero_no_divide_por_cero(self):
        p = Producto(nombre="Gratis", precio=0, costo=0, stock=1)
        self.assertEqual(p.margen_porcentaje, 0)

    def test_agotado_true_cuando_stock_cero(self):
        p = Producto(nombre="X", precio=1000, costo=500, stock=0)
        self.assertTrue(p.agotado)

    def test_agotado_false_cuando_hay_stock(self):
        p = Producto(nombre="X", precio=1000, costo=500, stock=3)
        self.assertFalse(p.agotado)


# ─────────────────────────────────────────────────────────────────
#  2. Lógica de la orden (utilidad)
# ─────────────────────────────────────────────────────────────────
class OrdenModeloTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u@test.com", email="u@test.com")
        self.prod = Producto.objects.create(
            nombre="Cámara", precio=20000, costo=12000, stock=10, descripcion="d"
        )

    def test_utilidad_orden(self):
        orden = Orden.objects.create(usuario=self.user, total=40000, buy_order="bo1")
        OrdenItem.objects.create(
            orden=orden, producto=self.prod, nombre_producto="Cámara",
            precio_unitario=20000, costo_unitario=12000, cantidad=2,
        )
        # total 40000 - costo (12000*2=24000) = 16000
        self.assertEqual(orden.costo_total, 24000)
        self.assertEqual(orden.utilidad, 16000)

    def test_subtotal_item(self):
        orden = Orden.objects.create(usuario=self.user, total=60000, buy_order="bo2")
        item = OrdenItem.objects.create(
            orden=orden, producto=self.prod, nombre_producto="Cámara",
            precio_unitario=20000, costo_unitario=12000, cantidad=3,
        )
        self.assertEqual(item.subtotal, 60000)


# ─────────────────────────────────────────────────────────────────
#  3. API pública de productos
# ─────────────────────────────────────────────────────────────────
class ProductoAPITests(APITestCase):
    def setUp(self):
        self.prod = Producto.objects.create(
            nombre="Cámara IP", precio=30000, costo=18000, stock=4,
            descripcion="d", categoria="camaras",
        )
        Producto.objects.create(
            nombre="Estufa", precio=50000, costo=30000, stock=2,
            descripcion="d", categoria="calefaccion",
        )

    def test_lista_productos(self):
        res = self.client.get("/api/productos/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 2)

    def test_filtro_por_categoria(self):
        res = self.client.get("/api/productos/?categoria=camaras")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["nombre"], "Cámara IP")

    def test_costo_nunca_se_expone(self):
        """El costo es información interna del negocio. Jamás debe salir en la API."""
        res = self.client.get("/api/productos/")
        for prod in res.json():
            self.assertNotIn("costo", prod)
            self.assertNotIn("margen_unitario", prod)
            self.assertNotIn("margen_porcentaje", prod)

    def test_agotado_se_expone(self):
        res = self.client.get("/api/productos/")
        self.assertIn("agotado", res.json()[0])


# ─────────────────────────────────────────────────────────────────
#  4. Seguridad de pagos: recálculo en servidor + validación de stock
# ─────────────────────────────────────────────────────────────────
class WebpaySeguridadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="c@test.com", email="c@test.com")
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.prod = Producto.objects.create(
            nombre="Cámara", precio=25000, costo=15000, stock=3,
            descripcion="d", categoria="camaras",
        )

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_crear_requiere_autenticacion(self):
        res = self.client.post(
            "/api/webpay/crear/",
            {"items": [{"id": self.prod.id, "cantidad": 1}]},
            format="json",
        )
        self.assertIn(res.status_code, (401, 403))

    def test_carrito_vacio_rechazado(self):
        self._auth()
        res = self.client.post("/api/webpay/crear/", {"items": []}, format="json")
        self.assertEqual(res.status_code, 400)

    @patch("productos.views.get_webpay_transaction")
    def test_precio_se_recalcula_en_servidor(self, mock_tx):
        """
        El front podría mandar un precio falso. El servidor lo ignora y usa
        el precio real de la BD para crear la orden.
        """
        mock_tx.return_value.create.return_value = {
            "url": "https://webpay.test/pago", "token": "TKN123",
        }
        self._auth()
        # El cliente intenta pagar "cantidad 2" -> total real esperado = 50000
        res = self.client.post(
            "/api/webpay/crear/",
            {"items": [{"id": self.prod.id, "cantidad": 2, "precio": 1}]},  # precio falso
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        orden = Orden.objects.get(buy_order__isnull=False)
        self.assertEqual(orden.total, 50000)  # 25000 * 2, NO el precio falso

    def test_stock_insuficiente_rechazado(self):
        self._auth()
        res = self.client.post(
            "/api/webpay/crear/",
            {"items": [{"id": self.prod.id, "cantidad": 99}]},  # solo hay 3
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Stock", res.json().get("error", ""))

    def test_producto_inexistente_rechazado(self):
        self._auth()
        res = self.client.post(
            "/api/webpay/crear/",
            {"items": [{"id": 99999, "cantidad": 1}]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)


# ─────────────────────────────────────────────────────────────────
#  5. Historial: solo órdenes del usuario logueado
# ─────────────────────────────────────────────────────────────────
class HistorialTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username="a@test.com", email="a@test.com")
        self.user_b = User.objects.create_user(username="b@test.com", email="b@test.com")
        # Orden pagada de A
        Orden.objects.create(usuario=self.user_a, total=10000, estado="pagada", buy_order="a1")
        # Orden pendiente de A (no debe aparecer)
        Orden.objects.create(usuario=self.user_a, total=5000, estado="pendiente", buy_order="a2")
        # Orden pagada de B (no debe aparecer para A)
        Orden.objects.create(usuario=self.user_b, total=8000, estado="pagada", buy_order="b1")

    def test_historial_solo_del_usuario_y_sin_pendientes(self):
        token = str(RefreshToken.for_user(self.user_a).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/historial/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)  # solo la pagada de A
        self.assertEqual(data[0]["buy_order"] if "buy_order" in data[0] else data[0]["total"], 10000)

    def test_historial_requiere_login(self):
        res = self.client.get("/api/historial/")
        self.assertIn(res.status_code, (401, 403))


# ─────────────────────────────────────────────────────────────────
#  6. Estadísticas: solo admin
# ─────────────────────────────────────────────────────────────────
class EstadisticasTests(APITestCase):
    def setUp(self):
        self.normal = User.objects.create_user(username="n@test.com", email="n@test.com")
        self.admin = User.objects.create_user(
            username="adm@test.com", email="adm@test.com", is_staff=True
        )

    def test_estadisticas_bloqueadas_para_usuario_normal(self):
        token = str(RefreshToken.for_user(self.normal).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/estadisticas/")
        self.assertIn(res.status_code, (401, 403))

    def test_estadisticas_accesibles_para_admin(self):
        token = str(RefreshToken.for_user(self.admin).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/estadisticas/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("ingresos_totales", res.json())
        self.assertIn("margen_porcentaje", res.json())
