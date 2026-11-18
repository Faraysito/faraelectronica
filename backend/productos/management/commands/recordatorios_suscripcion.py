"""Recordatorio de recompra para suscripciones (no hay cobro automático).

Correr 1 vez al día (ej: Cron Job de Render):
    python manage.py recordatorios_suscripcion --dias-antes 3

Manda a Klaviyo el evento "Recordatorio suscripcion" con el link de recompra;
el correo se arma con un flow en Klaviyo que se dispare con esa métrica.
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import F, Q
from django.utils.timezone import now

from productos import klaviyo
from productos.models import Suscripcion

METRICA = 'Recordatorio suscripcion'


class Command(BaseCommand):
    help = 'Envía a Klaviyo los recordatorios de recompra de suscripciones que vencen pronto'

    def add_arguments(self, parser):
        parser.add_argument('--dias-antes', type=int, default=3, help='Avisar con esta anticipación (días)')

    def handle(self, *args, **opciones):
        limite = now().date() + timedelta(days=opciones['dias_antes'])
        pendientes = (
            Suscripcion.objects
            .filter(activa=True, proxima_fecha__lte=limite)
            .filter(Q(recordatorio_enviado_para__isnull=True) | ~Q(recordatorio_enviado_para=F('proxima_fecha')))
            .select_related('usuario')
        )
        if not klaviyo.configurado():
            self.stdout.write(self.style.WARNING(
                f'KLAVIYO_PRIVATE_KEY no configurada: {pendientes.count()} recordatorio(s) sin enviar.'
            ))
            for s in pendientes:
                self.stdout.write(f'  - {s.usuario.email}: {s.nombre_producto} ({s.proxima_fecha})')
            return

        enviados = 0
        for s in pendientes:
            link = (
                f"{settings.FRONTEND_URL}/producto/{s.producto_id}"
                f"?suscripcion=1&cantidad={s.cantidad}&frecuencia={s.frecuencia_dias}"
            )
            ok = klaviyo.enviar_evento(
                s.usuario.email,
                METRICA,
                {
                    'producto': s.nombre_producto,
                    'producto_id': s.producto_id,
                    'cantidad': s.cantidad,
                    'frecuencia_dias': s.frecuencia_dias,
                    'descuento_pct': s.descuento_pct,
                    'proxima_fecha': s.proxima_fecha.isoformat(),
                    'link_recompra': link,
                },
                unique_id=f'sub-{s.id}-{s.proxima_fecha.isoformat()}',
            )
            if ok:
                s.recordatorio_enviado_para = s.proxima_fecha
                s.save(update_fields=['recordatorio_enviado_para', 'updated_at'])
                enviados += 1
        self.stdout.write(self.style.SUCCESS(f'{enviados} recordatorio(s) enviados.'))
