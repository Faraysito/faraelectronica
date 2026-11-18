"""Tests de la página de producto / CRO: combos, suscripción, reseñas, envío gratis, CAPI y Klaviyo."""
import hashlib
import io
from datetime import timedelta
from io import StringIO
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from django.utils.timezone import now
from PIL import Image
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Orden, OrdenItem, PrecioEscalonado, Producto, Resena, Suscripcion

STORAGES_TEST = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@override_settings(
    COMBO_DESCUENTOS={}, SUSCRIPCION_DESCUENTO_PCT=10, SUSCRIPCION_FRECUENCIAS=[30, 60, 90],
    ENVIO_GRATIS_DESDE=0, META_PIXEL_ID="", META_CAPI_TOKEN="", META_CAPI_ASYNC=False,
    KLAVIYO_PRIVATE_KEY="", FRONTEND_URL="https://tienda.test", STORAGES=STORAGES_TEST,
)
class BaseTienda(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana@test.com", email="ana@test.com", first_name="Ana Pérez")
        self.prod = Producto.objects.create(
            nombre="Cámara", precio=25000, costo=15000, stock=10, descripcion="d", categoria="camaras",
        )

    def auth(self, user=None):
        token = str(RefreshToken.for_user(user or self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def crear_pago(self, items, token="TKN"):
        self.auth()
        with patch("productos.views.get_webpay_transaction") as tx:
            tx.return_value.create.return_value = {"url": "https://webpay.test/pago", "token": token}
            return self.client.post("/api/webpay/crear/", {"items": items}, format="json")

    def confirmar(self, token="TKN", aprobado=True, extra=None):
        with patch("productos.views.get_webpay_transaction") as tx:
            tx.return_value.commit.return_value = {
                "status": "AUTHORIZED" if aprobado else "FAILED",
                "response_code": 0 if aprobado else -1,
                "authorization_code": "1213",
            }
            res = self.client.post("/api/webpay/confirmar/", {"token_ws": token, **(extra or {})}, format="json")
        return res, tx

    def orden_pagada(self, producto=None, user=None):
        orden = Orden.objects.create(usuario=user or self.user, total=25000, estado="pagada", buy_order=f"bo-{Orden.objects.count()}")
        OrdenItem.objects.create(orden=orden, producto=producto or self.prod, nombre_producto="Cámara",
                                 precio_unitario=25000, costo_unitario=15000, cantidad=1)
        return orden


class CatalogoTests(BaseTienda):
    def test_detalle_publico_con_tramos_y_rating_solo_visibles(self):
        PrecioEscalonado.objects.create(producto=self.prod, cantidad_minima=2, precio=22000)
        otro = User.objects.create_user(username="b@test.com", email="b@test.com")
        Resena.objects.create(producto=self.prod, usuario=self.user, calificacion=5, comentario="ok", compra_verificada=True)
        Resena.objects.create(producto=self.prod, usuario=otro, calificacion=1, comentario="spam", visible=False)

        res = self.client.get(f"/api/productos/{self.prod.id}/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["tramos"], [{"min": 2, "max": None, "precio_unitario": 22000}])
        self.assertEqual(data["rating_promedio"], 5.0)
        self.assertEqual(data["rating_total"], 1)
        self.assertNotIn("costo", data)
        lista = self.client.get("/api/productos/?categoria=camaras").json()
        self.assertEqual(lista[0]["rating_total"], 1)


class CombosTests(BaseTienda):
    def test_combo_precio_escalonado_se_cobra_en_servidor(self):
        PrecioEscalonado.objects.create(producto=self.prod, cantidad_minima=2, cantidad_maxima=3, precio=22000)
        res = self.crear_pago([{"id": self.prod.id, "cantidad": 2, "precio": 1}], token="T1")
        self.assertEqual(res.status_code, 200)
        orden = Orden.objects.get(token_ws="T1")
        self.assertEqual(orden.total, 44000)
        self.assertEqual(orden.items.get().precio_unitario, 22000)
        # sobre el máximo del tramo vuelve al precio normal
        self.crear_pago([{"id": self.prod.id, "cantidad": 4}], token="T2")
        self.assertEqual(Orden.objects.get(token_ws="T2").total, 100000)

    @override_settings(COMBO_DESCUENTOS={2: 10, 3: 15})
    def test_combo_descuento_global(self):
        self.prod.precio = 9999
        self.prod.save()
        tramos = self.client.get(f"/api/productos/{self.prod.id}/").json()["tramos"]
        self.assertEqual([t["precio_unitario"] for t in tramos], [8999, 8499])
        self.crear_pago([{"id": self.prod.id, "cantidad": 3}])
        self.assertEqual(Orden.objects.get(token_ws="TKN").total, 8499 * 3)


class SuscripcionTests(BaseTienda):
    def test_suscripcion_aplica_descuento_sobre_combo_y_guarda_frecuencia(self):
        PrecioEscalonado.objects.create(producto=self.prod, cantidad_minima=2, precio=22000)
        res = self.crear_pago([{"id": self.prod.id, "cantidad": 2, "suscripcion": True, "frecuencia_dias": 60}])
        self.assertEqual(res.status_code, 200)
        orden = Orden.objects.get(token_ws="TKN")
        self.assertEqual(orden.total, 19800 * 2)  # 22000 - 10%
        item = orden.items.get()
        self.assertTrue(item.es_suscripcion)
        self.assertEqual(item.frecuencia_dias, 60)

    def test_suscripcion_invalida_rechazada(self):
        res = self.crear_pago([{"id": self.prod.id, "cantidad": 1, "suscripcion": True, "frecuencia_dias": 7}])
        self.assertEqual(res.status_code, 400)
        self.prod.permite_suscripcion = False
        self.prod.save()
        res = self.crear_pago([{"id": self.prod.id, "cantidad": 1, "suscripcion": True, "frecuencia_dias": 30}])
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Orden.objects.count(), 0)

    def test_confirmar_pago_crea_suscripcion_y_descuenta_stock(self):
        self.crear_pago([{"id": self.prod.id, "cantidad": 2, "suscripcion": True, "frecuencia_dias": 30}])
        res, _ = self.confirmar()
        self.assertEqual(res.json()["estado"], "pagada")
        self.assertEqual(res.json()["total"], 22500 * 2)
        self.prod.refresh_from_db()
        self.assertEqual(self.prod.stock, 8)
        sub = Suscripcion.objects.get(usuario=self.user, producto=self.prod)
        self.assertTrue(sub.activa)
        self.assertEqual(sub.cantidad, 2)
        self.assertEqual(sub.descuento_pct, 10)
        self.assertEqual(sub.proxima_fecha, now().date() + timedelta(days=30))

    def test_pago_rechazado_no_crea_suscripcion(self):
        self.crear_pago([{"id": self.prod.id, "cantidad": 1, "suscripcion": True, "frecuencia_dias": 30}])
        res, _ = self.confirmar(aprobado=False)
        self.assertEqual(res.json()["estado"], "rechazada")
        self.assertFalse(Suscripcion.objects.exists())
        self.prod.refresh_from_db()
        self.assertEqual(self.prod.stock, 10)

    def test_confirmar_es_idempotente(self):
        self.crear_pago([{"id": self.prod.id, "cantidad": 1, "suscripcion": True, "frecuencia_dias": 30}])
        self.confirmar()
        res, tx = self.confirmar()
        self.assertEqual(res.json()["estado"], "pagada")
        tx.return_value.commit.assert_not_called()
        self.prod.refresh_from_db()
        self.assertEqual(self.prod.stock, 9)
        self.assertEqual(Suscripcion.objects.count(), 1)

    @override_settings(KLAVIYO_PRIVATE_KEY="pk_test")
    def test_recordatorios_y_cancelacion(self):
        hoy = now().date()
        vence = Suscripcion.objects.create(usuario=self.user, producto=self.prod, nombre_producto="Cámara",
                                           cantidad=2, frecuencia_dias=30, descuento_pct=10, proxima_fecha=hoy + timedelta(days=1))
        Suscripcion.objects.create(usuario=self.user, producto=self.prod, nombre_producto="Cámara",
                                   proxima_fecha=hoy + timedelta(days=20))
        Suscripcion.objects.create(usuario=self.user, producto=self.prod, nombre_producto="Cámara",
                                   proxima_fecha=hoy, activa=False)
        with patch("productos.klaviyo.requests.post", return_value=MagicMock(status_code=202)) as post:
            call_command("recordatorios_suscripcion", dias_antes=3, stdout=StringIO())
            call_command("recordatorios_suscripcion", dias_antes=3, stdout=StringIO())  # no repite
        self.assertEqual(post.call_count, 1)
        self.assertIn(f"https://tienda.test/producto/{self.prod.id}?suscripcion=1", post.call_args.kwargs["data"])
        vence.refresh_from_db()
        self.assertEqual(vence.recordatorio_enviado_para, vence.proxima_fecha)

        intruso = User.objects.create_user(username="x@test.com", email="x@test.com")
        self.auth(intruso)
        self.assertEqual(self.client.post(f"/api/suscripciones/{vence.id}/cancelar/").status_code, 404)
        self.auth()
        self.assertEqual(self.client.post(f"/api/suscripciones/{vence.id}/cancelar/").status_code, 200)
        activas = self.client.get("/api/suscripciones/").json()
        self.assertNotIn(vence.id, [s["id"] for s in activas])


class ResenasTests(BaseTienda):
    def test_resena_requiere_compra_pagada(self):
        self.auth()
        res = self.client.post(f"/api/productos/{self.prod.id}/resenas/", {"calificacion": 5, "comentario": "top"})
        self.assertEqual(res.status_code, 403)
        Orden.objects.create(usuario=self.user, total=25000, estado="pendiente", buy_order="pend")
        res = self.client.post(f"/api/productos/{self.prod.id}/resenas/", {"calificacion": 5, "comentario": "top"})
        self.assertEqual(res.status_code, 403)

    def test_resena_comprador_verificado_con_foto_y_validaciones(self):
        self.orden_pagada()
        self.auth()
        url = f"/api/productos/{self.prod.id}/resenas/"
        self.assertEqual(self.client.post(url, {"calificacion": 6, "comentario": "x"}).status_code, 400)

        buf = io.BytesIO()
        Image.new("RGB", (4, 4), "yellow").save(buf, "PNG")
        foto = SimpleUploadedFile("foto.png", buf.getvalue(), content_type="image/png")
        res = self.client.post(url, {"calificacion": 4, "comentario": "Buena imagen", "foto": foto}, format="multipart")
        self.assertEqual(res.status_code, 201, res.content)
        self.assertTrue(res.json()["compra_verificada"])

        self.client.credentials()
        data = self.client.get(url).json()
        self.assertEqual(data["resumen"]["promedio"], 4.0)
        self.assertEqual(data["resumen"]["total"], 1)
        self.assertEqual(data["resumen"]["distribucion"]["4"], 1)
        self.assertEqual(data["resenas"][0]["autor"], "Ana P.")
        self.assertTrue(data["resenas"][0]["foto"])
        self.assertNotIn("ana@test.com", str(data))

        self.auth()
        self.assertEqual(self.client.post(url, {"calificacion": 5, "comentario": "otra"}).status_code, 400)


class EnvioYConfigTests(BaseTienda):
    @override_settings(ENVIO_GRATIS_DESDE=40000, SUSCRIPCION_DESCUENTO_PCT=15)
    def test_config_publica_y_envio_gratis_segun_umbral(self):
        cfg = self.client.get("/api/tienda/config/").json()
        self.assertEqual(cfg["suscripcion"], {"descuento_pct": 15, "frecuencias_dias": [30, 60, 90]})
        self.assertEqual(cfg["envio"]["gratis_desde"], 40000)
        self.crear_pago([{"id": self.prod.id, "cantidad": 2}], token="A")
        self.crear_pago([{"id": self.prod.id, "cantidad": 1}], token="B")
        self.assertTrue(Orden.objects.get(token_ws="A").envio_gratis)
        self.assertFalse(Orden.objects.get(token_ws="B").envio_gratis)


class MetaCapiTests(BaseTienda):
    def test_purchase_se_envia_deduplicable_y_solo_con_credenciales(self):
        with override_settings(META_PIXEL_ID="123", META_CAPI_TOKEN="tok"), \
                patch("productos.meta_capi.enviar_evento", return_value=True) as enviar:
            self.crear_pago([{"id": self.prod.id, "cantidad": 2}], token="C1")
            self.confirmar("C1", extra={"fbp": "fb.1.123.456"})
        self.assertEqual(enviar.call_count, 1)
        evento = enviar.call_args.args[0]["data"][0]
        orden = Orden.objects.get(token_ws="C1")
        self.assertEqual(evento["event_name"], "Purchase")
        self.assertEqual(evento["event_id"], f"purchase-{orden.id}")
        self.assertEqual(evento["user_data"]["em"], [hashlib.sha256(b"ana@test.com").hexdigest()])
        self.assertEqual(evento["user_data"]["fbp"], "fb.1.123.456")
        self.assertEqual(evento["custom_data"]["value"], 50000)
        self.assertEqual(evento["custom_data"]["currency"], "CLP")
        self.assertEqual(evento["custom_data"]["contents"], [{"id": str(self.prod.id), "quantity": 2, "item_price": 25000}])

        with patch("productos.meta_capi.enviar_evento") as enviar:
            self.crear_pago([{"id": self.prod.id, "cantidad": 1}], token="C2")
            self.confirmar("C2")
        enviar.assert_not_called()


class SeguridadTests(BaseTienda):
    def test_escritura_y_gestion_solo_admin(self):
        self.auth()
        self.assertEqual(self.client.post("/api/productos/", {"nombre": "x"}).status_code, 403)
        self.assertEqual(self.client.get("/api/gastos/").status_code, 403)
        self.assertEqual(self.client.get("/api/reportes/estadisticas/").status_code, 403)
        orden = Orden.objects.create(usuario=self.user, total=1000, buy_order="propia")
        res = self.client.patch(f"/api/ordenes/{orden.id}/", {"estado": "pagada"}, format="json")
        self.assertEqual(res.status_code, 403)
        orden.refresh_from_db()
        self.assertEqual(orden.estado, "pendiente")
        self.client.credentials()
        self.assertEqual(self.client.post("/api/auth/google/", {}, format="json").status_code, 400)
