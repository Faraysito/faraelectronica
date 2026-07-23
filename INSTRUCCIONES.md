# 🚀 Paquete de mejoras — Fara Electrónica

Mejoras para llevar el proyecto de "práctica" a **producto presentable en portafolio**: tests, gráficos en el admin, buscador, página 404, fix del arranque lento de Render, SEO y documentación profesional.

> ✅ Todo el código fue probado: los 20 tests del backend pasan, el frontend compila
> sin errores (build + lint limpios) y la migración queda sin drift. Lo único que no
> se pudo verificar aquí es la llamada real a Transbank (necesita internet hacia su
> servidor), pero eso ya funcionaba en tu proyecto.

---

## 📦 Qué incluye y dónde va cada archivo

Respeta las rutas. Los archivos **NUEVOS** se copian tal cual; los marcados como
**EDITAR** requieren un cambio manual pequeño (explicado abajo).

### Backend

| Archivo del paquete          | Va en tu proyecto            | Acción                                           |
| ---------------------------- | ---------------------------- | ------------------------------------------------ |
| `backend/productos/tests.py` | `backend/productos/tests.py` | **REEMPLAZAR** (hoy está vacío)                  |
| `backend/productos/apps.py`  | `backend/productos/apps.py`  | **REEMPLAZAR** (arregla el drift de migraciones) |
| `backend/.env.example`       | `backend/.env.example`       | **NUEVO**                                        |

### Frontend

| Archivo del paquete                        | Va en tu proyecto                | Acción    |
| ------------------------------------------ | -------------------------------- | --------- |
| `frontend/src/components/CatalogoBase.jsx` | igual                            | **NUEVO** |
| `frontend/src/pages/AdminStats.jsx`        | igual                            | **NUEVO** |
| `frontend/src/pages/NoEncontrado.jsx`      | igual                            | **NUEVO** |
| `frontend/src/hooks/useFiltroProductos.js` | igual (crea la carpeta `hooks/`) | **NUEVO** |
| `frontend/src/hooks/useKeepAlive.js`       | igual                            | **NUEVO** |
| `frontend/public/robots.txt`               | igual                            | **NUEVO** |
| `frontend/public/sitemap.xml`              | igual                            | **NUEVO** |
| `frontend/.env.example`                    | igual                            | **NUEVO** |

### Raíz

| Archivo del paquete | Va en tu proyecto           | Acción                                                                     |
| ------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `README.md`         | `README.md` (raíz del repo) | **NUEVO** (mueve tus LEEME a una carpeta `/notas` si quieres conservarlos) |

---

## 🔧 Pasos de instalación

### 1. Backend (rápido)

```bash
cd backend
# copia tests.py y apps.py en productos/
python manage.py test productos        # deben pasar 20 tests
python manage.py makemigrations --check # debe decir "No changes detected"
```

`apps.py` con `default_auto_field` elimina el drift que Django reportaba (querer
re-alterar los campos id). **No genera migración nueva ni toca la base de datos.**

### 2. Frontend — instalar Recharts (para los gráficos del admin)

```bash
cd frontend
npm install recharts
```

### 3. Frontend — copiar archivos

Copia los archivos de la tabla. Crea la carpeta `src/hooks/` si no existe.

### 4. Frontend — EDITAR `src/App.jsx` (wiring de rutas nuevas)

Importa las páginas nuevas y agrega sus rutas. Para que **Recharts no infle el bundle
principal**, carga `AdminStats` con lazy loading:

```jsx
import { lazy, Suspense } from "react";
// ...tus imports actuales...
import NoEncontrado from "./pages/NoEncontrado";
const AdminStats = lazy(() => import("./pages/AdminStats"));
```

Dentro de `<Routes>`, junto a las demás rutas:

```jsx
<Route
  path="/admin/stats"
  element={wrap(
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <AdminStats />
    </Suspense>,
  )}
/>;
{
  /* SIEMPRE la última, captura cualquier ruta inexistente */
}
<Route path="*" element={wrap(<NoEncontrado />)} />;
```

### 5. Frontend — EDITAR `src/pages/Camaras.jsx` y `Calefaccion.jsx` (opcional pero recomendado)

`CatalogoBase.jsx` reemplaza el código casi idéntico de ambas páginas y **añade
buscador, filtro por precio, lazy-load de imágenes, badge "Quedan N" y aviso de
servidor despertando**. Cada página queda en ~10 líneas:

