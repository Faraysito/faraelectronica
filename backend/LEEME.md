# 🎨 Tema Admin — Fara Electrónica

Personaliza el panel de Django con el diseño de tu página principal:
fondo negro `#0a0a0a`, amarillo `#f5c800`, fuentes **Bebas Neue** + **DM Sans**.

✅ Sin librerías externas (no rompe el deploy en Render).
✅ Probado renderizando el admin real con Django 5.2 (todas las páginas OK).

---

## 📁 Contenido del paquete

```
templates/
└── admin/
    ├── base_site.html   ← branding "FARA ELECTRÓNICA" + carga del CSS
    └── index.html       ← dashboard con 2 accesos directos grandes

productos/
└── static/
    └── admin/
        ├── css/
        │   └── fara_admin.css   ← el tema completo
        └── img/                 ← (opcional) pon aquí tu logo.png
```

---

## 🚀 Instalación — 3 pasos

### Paso 1 · Copiar las carpetas dentro de `backend/`

- Copia la carpeta **`templates/`** a la raíz de tu carpeta `backend/`
  (queda al lado de `manage.py` → `backend/templates/admin/...`).
- Copia la carpeta **`static/`** dentro de `backend/productos/`
  (queda `backend/productos/static/admin/...`).
  Si ya tienes `productos/static`, solo fusiona, no se pisa nada.

Resultado:

```
backend/
├── manage.py
├── templates/admin/base_site.html
├── templates/admin/index.html
└── productos/static/admin/css/fara_admin.css
```

### Paso 2 · Editar `backend/backend/settings.py` ⚠️ IMPORTANTE

En la lista `TEMPLATES`, cambia `'DIRS': []` por la ruta a `templates`.
Esto es lo que hace que tus plantillas tengan prioridad sobre las del admin
(con solo `APP_DIRS` NO funciona, porque `django.contrib.admin` va primero).

Tu settings tiene esto:

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],                          # ← CAMBIAR ESTA LÍNEA
        'APP_DIRS': True,
        ...
    },
]
```

Déjalo así:

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],    # ← AHORA APUNTA A backend/templates
        'APP_DIRS': True,
        ...
    },
]
```

(`BASE_DIR` ya está definido arriba en tu settings, no hace falta importarlo.)

### Paso 3 · Recolectar estáticos

**Local:** nada extra, solo:

```bash
python manage.py runserver
```

Entra a → http://127.0.0.1:8000/gestion-fara-super-user/

**Producción (Render):**

```bash
python manage.py collectstatic --noinput
```

Tu deploy de Render normalmente ya corre esto en el build. Si ves el admin
sin estilos en producción, es esto: vuelve a ejecutar `collectstatic`.

---

## 🛠️ Personalización opcional

**Logo en el header (en vez del texto):**

1. Guarda tu logo en `productos/static/admin/img/logo.png`.
2. En `templates/admin/base_site.html`, descomenta la línea del `<img>`.

**Cambiar colores:** edita las variables `--fara-*` al inicio de `fara_admin.css`.

**Títulos del sitio** (opcional, en `backend/backend/urls.py`):

```python
admin.site.site_header = "Fara Electrónica"
admin.site.site_title = "Fara Admin"
admin.site.index_title = "Panel de gestión"
```

---

## ✅ Qué vas a ver

- Header amarillo con **FARA ELECTRÓNICA** en Bebas Neue.
- Fondo negro, tarjetas oscuras con línea amarilla arriba (igual que el modal del Home).
- Tablas, formularios, filtros y botones con la paleta de tu web.
- Dashboard de inicio con accesos directos: **"Todos los productos"** y **"+ Agregar producto"**.
- Login estilizado igual.
- Todo lo demás (galería de imágenes inline, categorías proxy de Calefacción, etc.) sigue funcionando igual, solo cambia el aspecto.

---

## 🔄 Para revertir

Borra las 2 carpetas que copiaste y vuelve a poner `'DIRS': []` en settings.
El admin regresa a su aspecto original.
