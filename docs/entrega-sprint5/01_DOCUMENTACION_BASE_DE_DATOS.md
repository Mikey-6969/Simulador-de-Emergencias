# MILA — Documentación de Base de Datos (Sprint 5)

**Proyecto:** Mesa Inteligente de Logística y Atención (MILA)  
**Asignatura:** Diseño de Software II (TS5C)  
**Equipo:** Equipo 1 · Product Owner: Michael Andrés Perdomo Murcia  
**Motor runtime:** PostgreSQL (Prisma)  
**DDL académico de referencia:** MySQL 8 (`docs/sql/mila.sql`)

---

## 1) Cómo se creó la base de datos

### 1.1 Enfoque

El modelo se diseñó primero en **Prisma Schema** (`prisma/schema.prisma`), que actúa como fuente de verdad del dominio (usuarios, casos, IA, asignaciones, notificaciones y logs de automatización).

A partir de ese schema se generan:

| Artefacto | Uso |
|-----------|-----|
| `npx prisma db push` / migraciones | Crea/sincroniza tablas en **PostgreSQL** (desarrollo local y app publicada en Cursor) |
| `docs/sql/mila.sql` | DDL **MySQL** para entrega académica y sustentación |
| `npm run db:seed` | Carga catálogo demo (admin, especialistas, técnicos, clientes) solo con `MILA_DEMO_PASSWORD` |

### 1.2 Pasos de creación (laboratorio)

```bash
# 1. Variables de entorno
cp .env.example .env
# DATABASE_URL=postgresql://...
# AUTH_SECRET=... (≥16 caracteres)
# MILA_DEMO_PASSWORD=... (solo para seed)

# 2. Instalar dependencias y cliente Prisma
npm install
npx prisma generate

# 3. Crear estructura física en PostgreSQL
npx prisma db push

# 4. (Opcional) Cargar datos demo
npm run db:seed
```

### 1.3 Producción (Cursor Apps)

- El archivo `cursor-app.json` declara `"database": "postgres"`.
- La plataforma inyecta `DATABASE_URL` en build/runtime.
- El seed **no** se ejecuta automáticamente en el build de producción.

### 1.4 Criterios de diseño

- Identificadores `cuid()` como PK (cadena estable, no secuencial pública).
- Enums tipados para roles, estados, zonas, prioridades y decisiones IA.
- Relacional 3FN para el núcleo (User–Ticket–Assignment–Timeline).
- Campos JSON solo donde el catálogo es flexible (`zones`, `skills`, `meta`, `payload`).
- Soft-optional: fechas/responsables opcionales se llenan en hitos del ciclo de vida.

---

## 2) Diccionario de datos

Convenciones:

- **Obligatorio (N):** NOT NULL  
- **Opcional (S):** NULL permitido  
- **PK / FK / UQ:** clave primaria, foránea, única  
- Longitudes referidas al DDL MySQL académico (`VARCHAR(191)`, `TEXT`, etc.). En PostgreSQL Prisma usa tipos equivalentes (`TEXT`/`VARCHAR` según mapping).

### 2.1 Enumeraciones

| Enum | Valores permitidos | Uso |
|------|--------------------|-----|
| `Role` | `CLIENTE`, `TECNICO`, `COORDINADOR`, `ADMIN` | Perfil de acceso |
| `TicketStatus` | `NUEVA`, `EN_ANALISIS_IA`, `DIAGNOSTICO_REMOTO`, `PENDIENTE_ESCALAMIENTO`, `ESCALADA`, `ASIGNADA`, `VISITA_PROGRAMADA`, `EN_ATENCION`, `CERRADA`, `CANCELADA` | Ciclo de vida del caso |
| `Zone` | `NORTE`, `SUR`, `ORIENTE`, `OCCIDENTE` | Sedes Bogotá |
| `Priority` | `BAJA`, `MEDIA`, `ALTA`, `CRITICA` | Prioridad del caso / sugerida por IA |
| `AiDecision` | `PENDIENTE`, `ACEPTADO`, `MODIFICADO`, `RECHAZADO` | Revisión humana del análisis |
| `AssignmentStatus` | `RECOMENDADA`, `ASIGNADA`, `RECHAZADA`, `COMPLETADA` | Estado de la asignación |

---

### 2.2 Tabla `User`

Usuarios del sistema (clientes, técnicos, coordinadores, admin).

