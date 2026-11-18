"""Klaviyo server-side: eventos para disparar flows (ej: recordatorio de recompra de suscripción)."""
import json
import logging

import requests
from django.conf import settings

log = logging.getLogger(__name__)
URL_EVENTOS = 'https://a.klaviyo.com/api/events'


def configurado():
    return bool(getattr(settings, 'KLAVIYO_PRIVATE_KEY', ''))


def enviar_evento(email, metrica, propiedades=None, unique_id=None, valor=None):
    """Crea un evento en Klaviyo. True si lo aceptó (202)."""
    if not configurado() or not email:
        return False
    atributos = {
        'properties': propiedades or {},
        'metric': {'data': {'type': 'metric', 'attributes': {'name': metrica}}},
        'profile': {'data': {'type': 'profile', 'attributes': {'email': email}}},
    }
    if unique_id:
        atributos['unique_id'] = unique_id
    if valor is not None:
        atributos['value'] = valor
    try:
        res = requests.post(
            URL_EVENTOS,
            data=json.dumps({'data': {'type': 'event', 'attributes': atributos}}),
            headers={
                'Authorization': f'Klaviyo-API-Key {settings.KLAVIYO_PRIVATE_KEY}',
                'revision': settings.KLAVIYO_REVISION,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            },
            timeout=8,
        )
        if res.status_code >= 300:
            log.warning('Klaviyo respondió %s: %s', res.status_code, res.text[:300])
            return False
        return True
    except requests.RequestException as e:
        log.warning('Klaviyo no respondió: %s', e)
        return False
