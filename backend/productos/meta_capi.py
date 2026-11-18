"""Meta Conversions API (server-side). Se deduplica con el Pixel usando el mismo event_id."""
import hashlib
import logging
import threading
import time

import requests
from django.conf import settings

log = logging.getLogger(__name__)


def configurado():
    return bool(getattr(settings, 'META_PIXEL_ID', '') and getattr(settings, 'META_CAPI_TOKEN', ''))


def _sha256(valor):
    return hashlib.sha256(valor.strip().lower().encode('utf-8')).hexdigest()


def payload_purchase(orden, ip=None, user_agent=None, fbp=None, fbc=None):
    items = list(orden.items.all())
    user_data = {
        'em': [_sha256(orden.usuario.email)] if orden.usuario.email else None,
        'external_id': [_sha256(str(orden.usuario_id))],
        'client_ip_address': ip,
        'client_user_agent': user_agent,
        'fbp': fbp,
        'fbc': fbc,
    }
    evento = {
        'event_name': 'Purchase',
        'event_time': int(time.time()),
        # mismo id que manda el Pixel en /pago/retorno -> Meta lo cuenta una sola vez
        'event_id': f'purchase-{orden.id}',
        'action_source': 'website',
        'event_source_url': getattr(settings, 'WEBPAY_RETURN_URL', None),
        'user_data': {k: v for k, v in user_data.items() if v},
        'custom_data': {
            'currency': 'CLP',
            'value': orden.total,
            'order_id': str(orden.id),
            'content_type': 'product',
            'content_ids': [str(i.producto_id) for i in items if i.producto_id],
            'contents': [
                {'id': str(i.producto_id), 'quantity': i.cantidad, 'item_price': i.precio_unitario}
                for i in items if i.producto_id
            ],
            'num_items': sum(i.cantidad for i in items),
        },
    }
    payload = {'data': [evento]}
    if getattr(settings, 'META_TEST_EVENT_CODE', ''):
        payload['test_event_code'] = settings.META_TEST_EVENT_CODE
    return payload


def enviar_evento(payload):
    url = f"https://graph.facebook.com/{settings.META_GRAPH_VERSION}/{settings.META_PIXEL_ID}/events"
    try:
        res = requests.post(url, params={'access_token': settings.META_CAPI_TOKEN}, json=payload, timeout=5)
        if res.status_code >= 300:
            log.warning('Meta CAPI respondió %s: %s', res.status_code, res.text[:300])
            return False
        return True
    except requests.RequestException as e:
        log.warning('Meta CAPI no respondió: %s', e)
        return False


def enviar_purchase(orden, **datos_cliente):
    """Arma el evento y lo manda (en un hilo para no demorar la respuesta). False si no hay credenciales."""
    if not configurado():
        return False
    payload = payload_purchase(orden, **datos_cliente)
    if getattr(settings, 'META_CAPI_ASYNC', True):
        threading.Thread(target=enviar_evento, args=(payload,), daemon=True).start()
        return True
    return enviar_evento(payload)