| Campo | Tipo | Longitud | Oblig. | Clave | Valores / Default | Descripción | Cuándo se llena si es opcional |
|-------|------|----------|--------|-------|-------------------|-------------|-------------------------------|
| id | VARCHAR | 191 | N | PK | cuid | Identificador interno | Al crear usuario |
| email | VARCHAR | 191 | N | UQ | correo válido | Login | Al crear usuario |
| passwordHash | VARCHAR | 191 | N | — | hash bcrypt | Credencial almacenada | Al crear / reset |
| name | VARCHAR | 191 | N | — | texto | Nombre visible | Al crear |
| phone | VARCHAR | 191 | S | — | texto | Teléfono de contacto | Si el operador lo registra |
| role | ENUM Role | — | N | — | default `CLIENTE` | Rol de autorización | Al provisionar cuenta |
| zone | ENUM Zone | — | S | — | zona Bogotá | Zona preferente del usuario | Clientes/técnicos al seed o alta |
| active | BOOLEAN | — | N | — | default `true` | Habilita/deshabilita acceso | Se pone `false` al desactivar |
| createdAt | DATETIME | — | N | — | now() | Alta | Automático |
| updatedAt | DATETIME | — | N | — | auto | Última modificación | Automático en cada update |

---

### 2.3 Tabla `TechnicianProfile`

Perfil operativo del técnico (1:1 con `User` de rol TECNICO).

| Campo | Tipo | Longitud | Oblig. | Clave | Valores / Default | Descripción | Opcional se llena… |
|-------|------|----------|--------|-------|-------------------|-------------|-------------------|
| id | VARCHAR | 191 | N | PK | cuid | Id perfil | Al crear técnico |
| userId | VARCHAR | 191 | N | FK→User, UQ | — | Usuario técnico | Al crear |
| zones | JSON | — | N | — | arreglo de Zone | Zonas que cubre | Al crear/editar |
| skills | JSON | — | N | — | arreglo string | Competencias | Al crear/editar |
| capacityPerDay | INT | — | N | — | default 4 | Cupo diario de visitas | Al crear (1–12) |
| available | BOOLEAN | — | N | — | default true | Disponible para asignación | Se apaga si no atiende |
| notes | TEXT | — | S | — | texto | Observaciones internas | Si el coordinador las escribe |
| createdAt / updatedAt | DATETIME | — | N | — | auto | Auditoría | Automático |

---

### 2.4 Tabla `Ticket`

Caso / solicitud de soporte.

| Campo | Tipo | Longitud | Oblig. | Clave | Valores / Default | Descripción | Opcional se llena… |
|-------|------|----------|--------|-------|-------------------|-------------|-------------------|
| id | VARCHAR | 191 | N | PK | cuid | Id interno | Al crear caso |
| number | VARCHAR | 191 | N | UQ | ej. MILA-… | Número visible | Al crear |
| title | VARCHAR | 191 | N | — | ≥5 chars | Título del incidente | Al crear |
| description | TEXT | — | N | — | ≥10 chars | Detalle del problema | Al crear |
| status | ENUM TicketStatus | — | N | — | default `NUEVA` | Estado actual | Cambia en cada transición |
| priority | ENUM Priority | — | N | — | default `MEDIA` | Prioridad operativa | Al crear o tras IA |
| serviceType | VARCHAR | 191 | N | — | catálogo UI | Tipo de servicio | Al crear |
| customerZone | ENUM Zone | — | N | — | zona | Zona del incidente | Al crear (paso zona) |
| address | TEXT | — | S | — | texto | Dirección (legado) | Si se captura; UI actual usa prioridad |
| customerId | VARCHAR | 191 | N | FK→User | — | Cliente dueño | Al crear |
| assigneeId | VARCHAR | 191 | S | FK→User | — | Técnico asignado | Al confirmar asignación (PB-016) |
| createdAt / updatedAt | DATETIME | — | N | — | auto | Auditoría | Automático |
| closedAt | DATETIME | — | S | — | fecha | Cierre formal | Cuando status = `CERRADA` |

---

### 2.5 Tabla `Attachment`

Evidencias (imágenes) del caso. Archivos en `storage/uploads`, URL privada `/api/attachments/[id]`.

| Campo | Tipo | Longitud | Oblig. | Clave | Descripción | Opcional… |
|-------|------|----------|--------|-------|-------------|-----------|
| id | VARCHAR(191) | PK | N | Id evidencia | Al subir |
| ticketId | VARCHAR(191) | FK→Ticket | N | Caso | Al subir |
| fileName | VARCHAR(191) | — | N | Nombre original | Al subir |
| fileUrl | VARCHAR(191) | — | N | Ruta/API de acceso | Al guardar |
| uploadedBy | VARCHAR(191) | — | S | Quién subió | Si hay sesión de uploader |
| createdAt | DATETIME | — | N | Fecha de carga | Automático |

---