```jsx
// Camaras.jsx
import CatalogoBase from "../components/CatalogoBase";

export default function Camaras() {
  return (
    <CatalogoBase
      categoria="camaras"
      titulo={
        <>
          Cámaras de <span>Seguridad</span>
        </>
      }
      subtitulo="Vigilancia profesional para tu hogar y negocio"
    />
  );
}
```

```jsx
// Calefaccion.jsx
import CatalogoBase from "../components/CatalogoBase";

export default function Calefaccion() {
  return (
    <CatalogoBase
      categoria="calefaccion"
      titulo={
        <>
          Equipos de <span>Calefacción</span>
        </>
      }
      subtitulo="Calor eficiente para cada espacio"
    />
  );
}
```

> Si prefieres no tocar tus páginas, igual puedes usar solo el hook
> `useFiltroProductos` dentro de las que ya tienes.

### 6. (Opcional) Warm-up del backend en toda la app

Para empezar a despertar Render apenas alguien entra a la web, llama al hook en `App.jsx`:

```jsx
import { useKeepAlive } from "./hooks/useKeepAlive";

function App() {
  useKeepAlive(); // <- añade esta línea
  const { tema, toggleTema } = useTema();
  // ...resto igual
}
```

---

## 🎯 Mejoras que NO son archivos (hazlas a mano, alto impacto)

1. **OG image con URL absoluta.** En `index.html`, las metas `og:image` apuntan a
   `/src/assets/images/logo.png`, que no existe en producción y rompe la
   previsualización en WhatsApp/Facebook. Mueve un `logo.png` a `frontend/public/`
   y usa la URL completa:

   ```html
   <meta
     property="og:image"
     content="https://faraelectronica.vercel.app/logo.png"
   />
   <meta
     name="twitter:image"
     content="https://faraelectronica.vercel.app/logo.png"
   />
   <link rel="icon" type="image/png" href="/logo.png" />
   ```

2. **Limpia el historial de Git** (o al menos a futuro). Commits como "ahora si(?",
   "ultimo commit 5:35" duplicados se ven mal en un repo de portafolio. Para el futuro:
   mensajes claros tipo `feat: buscador de productos`, `test: cobertura de pagos`.

3. **Mueve los `LEEME_*.txt/.md`** a una carpeta `/notas` o bórralos. Un reclutador
   no debería abrir el repo y ver notas internas de instalación; el `README.md` nuevo
   cumple ese rol.

4. **Borra `frontend/requirements.txt`** — es un archivo de Python fuera de lugar en
   un proyecto Node.

5. **Lighthouse.** Corre Lighthouse en Chrome DevTools sobre la demo y apunta a >90 en
   Performance y Accesibilidad. Las imágenes pesadas (logo 288 KB, camaras 313 KB)
   conviene comprimirlas a WebP.

6. **Video/GIF en el README.** Graba el flujo completo (catálogo → carrito → pago de
   prueba → historial) con Loom o ScreenToGif y pégalo arriba del README. Es lo que
   más sube la percepción del proyecto.

---

## ✅ Checklist de verificación

- [ ] `python manage.py test productos` → 20 OK
- [ ] `python manage.py makemigrations --check` → sin cambios
- [ ] `npm install recharts` hecho
- [ ] Archivos nuevos copiados (hooks, pages, components, public)
- [ ] Rutas `/admin/stats` y `*` (404) añadidas en App.jsx
- [ ] `npm run build` sin errores
- [ ] OG image con URL absoluta
- [ ] README en la raíz, LEEME viejos movidos

---

## 📊 Qué hace cada mejora

- **tests.py** — 20 pruebas: lógica de margen/utilidad, seguridad de pagos
  (recálculo de precio en servidor, validación de stock), aislamiento del historial,
  y protección del endpoint de estadísticas. Demuestra que sabes testear.
- **AdminStats.jsx** — dashboard con gráficos (barras de más vendidos, torta
  utilidad vs costo) sobre el endpoint `/api/estadisticas/` que ya existía. El "wow"
  visual de la demo.
- **CatalogoBase.jsx** — unifica Camaras/Calefaccion y agrega buscador, filtro de
  precio, lazy-load, badge de stock bajo y aviso de cold-start.
- **NoEncontrado.jsx** — página 404 con la identidad de la marca.
- **useFiltroProductos / useKeepAlive** — la lógica reutilizable detrás de lo anterior.
- **README + .env.example + robots + sitemap** — la capa de profesionalismo y SEO
  que un revisor técnico revisa primero.
