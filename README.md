# Fara Electrónica

Tienda online de **cámaras de seguridad y equipos de calefacción** para una pyme familiar chilena. Catálogo, carrito, pagos reales con Webpay (Transbank), historial de compras y un panel de administración con métricas de rentabilidad.

- Demo: https://faraelectronica.vercel.app
- API: https://faraelectronica-backend.onrender.com/api/productos/

## Características

- **Catálogo por categorías** con búsqueda, filtro por precio y ordenamiento.
- **Carrito persistente** (sobrevive recargas) y siempre visible, con login-gate.
- **Autenticación con Google** (OAuth 2.0 → JWT).
- **Pagos con Webpay Plus** de Transbank. El precio se **recalcula en el servidor**: nadie paga menos editando el frontend.
- **Control de stock**: los productos agotados se marcan y no se pueden comprar; el stock se descuenta solo al confirmar el pago.
- **Historial de compras** por usuario, inmutable (guarda nombre/precio/costo del momento de la venta).
- **Compra alternativa por WhatsApp** directo con el vendedor.
- **Panel de administración** con tema propio y **dashboard de estadísticas** (ingresos, utilidad, margen %, ranking de productos) con gráficos.
- **Responsive** y con modo claro/oscuro.
- **Página de producto** (`/producto/:id`) pensada para convertir: titular con el resultado, estrellas y reseñas de compradores verificados (con fotos), combos x1/x2/x3, suscríbete y ahorra, precio por día, garantía legal, especificaciones, sellos, tabla comparativa, timeline, FAQ, disclaimer y botón de compra fijo.
- **Carrito** con barra de envío gratis, upsell de complementos y pago express directo a Webpay.
- **Marketing**: pop-up de email a Klaviyo, Meta Pixel + Conversions API (Purchase deduplicado) y variantes A/B.

## Página de producto: qué se edita dónde

- **Copys, toggles por sección y variantes A/B**: `frontend/src/config/tienda.js`. Para ver una variante: `?ab_titular=b` o `?ab_cta=b`.
- **Por producto (admin de Django)**: titular, especificaciones, modo de uso, ficha técnica, certificaciones, si admite suscripción, complementos (upsell) y combos (precios escalonados).
- **Precios y reglas (backend `.env`)**: `COMBO_DESCUENTOS`, `SUSCRIPCION_DESCUENTO_PCT`, `SUSCRIPCION_FRECUENCIAS`, `ENVIO_GRATIS_DESDE`. El front los lee de `/api/tienda/config/` y el backend cobra lo mismo.
- **Integraciones**: `VITE_META_PIXEL_ID`, `VITE_KLAVIYO_PUBLIC_KEY`, `VITE_KLAVIYO_LIST_ID` (front) y `META_PIXEL_ID`, `META_CAPI_TOKEN`, `KLAVIYO_PRIVATE_KEY`, `FRONTEND_URL` (backend). Vacías = apagadas.
- **Suscripciones**: no hay cobro automático. Correr una vez al día `python manage.py recordatorios_suscripcion` (Cron Job de Render) para mandar a Klaviyo el evento del recordatorio de recompra; el correo se arma con un flow en Klaviyo.

## Stack

| Capa       | Tecnología                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 19, Vite, React Router 7, Framer Motion, Recharts |
| Backend    | Django 5.2, Django REST Framework, SimpleJWT            |
| Pagos      | Transbank SDK (Webpay Plus)                             |
| Auth       | Google OAuth 2.0 + JWT                                  |
| Base datos | PostgreSQL                                              |
| Media      | Cloudinary                                              |
| Deploy     | Vercel (frontend) · Render (backend)                    |

## Arquitectura

- El frontend (React + Vite) está en Vercel y le habla a la API por HTTPS, con JWT en el header.
- El backend (Django REST) está en Render, con PostgreSQL para los datos y Cloudinary para las imágenes.
- El login es con Google OAuth y los pagos con Webpay Plus de Transbank.

## Puesta en marcha local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Y completa tus credenciales
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API en `http://127.0.0.1:8000/api/` · Admin en `http://127.0.0.1:8000/gestion-fara-super-user/`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # Y completa VITE_GOOGLE_CLIENT_ID
npm run dev
```

App en `http://localhost:5173`

## Tests

```bash
cd backend
python manage.py test productos

cd frontend
npm test
```

Cubre la lógica de negocio (margen, utilidad, stock), la **seguridad de pagos** (recálculo de precio en servidor, validación de stock) y el aislamiento del historial por usuario.

## Pago de prueba (Webpay integración)

Con `DEBUG=True` el SDK usa el ambiente de prueba de Transbank. Tarjeta de test:

- VISA `4051 8856 0044 6623` · CVV `123` · fecha futura cualquiera
- RUT `11.111.111-1` · clave `123`

## Estructura

```
faraelectronica/
├── backend/                 # API Django REST
│   ├── backend/             # settings, urls, wsgi
│   └── productos/           # app principal: modelos, vistas, serializers, tests
└── frontend/                # SPA React
    └── src/
        ├── components/      # Navbar, modales, catálogo
        ├── context/         # Carrito, Tema
        ├── hooks/           # filtros, keep-alive
        └── pages/           # Home, Camaras, Calefaccion, AdminStats, 404
```

## Autor

Diseñado y desarrollado por **Diego Farías**
[Portafolio](https://diegofarias-portafolio.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/diego-ignacio-de-jesus-farias-araya-6927642a8/)

## Licencia

Proyecto privado. © 2026 Fara Electrónica. Todos los derechos reservados.