### 2.6 Tabla `AiAnalysis`

Resultado del agente de diagnóstico (local u OpenAI).

| Campo | Tipo | Oblig. | Clave | Default / Valores | Descripción | Opcional… |
|-------|------|--------|-------|-------------------|-------------|-----------|
| id | VARCHAR | N | PK | cuid | Id análisis | Al analizar |
| ticketId | VARCHAR | N | FK→Ticket | — | Caso analizado | Al analizar |
| problemSummary | TEXT | N | — | — | Resumen del problema | Al analizar |
| ambiguities | TEXT | S | — | — | Ambigüedades detectadas | Si el motor las reporta |
| recommendations | TEXT | N | — | — | Pasos recomendados | Al analizar |
| suggestedPriority | ENUM Priority | S | — | BAJA…CRITICA | Prioridad sugerida | Si el motor la estima |
| confidence | FLOAT | N | — | 0.7 | Confianza 0–1 | Al analizar |
| rawResponse | TEXT | S | — | — | Respuesta cruda | Si hay motor externo |
| decision | ENUM AiDecision | N | — | PENDIENTE | Decisión del revisor | Cambia al aceptar/modificar/rechazar |
| reviewerId | VARCHAR | S | FK→User | — | Coordinador revisor | Al revisar |
| reviewerNotes | TEXT | S | — | — | Notas humanas | Al modificar/rechazar |
| createdAt / updatedAt | DATETIME | N | — | auto | Auditoría | Automático |

---

### 2.7 Tabla `Escalation`

Motivo y autor del escalamiento a visita (PB-013).

| Campo | Tipo | Oblig. | Clave | Descripción | Opcional… |
|-------|------|--------|-------|-------------|-----------|
| id | VARCHAR PK | N | Id | Al escalar |
| ticketId | VARCHAR FK→Ticket | N | Caso | Al escalar |
| reason | TEXT | N | Motivo (≥8 chars en API) | Al escalar |
| createdBy | VARCHAR FK→User | N | Quién escala | Al escalar |
| createdAt | DATETIME | N | Momento | Automático |

---

### 2.8 Tabla `Assignment`

Recomendación/asignación de técnico (PB-015 / PB-016).

| Campo | Tipo | Oblig. | Clave | Default | Descripción | Opcional… |
|-------|------|--------|-------|---------|-------------|-----------|
| id | VARCHAR | N | PK | cuid | Id | Al recomendar/asignar |
| ticketId | VARCHAR | N | FK→Ticket | — | Caso | Al crear |
| technicianProfileId | VARCHAR | N | FK→TechnicianProfile | — | Técnico | Al crear |
| status | ENUM AssignmentStatus | N | — | RECOMENDADA | Estado | Pasa a ASIGNADA al confirmar |
| score | FLOAT | S | — | — | Puntaje de aptitud | Al generar recomendaciones |
| rationale | TEXT | S | — | — | Explicación del score | Al recomendar |
| assignedAt | DATETIME | S | — | — | Confirmación | Al asignar formalmente |
| createdAt | DATETIME | N | — | now | Alta | Automático |

---

### 2.9 Tabla `TimelineEvent`

Línea de tiempo inmutable del caso (trazabilidad).

| Campo | Tipo | Oblig. | Clave | Descripción | Opcional… |
|-------|------|--------|-------|-------------|-----------|
| id | VARCHAR PK | N | Id evento | Al registrar hito |
| ticketId | VARCHAR FK→Ticket | N | Caso | Al registrar |
| actorId | VARCHAR FK→User | S | Actor | Si el hito es humano (no sistema) |
| type | VARCHAR | N | Tipo (`CREATED`, `STATUS`, `AI_ANALYSIS`, `ESCALATED`, `ASSIGNED`, `ATTACHMENT`…) | Al registrar |
| message | TEXT | N | Texto legible | Al registrar |
| meta | JSON | S | Metadatos | Si hay detalle estructurado |
| createdAt | DATETIME | N | Marca temporal | Automático |

---

### 2.10 Tabla `Notification`

Notificaciones in-app (p. ej. al asignar técnico).

| Campo | Tipo | Oblig. | Clave | Default | Descripción | Opcional… |
|-------|------|--------|-------|---------|-------------|-----------|
| id | VARCHAR PK | N | Id | Al notificar |
| userId | VARCHAR FK→User | N | Destinatario | Al notificar |
| ticketId | VARCHAR FK→Ticket | S | Caso relacionado | Si aplica; se anula si se borra el ticket |
| channel | VARCHAR | N | `IN_APP` | Canal | Al crear |
| title | VARCHAR | N | Título | Al crear |
| body | TEXT | N | Cuerpo | Al crear |
| readAt | DATETIME | S | Lectura | Cuando el usuario abre/marca leída |
| createdAt | DATETIME | N | Alta | Automático |

