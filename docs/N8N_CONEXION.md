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
| `notification.external` | Envío de notificación por canal externo (correo vía n8n) |

Cada emisión queda en `AutomationLog` (`/especialista/automatizacion`).

## 5. Probar

```bash
curl -X POST http://127.0.0.1:5678/webhook/mila-events \
  -H 'Content-Type: application/json' \
  -d '{"flow":"ticket.created","number":"MILA-TEST"}'
```

Luego crea un caso en `/cliente/registrar` y verifica ejecución en n8n + log en MILA.

## 6. Sprint 7: IA orquestada y notificaciones externas

Plantillas importables:

- `docs/n8n/mila-sprint7-eventos-ia.json` — webhook `mila-events` → responde 200 → llama a `POST {MILA_URL}/api/automation/ai-analyze` con `x-mila-secret`.
- `docs/n8n/mila-sprint7-notificaciones.json` — webhook `mila-notify` → correo (requiere credencial SMTP).

Variables de entorno de MILA:

```env
N8N_WEBHOOK_URL=http://127.0.0.1:5678/webhook/mila-events
N8N_WEBHOOK_SECRET=...        # firma HMAC en x-mila-signature (opcional)
AI_VIA_N8N=true               # delega el análisis de IA a n8n (fallback local si falla)
N8N_CALLBACK_SECRET=...       # secreto que n8n envía en x-mila-secret al callback de IA
NOTIFY_WEBHOOK_URL=http://127.0.0.1:5678/webhook/mila-notify
```

Variables del proceso de n8n: `MILA_URL`, `MILA_CALLBACK_SECRET`, `MILA_MAIL_FROM`.

Los payloads de eventos se sanitizan (lista blanca de campos, sin datos personales). Los fallos quedan en `/especialista/automatizacion` con botón **Reintentar**.

## 7. Correo y WhatsApp directos desde MILA

Cada notificación se envía por **correo** (si el usuario tiene email) y por **WhatsApp** (si tiene celular), con la información del caso: número, asunto, estado, prioridad, servicio, zona, técnico y contacto, respuesta/recomendación de la IA, próxima visita y solución. Eventos: solicitud registrada, respuesta IA, cambio de estado, escalamiento, técnico asignado (cliente y técnico), visitas y cierre.

Cada canal usa el proveedor directo si está configurado; si no, cae al webhook `NOTIFY_WEBHOOK_URL` (n8n) con `channel: "email" | "whatsapp"`.

```env
# Correo (SMTP). Gmail: smtp.gmail.com / 587 con contraseña de aplicación
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cuenta@gmail.com
SMTP_PASS=contraseña-de-aplicación
SMTP_FROM="MILA <cuenta@gmail.com>"

# WhatsApp Cloud API (Meta). Fuera de la ventana de 24 h exige plantilla aprobada
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
WHATSAPP_TEMPLATE=       # opcional: plantilla con 1 variable de cuerpo
MILA_PUBLIC_URL=https://mila-mesa-de-ayuda.vercel.app
```

El celular se registra al crear el usuario en `/especialista/usuarios` (10 dígitos; se normaliza a +57). Los fallos por canal quedan en `/especialista/automatizacion` y se reintentan solo para ese canal.

Prueba local de punta a punta: `node scripts/demo_notificaciones_canales.mjs` (ver cabecera del script).

## 8. Pruebas

```bash
npm test          # unitarias (Vitest)
MILA_E2E_URL=http://127.0.0.1:3100 MILA_DEMO_PASSWORD=... npm run test:e2e  # integración contra un servidor corriendo
```
