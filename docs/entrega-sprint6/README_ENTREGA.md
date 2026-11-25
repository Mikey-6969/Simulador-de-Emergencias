# Entrega Sprint 6 — MILA

Periodo: 12/11/2026 – 25/11/2026 (semanas 10–11) · 31 puntos · PB-017 a PB-021.

| Documento | Contenido |
|---|---|
| `01_PLAN_SPRINT6_MILA.docx` | Objetivo, historias seleccionadas, criterios de aceptación, estimación, DoD, riesgos, entregables |
| `02_SPRINT_BACKLOG_Y_TAREAS_SPRINT6.docx` | Tareas por historia, responsables (Michael / Valentina), horas, estado |

| `03_GUIA_PANTALLAZOS_Y_ENTREGA_SPRINT6.docx` | 10 pantallazos PB-017…021 con explicación |
| `04_BACKLOG_PRODUCTO_ACTUALIZADO_SPRINT6.docx` | Product Backlog con estado actualizado |
| `imagenes/` | Capturas individuales |

Regenerar: `python3 scripts/generar_docs_sprint6.py && python3 scripts/generar_docs_sprint6_entrega.py` (capturas: `node scripts/mila_shots_sprint6.mjs`).

Cambio de aplicación incluido (PB-021): evidencias fotográficas en el cierre, almacenadas en BD (`Attachment.closureId/mimeType/data`) y servidas por `/api/attachments/[id]` con sesión.
