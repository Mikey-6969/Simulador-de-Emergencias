# Product Backlog actualizado — MILA
**Corte:** 2026-11-25 · Equipo 1 · TS5C
## Resumen
| Bloque | Estado |
|---|---|
| Sprint 5 (PB-012…016) | **Hecho — entregado** |
| Sprint 6 (PB-017…021) | **Hecho — por aceptar** (PO) |
| Sprint 7 (PB-022…028, 030) | **Hecho — por aceptar** (PO) |

## Detalle
| ID | Sprint | Estado | Nota |
|---|---|---|---|
| PB-001 | Sprint 2 | Hecho* | Login por rol; registro público deshabilitado a propósito (cuentas provisionadas). |
| PB-002 | Sprint 2 | Hecho | Roles CLIENTE/TECNICO/COORDINADOR/ADMIN con guards en API y consolas. |
| PB-029 | Sprint 2 | Hecho | bcrypt, cookie httpOnly, CSRF same-origin, rate limits, secretos fuera del repo. |
| PB-033 | Sprint 2 | Hecho | Next.js + Prisma/PostgreSQL + n8n + agente IA. |
| PB-034 | Sprint 2 | Hecho | Schema Prisma + DDL MySQL académico; Visit/Closure en Sprint 6. |
| PB-003 | Sprint 3 | Hecho | Wizard cliente: servicio → zona → detalle → diagnóstico → alta. |
| PB-004 | Sprint 3 | Hecho | Adjuntos de imagen en creación de caso; descarga controlada por API. |
| PB-005 | Sprint 3 | Hecho | Número visible MILA-AAAA-##### y timestamps automáticos. |
| PB-006 | Sprint 3 | Hecho | Mis casos + detalle con estado y timeline. |
| PB-031 | Sprint 3/7 | Hecho | Docs n8n y plantillas (eventos/IA y correo). |
| PB-032 | Sprint 3/7 | Hecho | Despliegue público: https://mila-mesa-de-ayuda.vercel.app |
| PB-007 | Sprint 4 | Hecho | Análisis IA al crear caso (motor local u OpenAI si hay clave). |
| PB-008 | Sprint 4 | Hecho | Resumen, ambigüedades, recomendaciones y prioridad sugerida. |
| PB-009 | Sprint 4 | Hecho | Prediagnóstico remoto en wizard (hasta 4 intentos). |
| PB-010 | Sprint 4 | Hecho | Revisión ACEPTADO/MODIFICADO/RECHAZADO en consola especialista. |
| PB-011 | Sprint 4 | Hecho | Persistencia AiAnalysis + timeline AI_ANALYSIS / AI_REVIEW. |
| PB-012 | Sprint 5 | Hecho — Sprint 5 | Cambio de estado tipado en consola especialista. |
| PB-013 | Sprint 5 | Hecho — Sprint 5 | Escalamiento con motivo; registro Escalation + evento n8n. |
| PB-014 | Sprint 5 | Hecho — Sprint 5 | CRUD de perfiles técnicos / zonas / capacidad. |
| PB-015 | Sprint 5 | Hecho — Sprint 5 | Recomendaciones con score zona/skills/carga real. |
| PB-016 | Sprint 5 | Hecho — Sprint 5 | Asignación confirmada, notificación y bandeja del técnico. |
| PB-017 | Sprint 6 | Hecho — Sprint 6 | Visitas con control de capacidad y conflictos de agenda. |
| PB-018 | Sprint 6 | Hecho — Sprint 6 | Técnico consulta detalle, antecedentes, visitas e IA. |
| PB-019 | Sprint 6 | Hecho — Sprint 6 | Cierre con actividades, diagnóstico y solución. |
| PB-020 | Sprint 6 | Hecho — Sprint 6 | Outcome RESUELTO/PENDIENTE/NUEVA_VISITA/ESCALADO. |
| PB-021 | Sprint 6 | Hecho — Sprint 6 | Evidencias fotográficas (hasta 4) asociadas al cierre; almacenadas en BD. |
| PB-022 | Sprint 7 | Hecho — Sprint 7 | Línea de tiempo global con filtros y paginación (/especialista/trazabilidad). |
| PB-023 | Sprint 7 | Hecho — Sprint 7 | Webhook firmado (HMAC), reintento, sanitización y plantilla n8n validada. |
| PB-024 | Sprint 7 | Hecho — Sprint 7 | IA vía n8n (AI_VIA_N8N) con callback idempotente y fallback local. |
| PB-025 | Sprint 7 | Hecho — Sprint 7 | In-app + canal externo por webhook; correo real requiere SMTP en n8n. |
| PB-026 | Sprint 7 | Hecho — Sprint 7 | Consola con filtros, contadores y reintento de eventos fallidos. |
| PB-027 | Sprint 7 | Hecho — Sprint 7 | Reportes por periodo/estado/zona/prioridad/servicio y CSV. |
| PB-028 | Sprint 7 | Hecho — Sprint 7 | Tiempos de primera atención, asignación y resolución (global y por zona). |
| PB-030 | Sprint 7 | Hecho — Sprint 7 | Vitest: 16 unitarias + 8 de integración (npm test / npm run test:e2e). |

Ver Word: `docs/entrega-sprint7/04_BACKLOG_PRODUCTO_ACTUALIZADO_SPRINT7.docx`.
