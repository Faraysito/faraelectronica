# FaraElectrónica v2.0 — 7 Puntos Implementados

Este proyecto ahora incluye todas las funcionalidades de gestión solicitadas:

## ✅ 7 Puntos Implementados

### 1. POS / Nueva venta (Ventas Presenciales)
- **Endpoint:** `POST /api/ordenes/crear_venta_manual/`
- **Descripción:** Registrar ventas rápidas sin carrito web. Descuenta stock automáticamente.
- **Ejemplo:**
```json
{
  "negocio_id": 1,
  "metodo_pago_id": 1,
  "items": [
    {"producto_id": 5, "cantidad": 2, "precio": 50000}
  ]
}
```

### 2. Inventario Mejorado
- **SKU único** por producto
- **Precio por cantidad** (escalonado)
- **Ajuste manual de stock**
- **Endpoints:**
  - `GET /api/productos/` — listar con SKU
  - `POST /api/productos/{id}/ajustar_stock/` — cambiar stock
  - `GET /api/productos/{id}/precios_escalonados/` — ver precios

### 3. Ingresos / Egresos (Libro de Caja)
- **Modelo Gasto** con tipo, descripción, monto
- **Balance automático:** entra (ordenes + ventas) − sale (gastos) = neto
- **Endpoints:**
  - `POST /api/gastos/` — registrar gasto
  - `GET /api/gastos/balance_del_mes/` — balance del mes actual
  - `GET /api/gastos/gastos_por_tipo/` — desglose por tipo

### 4. Métodos de Pago
- Efectivo, Transferencia, Tarjeta, Webpay, Otro
- **Registrar método en cada venta:**
  - Ordenes web: `metodo_pago = 'webpay'`
  - Ventas presenciales: seleccionar efectivo/transferencia/tarjeta

### 5. Reportes Descargables + Estadísticas en Vivo
- **Endpoints:**
  - `GET /api/reportes/estadisticas/` — dashboard en vivo (JSON)
  - `GET /api/reportes/descargar_csv/?tipo=ordenes` — descargar CSV
  - `GET /api/reportes/ganancia_por_producto/` — ganancia por producto

### 6. Multi-dispositivo + Multi-negocio
- **Multi-dispositivo:** Responsive ya integrado (web + mobile)
- **Multi-negocio:** Modelo `Negocio` con colores personalizables, logo
- **Endpoint:** `POST /api/negocios/` — crear nuevo negocio

### 7. Facturación (SII)
- **Modelo FacturaElectronica** con estados: borrador → generada → enviada → aceptada
- **Endpoints:**
  - `POST /api/facturas/generar_boleta/` — crear boleta
  - `POST /api/facturas/{id}/enviar_sii/` — enviar al SII (placeholder)
- **Nota:** Requiere integración con LibreDTE o similar para SII real

---

## 🚀 Setup para Localhost

### Paso 1: Dependencias
```bash
cd backend
pip install -r requirements.txt
```

### Paso 2: Migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### Paso 3: Crear datos iniciales (opcional)
```bash
python manage.py shell
```

En el shell:
```python
from productos.models import Negocio, MetodoPago
from django.contrib.auth.models import User

# Crear tu usuario (si no existe)
user = User.objects.first()  # o crear uno: User.objects.create_user('admin', 'admin@test.com', 'pass')

# Crear negocio
negocio = Negocio.objects.create(
    owner=user,
    nombre="Mi Tienda",
    slug="mi-tienda",
    color_primario="#f5c800",
    color_secundario="#0a0a0a"
)

# Crear métodos de pago
MetodoPago.objects.get_or_create(tipo='efectivo')
MetodoPago.objects.get_or_create(tipo='transferencia')
MetodoPago.objects.get_or_create(tipo='tarjeta')
MetodoPago.objects.get_or_create(tipo='webpay')
```

### Paso 4: Runserver
```bash
python manage.py runserver
```

### Paso 5: Acceder a endpoints
- Admin: http://127.0.0.1:8000/gestion-fara-super-user/
- API: http://127.0.0.1:8000/api/

---

## 📊 Flujos Principales

### Venta Web (igual que antes)
1. Cliente agrega productos al carrito
2. Paga con Webpay
3. Orden se marca como 'pagada'
4. Stock se descuenta

### Venta Presencial (NUEVO)
1. Admin abre POS desde dashboard
2. Escanea/busca productos
3. Selecciona cantidad
4. Elige método de pago (efectivo, transferencia, etc.)
5. Confirma venta → orden presencial creada

### Registro de Gasto (NUEVO)
1. Admin va a "Gastos"
2. Ingresa tipo (arriendo, servicios, etc.)
3. Monto, descripción, comprobante (opcional)
4. Guarda → automáticamente se resta del balance

### Ver Balance (NUEVO)
1. Dashboard → "Estadísticas"
2. Ve: Ingresos web + Ingresos presenciales + Total egresos = NETO
3. Ver ganancia por producto
4. Descargar reportes en CSV

---

## 🔧 Notas Técnicas

### Base de Datos
Se agregaron tablas nuevas:
- `productos_negocio` — multi-negocio
- `productos_precioescalonado` — precios escalonados
- `productos_metodopago` — métodos de pago
- `productos_gasto` — registro de egresos
- `productos_venta` — ventas presenciales
- `productos_ventaitem` — items de venta
- `productos_facturaelectronica` — boletas/facturas

### Modelos Modificados
- `Producto` — agregar SKU, relación a Negocio
- `Orden` — agregar metodo_pago, tipo_venta, numero_boleta, dte_enviado
- `MetodoPago` — nuevo modelo para efectivo/transferencia/tarjeta

### Configuración de Settings
Si necesitas cambios en `backend/backend/settings.py`, verifica:
```python
INSTALLED_APPS = [
    'rest_framework',
    'corsheaders',
    'cloudinary',
    'productos',  # ← incluida
]
```

---

## 📱 Frontend (React/Vite)

Para consumir los nuevos endpoints desde React:

### Ejemplo: Crear venta presencial
```javascript
const crearVentaPOS = async (items, metodoPago) => {
  const response = await fetch('http://127.0.0.1:8000/api/ordenes/crear_venta_manual/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      negocio_id: 1,
      metodo_pago_id: metodoPago,
      items: items.map(i => ({ producto_id: i.id, cantidad: i.qty, precio: i.precio }))
    })
  });
  return response.json();
};
```

### Ejemplo: Ver balance
```javascript
const getBalance = async () => {
  const response = await fetch('http://127.0.0.1:8000/api/gastos/balance_del_mes/', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log(`Ingresos: $${data.ingresos_totales}, Gastos: $${data.egresos}, Neto: $${data.neto}`);
};
```

---

## 🔐 Seguridad

- Todos los endpoints requieren `IsAuthenticated`
- Algunos (estadísticas full) requieren `IsAdminUser`
- Rate limiting configurado en `settings.py`
- CORS habilitado solo para Vercel (frontend)

---

## 📝 Próximos Pasos (Opcional)

1. **Facturación SII Real:** Integrar LibreDTE API o similar
2. **App Nativa:** React Native para iOS/Android con mismos endpoints
3. **Reportes PDF:** Generar boletas/facturas en PDF descargable
4. **Email:** Enviar resumen de ventas diarias al dueño
5. **Alertas:** Stock bajo, gasto importante, etc.

---

## ❓ Soporte

Para preguntas o bugs, contactar al desarrollador.
