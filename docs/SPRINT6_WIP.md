# MILA — Sprint 6 (entregado, por aceptar)

Plan formal: `docs/entrega-sprint6/`.

## Ya embarcado en la app

| PB | Historia | Estado |
|----|----------|--------|
| PB-017 | Programar visita sin conflictos de agenda | API + UI especialista |
| PB-018 | Técnico consulta antecedentes | Detalle + visitas en consola |
| PB-019 | Registrar actividades / diagnóstico / solución | Cierre de técnico |
| PB-020 | Resultado: resuelto / pendiente / nueva visita / escalado | `ClosureOutcome` |
| PB-010 (gap) | Revisar análisis IA | Aceptar / modificar / rechazar |
| PB-021 | Evidencias fotográficas en el cierre | BD + ruta autenticada |
| PB-025 (slice) | Notificaciones in-app | Campana + API |

## Endpoints nuevos

- `POST /api/tickets/[id]/visits`
- `POST /api/tickets/[id]/attention`
- `POST /api/tickets/[id]/close`
- `POST /api/ai/[id]/review`
- `GET|POST /api/notifications`

## Eventos n8n adicionales

- `ticket.visit_scheduled`
- `ticket.closed`
- `ticket.ai_reviewed`

## Siguiente

- ~~Evidencias de cierre (fotos post-visita)~~ — hecho (PB-021)
- Agenda visual semanal del técnico
- Publicar/redeploy app con schema nuevo
