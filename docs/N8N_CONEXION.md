# Conectar MILA ↔ n8n

## 1. Levantar n8n

Sin Docker (recomendado en este repo):

```bash
npm run n8n
```

UI: http://127.0.0.1:5678

Con Docker: `docker compose up -d n8n`

## 2. Importar flujo

1. Login en n8n (primera vez crea el owner)
2. **Workflows → Import from File**
3. Archivo: `docs/n8n/mila-sprint5-workflow.json`
4. Activa el toggle del workflow
5. URL producción: `http://127.0.0.1:5678/webhook/mila-events`

## 3. Configurar MILA

```env
N8N_WEBHOOK_URL=http://127.0.0.1:5678/webhook/mila-events
OPENAI_API_KEY=   # opcional
DATABASE_URL=postgresql://...
AUTH_SECRET=...
```

Reinicia `npm run dev`.

## 4. Eventos

| flow | Cuándo |
|------|--------|
| `ticket.created` | Nueva solicitud |
| `ticket.ai_analyzed` | Tras análisis IA |
| `ticket.status_changed` | Cambio de estado |
| `ticket.escalated` | Escalamiento |
| `ticket.assigned` | Asignación de técnico |

Cada emisión queda en `AutomationLog` (`/especialista/automatizacion`).

## 5. Probar

```bash
curl -X POST http://127.0.0.1:5678/webhook/mila-events \
  -H 'Content-Type: application/json' \
  -d '{"flow":"ticket.created","number":"MILA-TEST"}'
```

Luego crea un caso en `/cliente/registrar` y verifica ejecución en n8n + log en MILA.