---

### 2.11 Tabla `AutomationLog`

Observabilidad de eventos n8n / automatización.

| Campo | Tipo | Oblig. | Clave | Descripción | Opcional… |
|-------|------|--------|-------|-------------|-----------|
| id | VARCHAR PK | N | Id | Al emitir evento |
| flow | VARCHAR | N | Nombre flujo (`ticket.created`, …) | Al emitir |
| success | BOOLEAN | N | ¿OK? | Al emitir |
| payload | JSON | S | Cuerpo sanitizado | Si hay datos |
| response | TEXT | S | Respuesta webhook | Si hay URL configurada o mensaje local |
| error | TEXT | S | Error | Si falla HTTP/red |
| createdAt | DATETIME | N | Momento | Automático |

---

## 3) Diagrama entidad-relación (DER)

### 3.1 Cardinalidades

| Relación | Cardinalidad | Notas |
|----------|--------------|-------|
| User 1 — 0..1 TechnicianProfile | Uno a uno | Solo técnicos tienen perfil |
| User 1 — N Ticket (como cliente) | Uno a muchos | `Ticket.customerId` |
| User 1 — 0..N Ticket (como assignee) | Uno a muchos | `Ticket.assigneeId` opcional |
| Ticket 1 — N Attachment | Uno a muchos | Evidencias |
| Ticket 1 — N AiAnalysis | Uno a muchos | Histórico de análisis |
| User 1 — 0..N AiAnalysis (reviewer) | Uno a muchos | Revisión humana |
| Ticket 1 — N Escalation | Uno a muchos | Motivos de escalamiento |
| User 1 — N Escalation | Uno a muchos | Quién escala |
| Ticket 1 — N Assignment | Uno a muchos | Recomendaciones/asignaciones |
| TechnicianProfile 1 — N Assignment | Uno a muchos | Carga del técnico |
| Ticket 1 — N TimelineEvent | Uno a muchos | Trazabilidad |
| User 1 — 0..N TimelineEvent | Uno a muchos | Actor opcional |
| User 1 — N Notification | Uno a muchos | Bandeja del usuario |
| Ticket 1 — 0..N Notification | Uno a muchos | Opcional; ON DELETE SET NULL |
| AutomationLog | Independiente | Log técnico sin FK dura |

### 3.2 Diagrama (Mermaid)

```mermaid
erDiagram
  User ||--o| TechnicianProfile : "tiene perfil"
  User ||--o{ Ticket : "crea (customer)"
  User ||--o{ Ticket : "atiende (assignee)"
  User ||--o{ AiAnalysis : "revisa"
  User ||--o{ Escalation : "escala"
  User ||--o{ TimelineEvent : "actúa"
  User ||--o{ Notification : "recibe"

  Ticket ||--o{ Attachment : "tiene"
  Ticket ||--o{ AiAnalysis : "analizado"
  Ticket ||--o{ Escalation : "escalado"
  Ticket ||--o{ Assignment : "asignaciones"
  Ticket ||--o{ TimelineEvent : "historial"
  Ticket ||--o{ Notification : "avisos"

  TechnicianProfile ||--o{ Assignment : "recomendado/asignado"

  User {
    string id PK
    string email UK
    string role
    string zone
  }
  TechnicianProfile {
    string id PK
    string userId FK_UK
    json zones
    int capacityPerDay
  }
  Ticket {
    string id PK
    string number UK
    string status
    string customerId FK
    string assigneeId FK
  }
  Attachment {
    string id PK
    string ticketId FK
  }
  AiAnalysis {
    string id PK
    string ticketId FK
    string decision
  }
  Escalation {
    string id PK
    string ticketId FK
    string createdBy FK
  }
  Assignment {
    string id PK
    string ticketId FK
    string technicianProfileId FK
    string status
  }
  TimelineEvent {
    string id PK
    string ticketId FK
    string actorId FK
  }
  Notification {
    string id PK
    string userId FK
    string ticketId FK
  }
  AutomationLog {
    string id PK
    string flow
    boolean success
  }
```

> Imagen exportada también en `imagenes/der_mila.png` (versión gráfica para sustentación).

---

## 4) Referencias del proyecto

- Schema Prisma: `prisma/schema.prisma`
- DDL MySQL académico: `docs/sql/mila.sql`
- Seed demo: `src/lib/seed-catalog.ts` / `npm run db:seed`
- Entrega Sprint 5: `docs/SPRINT5_ENTREGA.md`
