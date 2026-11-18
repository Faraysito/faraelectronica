from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'faraelectronica-backend.onrender.com']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'cloudinary_storage',
    'cloudinary',
    'rest_framework_simplejwt',
    'productos',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
        'OPTIONS': {'sslmode': 'require'} if not DEBUG else {},
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STORAGES = {
    "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '200/min',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://faraelectronica.vercel.app",
]
CORS_ALLOW_CREDENTIALS = True

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = 'DENY'

# Transbank / Webpay
# con DEBUG=True el SDK usa las credenciales de integración; en producción salen del entorno
TBK_COMMERCE_CODE = os.getenv('TBK_COMMERCE_CODE')
TBK_API_KEY = os.getenv('TBK_API_KEY')

# a donde vuelve webpay después de pagar (/pago/retorno del frontend)
WEBPAY_RETURN_URL = os.getenv(
    'WEBPAY_RETURN_URL',
    'http://localhost:5173/pago/retorno'  # en prod: https://faraelectronica.vercel.app/pago/retorno
)

# ── Tienda: todo editable por variables de entorno ──────────────────
def _env_int(nombre, defecto):
    try:
        return int(os.getenv(nombre, defecto))
    except (TypeError, ValueError):
        return defecto


def _env_combos(valor):
    """'2:10,3:15' -> {2: 10, 3: 15} (cantidad: % de descuento por unidad)."""
    combos = {}
    for par in (valor or '').split(','):
        cantidad, _, pct = par.partition(':')
        if cantidad.strip().isdigit() and pct.strip().isdigit():
            combos[int(cantidad)] = int(pct)
    return combos


# combos globales x2/x3; vacío = solo los precios escalonados que se carguen en el admin
COMBO_DESCUENTOS = _env_combos(os.getenv('COMBO_DESCUENTOS', ''))
# suscríbete y ahorra: % de descuento (0 = apagada) y frecuencias permitidas en días
SUSCRIPCION_DESCUENTO_PCT = _env_int('SUSCRIPCION_DESCUENTO_PCT', 10)
SUSCRIPCION_FRECUENCIAS = [
    int(x) for x in os.getenv('SUSCRIPCION_FRECUENCIAS', '30,60,90').split(',') if x.strip().isdigit()
]
# envío gratis desde este total (0 = sin barra de envío gratis)
ENVIO_GRATIS_DESDE = _env_int('ENVIO_GRATIS_DESDE', 50000)
# url pública del front (links de los correos de recompra)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')

# Meta Conversions API: sin pixel + token no se manda nada
META_PIXEL_ID = os.getenv('META_PIXEL_ID', '')
META_CAPI_TOKEN = os.getenv('META_CAPI_TOKEN', '')
META_TEST_EVENT_CODE = os.getenv('META_TEST_EVENT_CODE', '')
META_GRAPH_VERSION = os.getenv('META_GRAPH_VERSION', 'v26.0')
META_CAPI_ASYNC = True

# Klaviyo server-side (eventos para el flow de recordatorio de suscripción)
KLAVIYO_PRIVATE_KEY = os.getenv('KLAVIYO_PRIVATE_KEY', '')
KLAVIYO_REVISION = os.getenv('KLAVIYO_REVISION', '2026-07-15')
