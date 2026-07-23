# 🧪 Flujo de Prueba - 7 Puntos Implementados

## Preparativos
1. Servidor corriendo: http://127.0.0.1:8000/
2. Cambiar contraseña de `digna` si es necesario
3. Inicia sesión en admin: http://127.0.0.1:8000/gestion-fara-super-user/
4. Instala Postman o ThunderClient para testing API

---

## ✅ Punto 1: INVENTARIO (SKU + Precio por Cantidad)

### En el Admin:
1. Ir a `Productos`
2. Crear nuevo producto:
   - Nombre: "Cámara 4K Pro"
   - **SKU: CAM-4K-001** ← Este es el nuevo campo
   - Precio: 150000
   - Costo: 80000
   - Stock: 10
   - Guardar

3. Editar el producto creado → "Precios escalonados"
4. Agregar precio escalonado:
   - Cantidad mínima: 5
   - Cantidad máxima: 10
   - Precio: 140000 (descuento por cantidad)
5. Guardar

✅ **Verificación:** El producto aparece con SKU y margen automático calculado (40%)

---

## ✅ Punto 2: MÉTODOS DE PAGO

### En el Admin:
1. Ir a `Métodos de pago`
2. Verificar que existen:
   - ✓ Efectivo
   - ✓ Transferencia
   - ✓ Tarjeta
   - ✓ Webpay
3. Si falta alguno, crear uno manualmente

✅ **Verificación:** Todos los métodos de pago están disponibles

---

## ✅ Punto 3: MULTI-NEGOCIO

### En Postman/ThunderClient:

**Request 1: Crear Negocio**
```
POST http://127.0.0.1:8000/api/negocios/
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {TU_TOKEN}

Body:
{
  "nombre": "Fara Electrónica - Sucursal 2",
  "slug": "fara-electronica-2",
  "descripcion": "Sucursal en el norte",
  "color_primario": "#f5c800",
  "color_secundario": "#0a0a0a",
  "es_activo": true
}
```

✅ **Verificación:** Responde con 201 y datos del negocio creado

---

## ✅ Punto 4: POS / NUEVA VENTA

### En Postman:

**Request 2: Crear Venta Presencial Rápida**
```
POST http://127.0.0.1:8000/api/ordenes/crear_venta_manual/
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {TU_TOKEN}

Body:
{
  "negocio_id": 1,
  "metodo_pago_id": 1,
  "items": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio": 150000
    }
  ]
}
```

✅ **Verificación:**
- Responde con 201
- Orden creada con `tipo_venta: "presencial"`
- Stock del producto bajó de 10 a 8
- Total: 300000 (2 × 150000)

---

## ✅ Punto 5: INGRESOS / EGRESOS (Libro de Caja)

### En el Admin:

**Registrar un Gasto:**
1. Ir a `Gastos`
2. Crear nuevo:
   - Tipo: "Servicios (agua, luz, internet)"
   - Descripción: "Pago de electricidad julio"
   - Monto: 50000
   - Método de pago: Efectivo
   - Guardar

✅ **Verificación:** Gasto aparece en la lista

### En Postman:

**Request 3: Ver Balance del Mes**
```
GET http://127.0.0.1:8000/api/gastos/balance_del_mes/
Headers:
  - Authorization: Bearer {TU_TOKEN}
```

✅ **Verificación:** Responde con JSON:
```json
{
  "periodo": "July 2026",
  "ingresos_ordenes_web": 0,
  "ingresos_ventas_presenciales": 300000,
  "ingresos_totales": 300000,
  "egresos": 50000,
  "neto": 250000,
  "ganancia": 140000
}
```

---

## ✅ Punto 6: REPORTES DESCARGABLES + ESTADÍSTICAS EN VIVO

### En Postman:

**Request 4: Dashboard de Estadísticas (Vivo)**
```
GET http://127.0.0.1:8000/api/reportes/estadisticas/
Headers:
  - Authorization: Bearer {TU_TOKEN}
```

✅ **Verificación:** Responde con:
```json
{
  "ingresos_web": 0,
  "ingresos_presencial": 300000,
  "ingresos_totales": 300000,
  "egresos": 50000,
  "ganancia_web": 0,
  "ganancia_presencial": 140000,
  "ganancia_total": 140000,
  "neto": 250000,
  "cantidad_ordenes": 0,
  "cantidad_ventas": 1
}
```

**Request 5: Descargar Reportes en CSV**
```
GET http://127.0.0.1:8000/api/reportes/descargar_csv/?tipo=gastos
Headers:
  - Authorization: Bearer {TU_TOKEN}
```

✅ **Verificación:** Descarga archivo CSV con gastos registrados

**Request 6: Ganancia por Producto**
```
GET http://127.0.0.1:8000/api/reportes/ganancia_por_producto/
Headers:
  - Authorization: Bearer {TU_TOKEN}
```

✅ **Verificación:** Muestra ganancia acumulada por producto

---

## ✅ Punto 7: FACTURACIÓN (SII)

### En Postman:

**Request 7: Generar Boleta**
```
POST http://127.0.0.1:8000/api/facturas/generar_boleta/
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {TU_TOKEN}

Body:
{
  "venta_id": 1,
  "tipo": "boleta"
}
```

✅ **Verificación:** Responde con:
```json
{
  "numero": "BOL-20260723-1",
  "estado": "generada",
  "mensaje": "Boleta generada. Estructura lista para integración con LibreDTE o similar."
}
```

### En el Admin:

1. Ir a `Facturas electrónicas`
2. Verificar que aparece la boleta creada
3. Ver estado: "generada"

✅ **Verificación:** Boleta aparece en admin con estado correcto

---

## 📊 Resumen Final

**Todos los 7 puntos funcionan si:**

| # | Punto | Verificación |
|---|-------|--------------|
| 1️⃣ | Inventario | Producto con SKU y precio escalonado creado ✓ |
| 2️⃣ | Métodos de pago | Todos disponibles en admin ✓ |
| 3️⃣ | Multi-negocio | Negocio secundario creado via API ✓ |
| 4️⃣ | POS | Venta presencial creada, stock actualizado ✓ |
| 5️⃣ | Gastos/Balance | Balance del mes muestra ingresos−gastos=neto ✓ |
| 6️⃣ | Reportes | Dashboard JSON + CSV descargable ✓ |
| 7️⃣ | Facturación | Boleta generada con estado "generada" ✓ |

---

## 🔑 Cómo Obtener Token para Postman

Si necesitas token JWT:

1. En admin, crea un usuario de prueba (o usa `digna`)
2. En Postman, haz POST a:
```
POST http://127.0.0.1:8000/api-token-auth/
Body:
{
  "username": "digna",
  "password": "tu_nueva_contraseña"
}
```

3. Copia el token de la respuesta
4. Úsalo en el header `Authorization: Bearer {token}`

---

## ⚠️ Si algo falla

- **401 Unauthorized:** Token inválido o expirado
- **400 Bad Request:** Verifica JSON y tipos de datos
- **500 Internal Error:** Revisa `python manage.py runserver` para ver el error
- **No aparece en admin:** Cambia a otro navegador o limpia caché

---

**¡Listo!** Prueba los 7 puntos siguiendo este flujo. ✅
