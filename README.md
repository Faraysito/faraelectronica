# Fara Electrónica 🔌

Tienda online de **cámaras de seguridad y equipos de calefacción** para una pyme familiar chilena. Catálogo, carrito, pagos reales con Webpay (Transbank), historial de compras y un panel de administración con métricas de rentabilidad.

🔗 **Demo:** https://faraelectronica.vercel.app
🔗 **API:** https://faraelectronica-backend.onrender.com/api/productos/

> Reemplaza el bloque de arriba con un GIF o video corto del flujo completo
> (catálogo → carrito → pago de prueba → historial). Es lo que más convierte en un portafolio.

---

## ✨ Características

- **Catálogo por categorías** con búsqueda, filtro por precio y ordenamiento.
- **Carrito persistente** (sobrevive recargas) y siempre visible, con login-gate.
- **Autenticación con Google** (OAuth 2.0 → JWT).
- **Pagos con Webpay Plus** de Transbank. El precio se **recalcula en el servidor**: nadie paga menos editando el frontend.
- **Control de stock**: los productos agotados se marcan y no se pueden comprar; el stock se descuenta solo al confirmar el pago.
- **Historial de compras** por usuario, inmutable (guarda nombre/precio/costo del momento de la venta).
- **Compra alternativa por WhatsApp** directo con el vendedor.
- **Panel de administración** con tema propio y **dashboard de estadísticas** (ingresos, utilidad, margen %, ranking de productos) con gráficos.
- **Responsive** y con modo claro/oscuro.

---

## 🧱 Stack

| Capa       | Tecnología                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 19, Vite, React Router 7, Framer Motion, Recharts |
| Backend    | Django 5.2, Django REST Framework, SimpleJWT            |
| Pagos      | Transbank SDK (Webpay Plus)                             |
| Auth       | Google OAuth 2.0 + JWT                                  |
| Base datos | PostgreSQL                                              |
| Media      | Cloudinary                                              |
| Deploy     | Vercel (frontend) · Render (backend)                    |

---

## 🏗️ Arquitectura

```
┌──────────────┐      HTTPS / JSON      ┌──────────────────┐
│   Frontend   │ ─────────────────────► │     Backend      │
│  React+Vite  │                        │  Django REST API │
│   (Vercel)   │ ◄───────────────────── │     (Render)     │
└──────┬───────┘      JWT Bearer        └────────┬─────────┘
       │                                         │
       │ OAuth                          ┌────────┴─────────┐
       ▼                                ▼                  ▼
  ┌─────────┐                    ┌─────────────┐   ┌──────────────┐
  │ Google  │                    │ PostgreSQL  │   │  Transbank   │
  │  OAuth  │                    │   (datos)   │   │  (Webpay)    │
  └─────────┘                    └─────────────┘   └──────────────┘
                                        ▲
                                 ┌──────┴──────┐
                                 │  Cloudinary │
                                 │  (imágenes) │
                                 └─────────────┘
```

---

## 🚀 Puesta en marcha local

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

---

## 🧪 Tests

```bash
cd backend
python manage.py test productos
```

Cubre la lógica de negocio (margen, utilidad, stock), la **seguridad de pagos** (recálculo de precio en servidor, validación de stock) y el aislamiento del historial por usuario.

---

## 💳 Pago de prueba (Webpay integración)

Con `DEBUG=True` el SDK usa el ambiente de prueba de Transbank. Tarjeta de test:

- VISA `4051 8856 0044 6623` · CVV `123` · fecha futura cualquiera
- RUT `11.111.111-1` · clave `123`

---

## 📁 Estructura

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

---

## 👤 Autor

Diseñado y desarrollado por **Diego Farías**
[Portafolio](https://diegofarias-portafolio.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/diego-ignacio-de-jesus-farias-araya-6927642a8/)

---

## 📄 Licencia

Proyecto privado. © 2026 Fara Electrónica. Todos los derechos reservados.
