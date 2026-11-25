# ASMS Fanalca — mapa autenticado (Office 365)

**Cuenta:** `soporteticbogota2.cgs@ciudadlimpia.com.co`  
**Método:** Office 365 / tenant Kumo 2.0  
**Estado:** OK  
**Fecha:** 2026-11-18  
**Especialista:** `https://mastd.fanalca.com/asmsspecialist` → `#/home/list/`  
**Cliente (MAI Portal Cliente):** `https://mastd.fanalca.com/asmscustomer` → `#/home`

---

## Consola especialista (Portal del Especialista)

### Menú
- **Casos**
  - Asignados a mi
  - De mis grupos
  - De mis proyectos
  - Mi calendario (FSC) → `#/home/FSC`
  - Mis aprobaciones
  - Aprobaciones pendientes
- **Tareas**
- **Base de Conocimiento** → `#/home/kb/`
- Accesos directos: Casos abiertos, Vistas personalizadas, Casos favoritos, Filtros personalizados
- Acción superior: **Crear caso**

### Listado / bandeja
Acciones: REASIGNAR · EXPORTAR · OPCIONES DE COLUMNA

Columnas observadas: Caso, Tarea, Tipo de caso, Proyecto, Estado, Fecha de registro, Asunto, Razón, Cliente, Compañía, CI, Responsable, Grupo responsable, Tipo de registro, Progreso, Tiempo, Servicio, SLA, Receptor, Autor, Jerarquía, Categoría, Fecha de atención estimada/real, Fecha de cierre, Impacto, Prioridad, Urgencia, Proveedor, Unidad organizacional, OLA, Riesgo, UC, Serial, Costo, Precio, Fecha de modificación, Etiqueta de inventario, Es importado, Esfuerzo, Modelo, Solicitante, Fechas inicio/final (plan y real).

### Caso ejemplo visto
- ID `CL: 854` · Grupo Ciudad Limpia · Estado **Registrado** · Tipo **Incidentes**
- Asunto: Inconveniente al descargar copia de seguridad de Linix
- Servicio/categoría: Redes · Prioridad/Impacto/Urgencia: Bajo
- Progreso ~52% · tiempos SLA visibles · responsables/grupo asignados

### Formulario Crear caso (`#/home/newcase/`)
1. Atención al cliente: Proyecto (*), Tipo (*) — ej. proyecto “Grupo Ciudad Limpia”
2. Categorización: Servicio (*), Categoría (*)
3. Cliente: Solicitante, Cliente, Compañía, CI, SLA
4. Básica: Estado, Razón, Grupo responsable, Responsable, Tipo de registro
5. Detalles: Asunto (0/256) + Buscar, Descripción (editor enriquecido), Adjuntos
6. Prioridad: Impacto, Urgencia, Prioridad, Proveedor, Unidad organizacional
7. Botones: Ir al Listado · Cancelar · Guardar

---

## Consola cliente (MAI Portal Cliente)

### Home
- Buscador de estado de caso (número o asunto)
- Botón **+ Registrar caso**
- Tiles: **Artículos** · **Servicios** · **Mis casos**
- Noticias + artículos de KB (antivirus, correo sospechoso, terceros, etc.)
- Accesos: Talento en Línea / SuccessFactors, Intranet Ciudad Limpia
- Panel Novedades: encuestas pendientes, aprobaciones pendientes
- Chat / soporte en sidebar

### Wizard Registrar caso (`#/home/wizard`)
Pasos: **Proyecto → Servicio → Categoría → Caso**

Proyectos visibles:
- **FN Tecnología** — mesa corporativa de incidentes/solicitudes tecnológicas
- **Grupo Ciudad Limpia** — mesa TI para herramientas, equipos y aplicaciones de operación

---

## Adaptación a MILA

| ASMS | MILA |
|------|------|
| Portal Cliente / Portal Especialista | `/cliente` · `/especialista` |
| Proyecto + servicio + categoría | Servicio + zona Bogotá |
| Bandeja asignados / grupos | Inbox por rol + asignación |
| Estados, impacto, urgencia, prioridad, SLA | Estados MILA + prioridad IA |
| Reasignar / responsable / grupo | Escalamiento + técnicos por zona |
| KB / artículos | Diagnóstico remoto con agente IA |
| Adjuntos + trazabilidad | Timeline + evidencias |
| Encuestas / aprobaciones / FSC | Backlog posterior a Sprint 5 |

---

## Screenshots
- `asms-spec-home.png` / `asms-spec-crear-caso.png` / `asms-spec-home-final.png`
- `asms-customer-home.png` / `asms-customer-Registrar_caso.png`
- En `/opt/cursor/artifacts/`
