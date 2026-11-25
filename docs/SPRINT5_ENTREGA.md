# MILA — Entrega Sprint 5

## Objetivo del sprint

Cerrar el ciclo operativo de mesa de ayuda hasta **asignación de técnico**:

| PB | Historia | Estado en MILA |
|----|----------|----------------|
| PB-012 | Cambiar estado del caso | Consola especialista |
| PB-013 | Escalar con motivo | Cliente + coordinador |
| PB-014 | Registrar técnicos, zonas, capacidad | `/especialista/tecnicos` |
| PB-015 | Recomendaciones de técnicos | Score por zona/skills/capacidad |
| PB-016 | Asignar técnico | Asignación confirmada + notificación |

Base incluida (sprints previos necesarios para demo):

- Auth y roles (cliente, técnico, coordinador, admin)
- Alta/consulta de solicitudes
- Agente IA al crear caso (local o OpenAI si hay API key)
- Webhooks n8n (`N8N_WEBHOOK_URL`) + `AutomationLog`
- PostgreSQL con Prisma en runtime + DDL MySQL académico en `docs/sql/mila.sql`

## Cuentas

Ver `docs/CREDENCIALES_DEMO.md` (correos: admin, 4 especialistas, 8 técnicos, 40 clientes).
Sin registro público: solo login. Contraseña solo vía `MILA_DEMO_PASSWORD` en el entorno.

## Cómo correr

```bash
cp .env.example .env
# AUTH_SECRET + DATABASE_URL (+ MILA_DEMO_PASSWORD solo para seed local)
npm install
npx prisma db push
npm run db:seed
npm run dev
```

## Demo sugerida (sustentación)

1. Login como `cliente@mila.app` → crear solicitud.
2. Ver análisis IA + timeline.
3. Escalar a visita.
4. Login como `coord@mila.app` → bandeja → abrir caso.
5. Generar recomendaciones → asignar técnico.
6. Login como técnico asignado → ver caso en bandeja.

## n8n

Eventos emitidos al webhook:

- `ticket.created`
- `ticket.ai_analyzed`
- `ticket.status_changed`
- `ticket.escalated`
- `ticket.assigned`

Importar plantilla: `docs/n8n/mila-sprint5-workflow.json`.
