# 🚀 Fara Electrónica — Paquete de 5 features

Incluye: **pago Webpay**, **carrito siempre visible + login gate**, **historial de compras**,
**admin estilo Route 66** y **estadísticas con márgenes/utilidad**.

> ⚠️ Formato: este paquete viene en **.zip** (no .rar). Se descomprime igual en Windows
> con doble clic. Si necesitas .rar, conviértelo con WinRAR tras descargar.

> ⚠️ TODO el código fue probado (migraciones, cálculos, API, admin, build del frontend).
> Lo único que NO se pudo probar aquí es la llamada real a Transbank (requiere internet
> hacia su servidor), pero el SDK carga correctamente y funcionará en tu PC.

---

## 📁 Qué archivos van dónde

Copia y **reemplaza** estos archivos en tu proyecto (respeta las rutas):

### Backend

```
backend/productos/models.py          ← REEMPLAZAR (agrega costo, stock, Orden, OrdenItem)
backend/productos/views.py           ← REEMPLAZAR (Webpay, historial, estadísticas)
backend/productos/serializers.py     ← REEMPLAZAR
backend/productos/urls.py            ← REEMPLAZAR
backend/productos/admin.py           ← REEMPLAZAR
backend/requirements.txt             ← REEMPLAZAR (agrega transbank-sdk)
backend/productos/static/admin/css/fara_admin.css   ← REEMPLAZAR (tema Route 66)
backend/templates/admin/base_site.html              ← REEMPLAZAR
backend/templates/admin/index.html                  ← REEMPLAZAR (dashboard con stats)
```

### settings.py

El archivo `backend_settings_REEMPLAZAR.py` es tu `settings.py` con la config de Webpay
añadida al final. Renómbralo y reemplaza:

```
backend_settings_REEMPLAZAR.py  →  backend/backend/settings.py
```

(o copia solo el bloque "Transbank / Webpay" del final a tu settings actual.)

### Frontend

```
frontend/src/App.jsx                       ← REEMPLAZAR (ruta /pago/retorno)
frontend/src/context/CarritoContext.jsx    ← REEMPLAZAR (carrito persistente)
frontend/src/components/Navbar.jsx         ← REEMPLAZAR (carrito siempre visible)
frontend/src/components/CarritoModal.jsx   ← REEMPLAZAR (botón Webpay)
frontend/src/components/HistorialModal.jsx ← NUEVO
frontend/src/pages/Camaras.jsx             ← REEMPLAZAR (botón Comprar + agotado)
frontend/src/pages/Calefaccion.jsx         ← REEMPLAZAR
frontend/src/pages/PagoRetorno.jsx         ← NUEVO
```

NO se tocan: Footer, LoginModal, ProductoModal, Home (quedan igual).

---

## 🔧 Pasos de instalación

### 1. Copiar archivos

Copia todo según la lista de arriba.

### 2. Backend: instalar el SDK de Transbank

```bash
cd backend
venv\Scripts\activate          # activar tu venv
pip install -r requirements.txt
```

### 3. Backend: MIGRAR la base de datos (importante)

Los modelos nuevos (costo, stock, Orden, OrdenItem) requieren migración.
**Primero en LOCAL:**

```bash
python manage.py makemigrations productos
python manage.py migrate
```

Esto añade las columnas `costo` y `stock` a tus productos (con valor 0 por defecto)
y crea las tablas de órdenes. No borra nada de lo que ya tienes.

### 4. Backend: definir los costos de tus productos

Entra al admin → Productos → edita cada uno y pon su **costo** (lo que te cuesta a ti).
Sin esto, el margen sale 100% (porque costo = 0). También define el **stock**.

### 5. Frontend: probar

```bash
cd frontend
npm install
npm run dev
```

El SDK de Transbank ya está en modo **integración** (plata falsa) mientras `DEBUG=True`.

### 6. Probar un pago de prueba (en local)

1. Inicia sesión con Google en la web.
2. Agrega productos al carrito → "Pagar con Webpay".
3. Te redirige a Webpay (ambiente de prueba). Usa estos datos de test:
   - Tarjeta VISA: `4051 8856 0044 6623`
   - CVV: `123`, fecha: cualquiera futura
   - RUT: `11.111.111-1`, clave: `123`
4. Vuelve a `/pago/retorno` → debe decir "Pago exitoso".
5. Revisa "Mis Compras" (historial) y el admin → Órdenes.

---

## 💳 Pasar Webpay a PRODUCCIÓN (cobrar de verdad)

Esto se hace **al final**, cuando todo funcione en local y tengas tu contrato con Transbank.

1. **Contrata Webpay Plus** con Transbank (trámite con tu empresa/persona).
   Te darán un **código de comercio** y una **API key** de producción.
2. Pasa por el **proceso de certificación** que exige Transbank.
3. En **Render** (dashboard del backend → Environment), agrega estas variables:
   ```
   TBK_COMMERCE_CODE = (tu código de comercio real)
   TBK_API_KEY = (tu api key secreta real)
   WEBPAY_RETURN_URL = https://faraelectronica.vercel.app/pago/retorno
   ```
4. Asegúrate de que `DEBUG=False` en producción (ya lo está).
   Con DEBUG=False el código usa automáticamente las credenciales reales.

⚠️ NUNCA pongas las credenciales de producción en el código ni en GitHub.
Solo en variables de entorno de Render.

---

## 🌐 Deploy (Render + Vercel) — pendientes que ya tenías

1. **Render despliega la rama `master`, pero tu código está en `main`.**
   En Render → Settings → Branch, cámbialo a `main`. (O sube tu código a master.)
2. **Build Command de Render** debe incluir collectstatic Y migrate:
   ```
   pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate
   ```
   (El `migrate` aplica las tablas nuevas en producción automáticamente.)

---

## 📊 Qué hace cada feature

1. **Webpay**: botón "Pagar con Webpay" en el carrito y "Comprar" en cada card.
   El precio se recalcula en el servidor (seguro). Crea una orden, redirige a Webpay,
   confirma el pago, descuenta stock y guarda la orden.
2. **Carrito siempre visible**: el ícono aparece logueado o no. Si no hay sesión y haces
   click (o "Comprar"), se abre el login con Google.
3. **Historial**: ícono de reloj en la navbar → "Mis Compras" con todas tus órdenes.
4. **Admin Route 66**: tema azul-noche + dorado, dashboard con tarjetas de stats,
   productos con costo/stock/margen, gestión de órdenes con estados.
5. **Estadísticas**: en el dashboard del admin — ingresos, utilidad, margen %,
   más/menos vendidos. El cálculo de rentabilidad usa el costo que definas por producto.

### Extras incluidos (mis recomendaciones)

- **Control de stock**: productos en 0 aparecen "Agotado" y no se pueden comprar.
- **Estados de orden**: pendiente / pagada / rechazada / preparando / entregada / cancelada.
- **Validación de precio en el servidor**: nadie puede pagar menos editando el JS.
- **Historial inmutable**: cada orden guarda el nombre/precio/costo del momento de la compra.

---

## ❓ Si algo falla

- Error `No module named 'transbank'` → faltó `pip install -r requirements.txt`.
- Admin sin estilos → falta `collectstatic` (en prod) o reiniciar servidor (en local).
- El pago no redirige → revisa que `WEBPAY_RETURN_URL` apunte a tu frontend.
- Margen sale 100% → falta definir el `costo` de los productos en el admin.
- Recuerda: NO corras `npx prettier --write .` sobre las plantillas (ya tienes .prettierignore).
