# Plataforma Inteligente para la Gestión de Soporte Técnico

Documento consolidado de requisitos (versión limpia)  
Fuentes: planteamiento del cliente + lineamientos del docente, Product Backlog 13 semanas, Sprint 2, referencia UX Aranda ASMS (Fanalca).  
Product Owner: Michael Andrés Perdomo Murcia  
Scrum Master: Laura Valentina Zambrano Cárcamo  
Metodología: Scrum (sprints de 2 semanas)

---

## 1. Visión del producto

Plataforma web para una empresa de soporte técnico en Bogotá que:

1. Recibe solicitudes de clientes en lenguaje natural.
2. Usa un **agente de IA** para diagnóstico remoto y recomendaciones antes de enviar un técnico.
3. Escala a visita presencial solo cuando corresponde.
4. Asigna técnicos por **zona, capacidad, disponibilidad y tipo de servicio**.
5. Registra cierre formal con evidencias y formato de servicio.
6. Mantiene **trazabilidad completa** del caso y genera reportes.
7. Orquesta notificaciones e integraciones con **n8n**.

Referencia de experiencia (ingeniería inversa UI): consolas Aranda ASMS de Fanalca  
- Especialista: `https://mastd.fanalca.com/asmsspecialist`  
- Cliente: `https://mastd.fanalca.com/asmscustomer`  

La solución académica **no copia** marca ni código de Aranda; replica el patrón de **dos consolas** (cliente / especialista) y añade IA + n8n + visitas por zona.

---

## 2. Actores

| Actor | Descripción | Consola |
|-------|-------------|---------|
| Cliente | Reporta problemas, sigue estado, recibe orientación IA y notificaciones | Consola cliente |
| Técnico | Atiende visitas, consulta casos asignados, registra cierre y evidencias | Consola especialista (vista técnico) |
| Coordinador | Revisa análisis IA, escala, asigna técnico, programa visitas, consulta reportes | Consola especialista |
| Administrador | Roles, técnicos, zonas, catálogos, seguridad, observabilidad n8n | Consola especialista (admin) |
| Sistema / n8n | Orquesta webhooks, IA, notificaciones y actualizaciones de estado | Automatización |
| Agente IA | Interpreta solicitud, detecta ambigüedad, sugiere diagnóstico y prioridad | Servicio externo vía n8n/API |

---

## 3. Problema a resolver

- Solicitudes ambiguas o con varios problemas mezclados.
- Visitas presenciales innecesarias (costo y tiempo).
- Asignación manual de técnicos sin considerar zona/disponibilidad.
- Baja trazabilidad del ciclo de vida del caso.
- Datos operativos dispersos, sin reportes confiables.
- Comunicación irregular con el cliente sobre el estado del caso.

---

## 4. Alcance funcional (épicas)

### E1. Usuarios y acceso
- Registro e inicio de sesión.
- Roles y permisos: cliente, técnico, coordinador, administrador.
- Protección de credenciales (hash), evidencias y datos sensibles.

### E2. Solicitudes
- Cliente registra solicitud (descripción libre, categoría/servicio, ubicación/zona, prioridad opcional).
- Adjuntos/evidencias.
- ID único + fecha/hora automáticos.
- Consulta de “mis solicitudes” y estado.

### E3. IA / diagnóstico remoto
- Al crear solicitud → envío a agente IA.
- Identificar problema principal, ambigüedades y posibles causas.
- Mostrar recomendaciones de solución remota al cliente/coordinador.
- Coordinador puede aceptar, modificar o rechazar el análisis.
- Persistir análisis, recomendaciones y resultado.

### E4. Estados y escalamiento
- Estados del caso (propuesta inicial):
  `Nueva` → `En análisis IA` → `Diagnóstico remoto` → `Pendiente escalamiento` → `Escalada` → `Asignada` → `Visita programada` → `En atención` → `Cerrada` / `Cancelada`
- Escalamiento con motivo, fecha y responsable.
- No toda solicitud genera visita automática.

### E5. Técnicos y asignación
- Catálogo de técnicos: zona (Norte, Sur, Oriente, Occidente), capacidades, horarios, disponibilidad.
- Recomendación de técnico apto.
- Asignación manual confirmada por coordinador.

### E6. Visitas y cierre
- Programar visita sin conflictos de agenda.
- Técnico consulta solicitud, ubicación, antecedentes e historial IA.
- Registro de actividades, diagnóstico, solución, resultado (resuelto / pendiente / reprogramar).
- Adjuntos + formato de cierre formal.

### E7. Trazabilidad y reportes
- Línea de tiempo completa del caso.
- Indicadores: volumen, resueltos remotos vs presenciales, por zona, por técnico, tipos frecuentes, pendientes, tiempos.

### E8. n8n y notificaciones
- Flujo al crear solicitud → IA → actualizar caso → notificar.
- Flujo al escalar/asignar/cerrar → notificar cliente, técnico y coordinador.
- Observabilidad de errores de automatización.

---

## 5. Historias prioritarias (Product Backlog resumido)

