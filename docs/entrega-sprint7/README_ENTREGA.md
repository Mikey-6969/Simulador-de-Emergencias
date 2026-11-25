# Entrega Sprint 7 — MILA

Periodo: 26/11/2026 – 09/12/2026 (semanas 12–13) · 49 puntos · PB-022 a PB-028 y PB-030.

| Documento | Contenido |
|---|---|
| `01_PLAN_SPRINT7_MILA.docx` | Objetivo, historias, criterios de aceptación, estimación, DoD, riesgos, entregables |
| `02_SPRINT_BACKLOG_Y_TAREAS_SPRINT7.docx` | Tareas por historia, responsables, horas, estado |
| `03_GUIA_PANTALLAZOS_Y_ENTREGA_SPRINT7.docx` | 12 pantallazos PB-022…030 con explicación |
| `04_BACKLOG_PRODUCTO_ACTUALIZADO_SPRINT7.docx` | Product Backlog con estado actualizado |
| `imagenes/` | Capturas individuales |

Regenerar documentos: `python3 scripts/generar_docs_sprint7.py` (capturas: `node scripts/mila_shots_sprint7.mjs` y `scripts/mila_shots_n8n.mjs`).

Plantillas n8n: `docs/n8n/mila-sprint7-eventos-ia.json`, `docs/n8n/mila-sprint7-notificaciones.json`. Configuración: `docs/N8N_CONEXION.md`.

Notas: la demo pública usa el análisis de IA local hasta conectar una instancia de n8n (`AI_VIA_N8N`); el correo real requiere una credencial SMTP en n8n.
