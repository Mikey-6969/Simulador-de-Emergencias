# Conectar MILA ↔ n8n

## 1. Levantar n8n (opcional con Docker)

```bash
docker compose up -d n8n
```

UI: http://localhost:5678

## 2. Importar flujo

1. En n8n: **Workflows → Import**
2. Archivo: `docs/n8n/mila-sprint5-workflow.json`
3. Activa el workflow
4. Copia la URL del nodo Webhook (ej. `http://localhost:5678/webhook/mila-events`)

## 3. Configurar MILA

En `.env`:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/mila-events
OPENAI_API_KEY=  # opcional
```

Reinicia `npm run dev`.

## 4. Eventos que envía MILA

| flow | Cuándo |
|------|--------|
| `ticket.created` | Nueva solicitud |
| `ticket.ai_analyzed` | Tras análisis IA |
| `ticket.status_changed` | Cambio de estado |
| `ticket.escalated` | Escalamiento |
| `ticket.assigned` | Asignación de técnico |

Si `N8N_WEBHOOK_URL` está vacío, el evento se guarda igual en `AutomationLog` (visible en `/especialista/automatizacion`).

## 5. Probar

1. Login `cliente@mila.app` / `Mila123*`
2. Registrar caso (wizard servicio → sede → detalle)
3. En n8n debe llegar el webhook
4. En MILA: `/especialista/automatizacion` muestra el log