| ID | Épica | Historia | Prioridad | Sprint |
|----|-------|----------|-----------|--------|
| PB-001 / HU-01 | Acceso | Registro e inicio de sesión por rol | Obligatorio | 2 |
| PB-002 / HU-02 | Acceso | Gestión de roles y permisos | Obligatorio | 2 |
| PB-029 / HU-03 | Seguridad | Protección de datos sensibles | Obligatorio | 2 |
| PB-033 / HU-04 | Arquitectura | Arquitectura base + entorno | Obligatorio | 2 |
| PB-034 / HU-05 | BD | Modelo de datos inicial | Obligatorio | 2 |
| PB-003..006 | Solicitudes | Alta, adjuntos, ID, consulta | Obligatorio/Deseable | 3 |
| PB-007..011 | IA | Análisis, recomendaciones, revisión, registro | Obligatorio | 4 |
| PB-012..016 | Escalamiento/Asignación | Estados, técnicos, recomendación, asignación | Obligatorio | 5 |
| PB-017..021 | Visitas/Cierre | Agenda, atención, cierre, evidencias | Obligatorio/Deseable | 6 |
| PB-022..028 | Trazabilidad/n8n/Reportes | Timeline, flujos, notificaciones, métricas | Mixto | 7 |
| PB-030..032 | QA/Docs/Deploy | Pruebas, documentación, despliegue | Mixto | 7 / cierre |

Detalle completo: `docs/source/Product_Backlog_13_Semanas.xlsx`.

---

## 6. Requerimientos no funcionales (clave)

| ID | Tema | Objetivo |
|----|------|----------|
| RNF-Auth | Login | ≤ 1.5 s |
| RNF-Dash | Panel principal | ≤ 2 s (hasta 50 usuarios concurrentes) |
| RNF-Sol | Registro solicitud | ≤ 2 s |
| RNF-IA | Análisis IA | ≤ 5 s (si excede, indicador “procesando”) |
| RNF-n8n | Disparo flujo | ≤ 3 s para iniciar |
| RNF-Rep | Reportes ≤ 90 días | ≤ 3 s |
| RNF-TL | Línea de tiempo | ≤ 2 s |
| RNF-Disp | Disponibilidad | ≥ 99 % en horario operativo |
| RNF-Sec | Seguridad | Hash de contraseñas; evidencias con control de acceso; secretos fuera del repo; logs sin datos sensibles |

---

## 7. Arquitectura objetivo (5 capas)

1. **Presentación** — Consola cliente + consola especialista (web responsive).
2. **Aplicación** — API / lógica de negocio (roles, solicitudes, asignación, cierre).
3. **Datos** — Base relacional + almacenamiento de evidencias.
4. **Automatización** — n8n (webhooks, orquestación IA, notificaciones).
5. **Servicios externos** — Agente IA, correo/SMS/WhatsApp (según disponibilidad).

### Nota de stack (decisión pendiente de alinear)

| Fuente | Stack declarado |
|--------|-----------------|
| Decisión actual (producto MILA) | **Next.js + TypeScript + MySQL (Prisma) + n8n + agente IA** |
| Documentos antiguos Sprint 2 | Django/PostgreSQL/Bootstrap — **obsoletos**; no aplican a la implementación |

**Decisión:** stack moderno desplegable con MySQL. DDL en `docs/sql/mila.sql`.

---

## 8. Modelo de datos (entidades iniciales)

- `Usuario` (rol, datos de contacto, zona opcional)
- `Solicitud` (estado, descripción, zona, servicio, prioridad, timestamps)
- `Adjunto` / evidencia
- `AnalisisIA` (hallazgos, recomendaciones, confianza, decisión del coordinador)
- `Escalamiento` (motivo, fecha, responsable)
- `TecnicoPerfil` (zonas, capacidades, agenda)
- `Asignacion`
- `Visita` (programación, check-in/out opcional)
- `Cierre` (resultado, formato, evidencias)
- `Notificacion` / `EventoTimeline`
- `LogAutomatizacion` (n8n)

---

## 9. Flujos n8n (mínimo)

### Flujo A — Nueva solicitud
`Webhook Django` → validar payload → llamar agente IA → guardar `AnalisisIA` vía API → notificar cliente/coordinador → log resultado

### Flujo B — Escalamiento / asignación / cierre
`Webhook evento` → ramificar por tipo → notificar actores → actualizar campos auxiliares → log

---

## 10. Criterios académicos (docente)

- Scrum, backlog vivo con estados reales.
- Entregas formales por Scrum Master antes de clase.
- Sustentación con evidencia funcional (no solo documentación).
- DoD: desarrollado, integrado, criterios OK, probado, demostrable.
- Riesgos y cambios documentados (no ocultar bloqueos).
- Ausencia de un integrante en sustentación: penalización fuerte (según lineamientos).

---

## 11. Mapeo con referencia ASMS (ingeniería inversa)

| Patrón ASMS observado | Adaptación en el proyecto |
|-----------------------|---------------------------|
| Dos portales (customer / specialist) | Consola cliente / consola especialista |
| Login local + SSO | Login propio por roles (SSO opcional, fuera de alcance mínimo) |
| Bandeja de casos del especialista | Inbox de coordinador/técnico |
| Creación de caso por cliente | Alta de solicitud + adjuntos |
| Ciclo de vida / estados | Estados propios + escalamiento a visita |
| (No nativo) IA + visitas por zona Bogotá | Diferenciador académico obligatorio |
| (No nativo) n8n | Orquestación y notificaciones |

Detalle de pantallas autenticadas: se completa en `docs/extracted/asms_authenticated_map.md` tras el login de exploración.

---

## 12. Próximos entregables de ingeniería

1. Documento limpio de RF/RNF numerados (este archivo + anexos).
2. Diagrama ER + script DDL (MySQL o PostgreSQL).
3. Diagramas de arquitectura y flujos (caso + n8n).
4. Scaffold del repositorio publicable (sin secretos).
5. HU Sprint 2 demostrables: entorno + login + modelo.

---

## 13. Control de este documento

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1 | 2026-11-18 | Consolidación inicial desde PDF docente, Sprint 2, backlog y exploración login ASMS |
