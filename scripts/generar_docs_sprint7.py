#!/usr/bin/env python3
"""Genera los documentos Word de entrega del Sprint 7 (plan, tareas, pantallazos, backlog)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from docx import Document  # noqa: E402
from docx.enum.text import WD_ALIGN_PARAGRAPH  # noqa: E402
from docx.shared import Cm  # noqa: E402

import generar_docs_entrega_polish as P  # noqa: E402

OUT = Path("/workspace/docs/entrega-sprint7")
IMG = OUT / "imagenes"
ART = Path("/opt/cursor/artifacts")
PLAN = OUT / "01_PLAN_SPRINT7_MILA.docx"
TASKS = OUT / "02_SPRINT_BACKLOG_Y_TAREAS_SPRINT7.docx"
GUIDE = OUT / "03_GUIA_PANTALLAZOS_Y_ENTREGA_SPRINT7.docx"
BACKLOG = OUT / "04_BACKLOG_PRODUCTO_ACTUALIZADO_SPRINT7.docx"

PO = "Michael Andrés Perdomo Murcia (Product Owner)"
SM = "Laura Valentina Zambrano Cárcamo (Scrum Master)"
PERIOD = "Semanas 12–13 · 26/11/2026 – 09/12/2026"
DONE = "Hecho"
STORY_DONE = "Hecho — por aceptar"
URL = "https://mila-mesa-de-ayuda.vercel.app"

STORIES = [
    {
        "id": "PB-022", "epic": "Trazabilidad", "pts": 5, "prio": "Obligatorio",
        "story": "Como coordinador quiero consultar la línea de tiempo de los casos para tener trazabilidad completa.",
        "ac": [
            "Existe una vista global con todos los eventos de todos los casos, ordenados del más reciente al más antiguo y paginados.",
            "La vista se filtra por número de caso, tipo de evento, zona y rango de fechas.",
            "Cada evento muestra tipo, caso, zona, mensaje, actor (o «Sistema / automatización») y fecha en hora de Bogotá.",
            "Solo coordinadores y administradores acceden; el técnico es redirigido.",
        ],
        "evidence": "/especialista/trazabilidad · modelo TimelineEvent (índices por fecha)",
    },
    {
        "id": "PB-023", "epic": "n8n", "pts": 5, "prio": "Obligatorio",
        "story": "Como equipo quiero activar un flujo n8n al registrar una solicitud.",
        "ac": [
            "Al crear un caso se emite el evento ticket.created al webhook de n8n con datos sanitizados (sin datos personales).",
            "El envío se firma con HMAC (cabecera x-mila-signature) cuando existe N8N_WEBHOOK_SECRET y se reintenta una vez ante fallo.",
            "Cada emisión (éxito o error) queda registrada en AutomationLog.",
            "Se entrega una plantilla importable de flujo n8n (docs/n8n/mila-sprint7-eventos-ia.json).",
        ],
        "evidence": "emitN8nEvent() · plantilla de workflow · ejecuciones visibles en n8n",
    },
    {
        "id": "PB-024", "epic": "n8n", "pts": 8, "prio": "Obligatorio",
        "story": "Como equipo quiero que n8n envíe el caso a la IA y actualice el resultado.",
        "ac": [
            "Con AI_VIA_N8N=true, el caso queda en EN_ANALISIS_IA y la línea de tiempo registra «IA delegada a n8n».",
            "n8n invoca POST /api/automation/ai-analyze con el secreto compartido; el análisis se guarda y el caso pasa a DIAGNOSTICO_REMOTO.",
            "El callback es idempotente: un segundo llamado no duplica el análisis.",
            "Si n8n no responde, MILA ejecuta el análisis localmente (fallback) y lo registra en la línea de tiempo.",
            "El coordinador puede forzar el análisis de casos pendientes desde la consola de automatización.",
        ],
        "evidence": "/api/automation/ai-analyze · runAiPipeline() · /api/tickets/[id]/reanalyze",
    },
    {
        "id": "PB-025", "epic": "Notificaciones", "pts": 5, "prio": "Obligatorio",
        "story": "Como usuario quiero ser notificado según los eventos relevantes de mis casos.",
        "ac": [
            "Se notifica in-app al cliente (registro, cambio de estado, escalamiento, visita, cierre), al técnico (asignación, visita) y a los coordinadores de la zona (escalamiento).",
            "Si NOTIFY_WEBHOOK_URL está configurada, cada notificación se envía también por canal externo (correo vía n8n) y se guarda su estado (ENVIADO / ERROR).",
            "Los fallos de envío externo no bloquean la operación y quedan en el log para reintento.",
            "Se entrega una plantilla de flujo n8n de correo (docs/n8n/mila-sprint7-notificaciones.json).",
        ],
        "evidence": "notifyUser() · Notification.externalStatus · plantilla mila-sprint7-notificaciones",
    },
    {
        "id": "PB-026", "epic": "Observabilidad", "pts": 5, "prio": "Deseable",
        "story": "Como coordinador quiero consultar los errores de automatización para corregirlos.",
        "ac": [
            "La consola muestra contadores de eventos OK / con error / errores en 24 h y el estado de n8n, IA y notificaciones externas.",
            "El registro se filtra por flujo y por «solo errores».",
            "Los eventos con error ofrecen «Reintentar»; si el reintento es exitoso el evento queda resuelto.",
            "Se listan los casos esperando análisis IA y los últimos análisis con su decisión de revisión.",
        ],
        "evidence": "/especialista/automatizacion · /api/automation/logs/[id]/retry",
    },
    {
        "id": "PB-027", "epic": "Reportes", "pts": 8, "prio": "Obligatorio",
        "story": "Como coordinador quiero consultar solicitudes por periodo, estado y zona.",
        "ac": [
            "La pantalla de reportes filtra por rango de fechas, estado, zona, prioridad y servicio (fechas en hora de Bogotá).",
            "Muestra totales por estado y por zona y el listado de casos filtrados.",
            "Permite exportar el resultado completo a CSV (UTF-8, con protección contra inyección de fórmulas).",
            "Solo coordinadores y administradores acceden (API y UI).",
        ],
        "evidence": "/especialista/reportes · /api/reports/tickets (JSON y CSV)",
    },
    {
        "id": "PB-028", "epic": "Reportes", "pts": 5, "prio": "Deseable",
        "story": "Como coordinador quiero consultar los tiempos de atención y resolución.",
        "ac": [
            "Se calcula por caso el tiempo a primera atención, a asignación y de resolución.",
            "Se muestran promedios (y mediana de resolución) globales y por zona, respetando los filtros activos.",
            "Los casos sin hito alcanzado no distorsionan el promedio (se excluyen).",
        ],
        "evidence": "src/lib/metrics.ts (pruebas unitarias) · tarjetas y tabla por zona en reportes",
    },
    {
        "id": "PB-030", "epic": "QA", "pts": 8, "prio": "Obligatorio",
        "story": "Como equipo quiero pruebas funcionales y de integración que respalden la entrega.",
        "ac": [
            "Existe una suite automatizada (Vitest) ejecutable con npm test.",
            "Pruebas unitarias cubren zona horaria, sanitización y firma n8n, métricas, filtros de reporte, CSV y notificaciones.",
            "Pruebas de integración (npm run test:e2e) validan contra un servidor real: registro de caso, notificaciones, permisos por rol, reportes JSON/CSV, páginas globales y callback de IA con secreto.",
            "La suite pasa completa (24 pruebas) con n8n real orquestando el análisis de IA.",
        ],
        "evidence": "tests/*.test.ts · npm test · npm run test:e2e",
    },
]
POINTS = sum(s["pts"] for s in STORIES)

SHOTS = [
    ("01_linea_tiempo_global.png", "PB-022", "Línea de tiempo global con todos los eventos, actores y zonas, paginada."),
    ("02_linea_tiempo_filtrada.png", "PB-022", "Filtro por tipo de evento (Escalamiento) y zona (Sur)."),
    ("03_caso_timeline_ia_delegada_n8n.png", "PB-023 / 024", "Timeline de un caso: análisis IA delegado a n8n y resultado actualizado."),
    ("04_logs_automatizacion.png", "PB-026", "Consola n8n / IA / notificaciones: estado de canales, contadores y registro de eventos."),
    ("05_logs_errores_notificacion_externa.png", "PB-025 / 026", "Filtro «solo errores» del flujo notification.external con botón Reintentar."),
    ("06_reintento_notificacion_externa.png", "PB-025 / 026", "Tras activar el receptor, el reintento entrega la notificación y el evento queda resuelto."),
    ("07_reportes_metricas.png", "PB-027 / 028", "Reportes: filtros, KPIs de tiempos, resumen por estado y por zona y listado."),
    ("08_reportes_filtrados_zona_estado.png", "PB-027", "Reporte filtrado por zona Norte y estado Cerrada."),
    ("09_exportacion_csv.png", "PB-027", "Exportación CSV del reporte (primeras filas)."),
    ("10_n8n_flujo_eventos_ia.png", "PB-023 / 024", "Plantilla importada y activa en n8n: webhook → respuesta → decisión → llamada a MILA."),
    ("11_n8n_ejecuciones.png", "PB-023", "Ejecuciones reales del flujo en n8n disparadas por los eventos de MILA."),
    ("12_suite_de_pruebas.png", "PB-030", "Resultado de la suite: 24 pruebas (unitarias e integración) aprobadas."),
]

TASKS_DATA = [
    ("PB-022", [
        ("Índices de TimelineEvent y consulta paginada con filtros", "Michael", 3, DONE),
        ("Vista /especialista/trazabilidad con filtros y navegación", "Michael", 5, DONE),
        ("Revisión de criterios con el Product Owner", "Valentina", 2, "Pendiente"),
    ]),
    ("PB-023", [
        ("Firma HMAC, reintento y sanitización de payload en emitN8nEvent", "Michael", 4, DONE),
        ("Plantilla de workflow n8n (webhook y decisión)", "Michael", 3, DONE),
        ("Validación con n8n real (ejecuciones y AutomationLog)", "Michael", 2, DONE),
    ]),
    ("PB-024", [
        ("Refactor del análisis IA a runAiPipeline() idempotente", "Michael", 4, DONE),
        ("Endpoint /api/automation/ai-analyze con secreto compartido y rate limit", "Michael", 3, DONE),
        ("Modo AI_VIA_N8N con fallback local y eventos de timeline", "Michael", 4, DONE),
        ("Reanálisis manual de casos pendientes", "Michael", 2, DONE),
    ]),
    ("PB-025", [
        ("Servicio notifyUser() y migración de notificaciones existentes", "Michael", 3, DONE),
        ("Canal externo por webhook (estado ENVIADO/ERROR) y plantilla de correo", "Michael", 5, DONE),
        ("Nuevas notificaciones: registro, estado y escalamiento a coordinadores", "Michael", 3, DONE),
    ]),
    ("PB-026", [
        ("Contadores, filtros y estado de canales en la consola", "Michael", 4, DONE),
        ("Reintento de eventos fallidos (n8n y notificaciones)", "Michael", 3, DONE),
        ("Casos pendientes de IA y últimos análisis", "Michael", 2, DONE),
    ]),
    ("PB-027", [
        ("Parseo/validación de filtros y consulta por periodo, estado y zona", "Michael", 4, DONE),
        ("Pantalla de reportes y resúmenes", "Michael", 5, DONE),
        ("Exportación CSV segura y endpoint JSON", "Michael", 3, DONE),
    ]),
    ("PB-028", [
        ("Cálculo de tiempos de primera atención, asignación y resolución", "Michael", 4, DONE),
        ("Promedios y mediana globales y por zona", "Michael", 3, DONE),
    ]),
    ("PB-030", [
        ("Configurar Vitest y pruebas unitarias de librerías", "Michael", 4, DONE),
        ("Pruebas de integración contra servidor real", "Michael", 5, DONE),
        ("Verificación con n8n real y registro de evidencias", "Michael", 3, DONE),
        ("Revisión del plan de pruebas y aceptación", "Valentina", 2, "Pendiente"),
    ]),
    ("TRANS", [
        ("Navegación y permisos de las nuevas vistas", "Michael", 2, DONE),
        ("Documentación del sprint, backlog y guía de pantallazos", "Equipo", 5, DONE),
        ("Redespliegue en Vercel y verificación de la URL pública", "Michael", 2, DONE),
        ("Sprint Review y retrospectiva", "Valentina", 2, "Pendiente"),
    ]),
]


def cover(doc, title, subtitle):
    P.cover(
        doc,
        eyebrow="DOCUMENTO DE ENTREGA ACADÉMICA",
        title=title,
        subtitle=subtitle,
        meta_lines=[
            "Equipo 1",
            f"Product Owner: {PO.split(' (')[0]}",
            f"Scrum Master: {SM.split(' (')[0]}",
            f"Sprint 7 — {PERIOD}",
        ],
    )


def build_plan() -> None:
    doc = Document()
    P.setup_doc(doc, "MILA · Plan del Sprint 7")
    P.cover(
        doc,
        eyebrow="PLANEACIÓN DE SPRINT — SCRUM",
        title="Plan del Sprint 7",
        subtitle="Trazabilidad global, automatización n8n, notificaciones, reportes y pruebas",
        meta_lines=[
            "Equipo 1",
            f"Product Owner: {PO.split(' (')[0]}",
            f"Scrum Master: {SM.split(' (')[0]}",
            PERIOD,
        ],
    )
    P.section_title(doc, "1.", "Información general del sprint")
    P.table(doc, ["Campo", "Detalle"], [
        ["Proyecto", "MILA — Mesa Inteligente de Logística y Atención"],
        ["Sprint", "Sprint 7 (semanas 12 y 13 del roadmap de 13 semanas)"],
        ["Periodo", "26/11/2026 – 09/12/2026"],
        ["Product Owner", PO],
        ["Scrum Master", SM],
        ["Compromiso", f"{POINTS} puntos · {len(STORIES)} historias (PB-022 a PB-028 y PB-030)"],
        ["Entregable de demo", "Demo integrada: n8n + IA, notificaciones, reportes y pruebas"],
        ["Aplicación pública", URL],
    ])
    P.section_title(doc, "2.", "Objetivo del sprint")
    P.para(
        doc,
        "Cerrar el producto con trazabilidad completa del ciclo de vida de los casos, automatización orquestada por n8n (incluido el análisis de IA), notificaciones por canales externos, observabilidad de errores, reportes con métricas de tiempos y una suite de pruebas que respalde la entrega final.",
        justify=True, after=8,
    )
    P.para(
        doc,
        "Meta de demostración: un caso se registra, n8n dispara el análisis de IA y notifica al cliente; el coordinador ve el evento en la línea de tiempo global, corrige un fallo desde la consola y exporta el reporte con tiempos de atención.",
        bold=True, size=10.5, justify=True, after=10,
    )
    P.section_title(doc, "3.", "Historias de usuario seleccionadas")
    P.table(
        doc,
        ["ID", "Épica", "Historia de usuario", "Prioridad", "Pts", "Estado al cierre"],
        [[s["id"], s["epic"], s["story"], s["prio"], str(s["pts"]), STORY_DONE] for s in STORIES],
        status_col=5,
    )
    P.para(doc, f"Total comprometido: {POINTS} puntos. PB-032 (versión integrada y demostración) se cierra de forma transversal con el redespliegue.",
           size=10, color=P.MUTED, italic=True, after=10)
    P.section_title(doc, "4.", "Criterios de aceptación por historia")
    for s in STORIES:
        P.subsection(doc, f"{s['id']} · {s['story']}")
        P.table(doc, ["#", "Criterio de aceptación"], [[str(i + 1), ac] for i, ac in enumerate(s["ac"])])
        P.para(doc, f"Evidencia técnica: {s['evidence']}. Estimación: {s['pts']} puntos.",
               size=9.5, color=P.MUTED, italic=True, after=6)
    P.section_title(doc, "5.", "Estimación y capacidad")
    P.table(doc, ["Semana", "Foco", "Historias", "Puntos"], [
        ["12 (26/11–02/12)", "n8n, IA orquestada y notificaciones", "PB-023, PB-024, PB-025, PB-026", "23"],
        ["13 (03/12–09/12)", "Trazabilidad, reportes, métricas y QA", "PB-022, PB-027, PB-028, PB-030", "26"],
        ["Total", "", f"{len(STORIES)} historias", str(POINTS)],
    ])
    P.para(doc, "Escala: puntos de historia (3, 5, 8). Las historias de 8 puntos (PB-024, PB-027, PB-030) concentran la integración con n8n, la consulta analítica y la estrategia de pruebas.",
           justify=True, size=10.5, after=10)
    P.section_title(doc, "6.", "Alcance, dependencias y fuera de alcance")
    P.subsection(doc, "Dependencias")
    for t in [
        "Sprints 5 y 6 completados: asignación, visitas, cierre y notificaciones in-app.",
        "Instancia de n8n accesible para PB-023/024/025 (local con npm run n8n o alojada); en la demo pública el análisis de IA permanece en la aplicación hasta conectar n8n.",
        "Credencial SMTP configurada en n8n para el envío real de correos (la plantilla se entrega sin credenciales).",
    ]:
        P.bullet(doc, t)
    P.subsection(doc, "Fuera de alcance")
    for t in [
        "Panel de usuario para preferencias de notificación por canal.",
        "Reportes gráficos avanzados y programación de reportes periódicos.",
        "Pruebas de carga y pruebas de interfaz automatizadas en navegador.",
    ]:
        P.bullet(doc, t)
    P.section_title(doc, "7.", "Definición de terminado (DoD)")
    for t in [
        "Funcionalidad implementada y alineada con los criterios de aceptación.",
        "Endpoints protegidos por rol, secreto compartido o verificación de origen según corresponda.",
        "Compilación de producción exitosa, lint sin errores y suite de pruebas aprobada.",
        "Validación con n8n real de los flujos entregados.",
        "Documentación, backlog y evidencias visuales actualizados.",
        "Aceptación del Product Owner.",
    ]:
        P.bullet(doc, t)
    P.section_title(doc, "8.", "Riesgos y mitigación")
    P.table(doc, ["Riesgo", "Impacto", "Mitigación"], [
        ["n8n no disponible durante la demo", "Alto", "Fallback: el análisis de IA se ejecuta localmente y se registra en la línea de tiempo."],
        ["Fuga de datos personales hacia automatizaciones", "Alto", "Lista blanca de campos del payload; datos personales solo en el canal de notificación configurado por el operador."],
        ["Llamadas no autorizadas al callback de IA", "Alto", "Secreto compartido en cabecera, comparación en tiempo constante y límite de tasa."],
        ["Volumen de datos en reportes", "Medio", "Tope de 2000 casos por consulta y paginación en la línea de tiempo."],
        ["Credenciales SMTP no disponibles", "Medio", "Estado ENVIADO/ERROR visible y reintento desde la consola."],
    ])
    P.section_title(doc, "9.", "Entregables y ceremonias")
    P.table(doc, ["Entregable / ceremonia", "Responsable", "Descripción"], [
        ["Incremento de software", "Equipo de desarrollo", "Trazabilidad global, flujos n8n, notificaciones, logs, reportes y pruebas"],
        ["Plan del Sprint 7 (este documento)", "Product Owner", "Objetivo, historias, criterios y estimaciones"],
        ["Sprint Backlog y tareas", "Equipo / Scrum Master", "Desglose de tareas con responsables"],
        ["Guía de pantallazos", "Equipo", "12 evidencias visuales vinculadas a las historias"],
        ["Backlog actualizado", "Product Owner", "Estado de PB-001 a PB-034 tras el sprint"],
        ["Sprint Review / demo y retrospectiva", "Equipo completo", "Demo integrada y acciones de mejora"],
    ])
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=14)
    doc.save(PLAN)


def build_tasks() -> None:
    doc = Document()
    P.setup_doc(doc, "MILA · Sprint Backlog y tareas · Sprint 7")
    P.cover(
        doc,
        eyebrow="SPRINT BACKLOG — SCRUM",
        title="Sprint Backlog y tareas del Sprint 7",
        subtitle="Desglose de tareas, responsables y estimación en horas",
        meta_lines=["Equipo 1", f"Product Owner: {PO.split(' (')[0]}", f"Scrum Master: {SM.split(' (')[0]}", PERIOD],
    )
    P.section_title(doc, "1.", "Resumen de tareas")
    rows, total_h = [], 0
    for pid, tasks in TASKS_DATA:
        h = sum(t[2] for t in tasks)
        total_h += h
        pend = sum(1 for t in tasks if t[3] != DONE)
        rows.append([pid if pid != "TRANS" else "Transversal", str(len(tasks)), f"{h} h",
                     DONE if not pend else f"Parcial ({pend} pendiente)"])
    rows.append(["Total", str(sum(len(t) for _, t in TASKS_DATA)), f"{total_h} h", ""])
    P.table(doc, ["Historia", "Tareas", "Horas estimadas", "Estado"], rows, status_col=3)
    P.para(doc, "Las horas son estimaciones de esfuerzo para planeación; los responsables de aceptación y ceremonias son una propuesta ajustable.",
           size=9.5, color=P.MUTED, italic=True, after=8)
    P.section_title(doc, "2.", "Distribución de responsables")
    P.table(doc, ["Integrante", "Rol", "Responsabilidades en el sprint"], [
        ["Michael Andrés Perdomo Murcia", "Product Owner / desarrollo", "Implementación de API, automatizaciones, reportes e interfaz; pruebas e integración con n8n"],
        ["Laura Valentina Zambrano Cárcamo", "Scrum Master", "Ceremonias, revisión de criterios, pruebas de aceptación y documentación"],
    ])
    P.section_title(doc, "3.", "Tareas por historia")
    for i, (pid, tasks) in enumerate(TASKS_DATA, start=1):
        if pid == "TRANS":
            P.subsection(doc, f"3.{i} Tareas transversales")
        else:
            story = next(s for s in STORIES if s["id"] == pid)
            P.subsection(doc, f"3.{i} {pid} · {story['story']}")
        P.table(doc, ["#", "Tarea", "Responsable", "Horas", "Estado"],
                [[str(n + 1), t[0], t[1], str(t[2]), t[3]] for n, t in enumerate(tasks)], status_col=4)
    P.section_title(doc, "4.", "Entregables del sprint")
    for t in [
        "Aplicación MILA con trazabilidad global, reportes, métricas, logs y notificaciones externas.",
        "Plantillas de flujos n8n (eventos e IA; notificaciones por correo).",
        "Suite de pruebas automatizadas (npm test / npm run test:e2e).",
        "Plan (01), Sprint Backlog (02), guía de pantallazos (03) y backlog actualizado (04).",
        f"Aplicación publicada y verificada en {URL}.",
    ]:
        P.bullet(doc, t)
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=14)
    doc.save(TASKS)


def picture(doc, name):
    path = IMG / name
    if not path.exists():
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Cm(15.5))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    P.style_run(cap.add_run(name), size=8.5, color=P.MUTED, italic=True)


def build_guide() -> None:
    doc = Document()
    P.setup_doc(doc, "MILA · Guía de pantallazos y entrega · Sprint 7")
    cover(doc, "Guía de pantallazos y alcance de la entrega", "Evidencias visuales de las historias PB-022 a PB-028 y PB-030")
    P.section_title(doc, "1.", "Qué entrega el Sprint 7")
    P.para(
        doc,
        "El sprint cierra el producto: trazabilidad global de eventos, automatización con n8n (incluido el análisis de IA), notificaciones por canal externo, observabilidad de errores con reintento, reportes con métricas de tiempos y una suite de pruebas automatizadas.",
        justify=True, after=8,
    )
    P.table(doc, ["ID", "Épica", "Historia (resumen)", "Estado"], [
        ["PB-022", "Trazabilidad", "Línea de tiempo global con filtros", "Hecho — Sprint 7"],
        ["PB-023", "n8n", "Flujo n8n al registrar una solicitud", "Hecho — Sprint 7"],
        ["PB-024", "n8n", "IA orquestada por n8n con fallback", "Hecho — Sprint 7"],
        ["PB-025", "Notificaciones", "Notificaciones in-app y canal externo", "Hecho — Sprint 7"],
        ["PB-026", "Observabilidad", "Logs de automatización y reintentos", "Hecho — Sprint 7"],
        ["PB-027", "Reportes", "Reportes por periodo, estado y zona + CSV", "Hecho — Sprint 7"],
        ["PB-028", "Reportes", "Tiempos de atención y resolución", "Hecho — Sprint 7"],
        ["PB-030", "QA", "Suite de pruebas unitarias e integración", "Hecho — Sprint 7"],
    ], status_col=3)
    P.subsection(doc, "Datos de demostración")
    P.para(
        doc,
        "Los pantallazos se tomaron con seis casos en tres zonas. Para que los tiempos de los reportes sean representativos, las marcas de tiempo de esos casos de demostración se distribuyeron con un script (scripts/demo_backdate.ts); la lógica de cálculo es la misma de producción. Los dos primeros fallos de notificación externa son reales: se apagó el receptor para evidenciar el registro de errores y el reintento.",
        justify=True, size=10.5, after=8,
    )
    P.para(doc, f"Aplicación pública: {URL}", size=10, color=P.MUTED, after=10)
    P.section_title(doc, "2.", "Resumen de pantallazos")
    P.table(doc, ["Archivo", "HU", "Qué demuestra"], [[n, h, d] for n, h, d in SHOTS])
    P.section_title(doc, "3.", "Evidencias")
    for i, (name, hu, desc) in enumerate(SHOTS, 1):
        P.subsection(doc, f"3.{i} {hu}")
        P.para(doc, desc, size=10.5, justify=True, after=6)
        picture(doc, name)
    P.section_title(doc, "4.", "Lectura sugerida en sustentación")
    for i, line in enumerate([
        "10–11: el flujo n8n activo y sus ejecuciones (PB-023).",
        "03: el caso muestra «IA delegada a n8n» y luego el resultado (PB-024).",
        "01–02: línea de tiempo global y filtros (PB-022).",
        "04–06: consola de automatización, error de notificación externa y reintento (PB-025/026).",
        "07–09: reportes, tiempos por zona y exportación CSV (PB-027/028).",
        "12: suite de pruebas aprobada (PB-030).",
    ], 1):
        P.bullet(doc, f"{i}. {line}")
    P.section_title(doc, "5.", "Configuración de integraciones")
    P.table(doc, ["Variable", "Uso"], [
        ["N8N_WEBHOOK_URL", "Webhook de n8n que recibe los eventos de MILA"],
        ["N8N_WEBHOOK_SECRET", "Firma HMAC (x-mila-signature) de eventos y notificaciones"],
        ["AI_VIA_N8N=true + N8N_CALLBACK_SECRET", "Delegar el análisis de IA a n8n; secreto que n8n envía a /api/automation/ai-analyze"],
        ["NOTIFY_WEBHOOK_URL", "Webhook de n8n que envía los correos de notificación"],
    ])
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=16)
    doc.save(GUIDE)


def build_backlog() -> None:
    status = dict(P.STATUS)
    for pid in ("PB-022", "PB-023", "PB-024", "PB-026", "PB-027", "PB-028"):
        status[pid] = ("Hecho — Sprint 7", "")
    status["PB-022"] = ("Hecho — Sprint 7", "Línea de tiempo global con filtros y paginación.")
    status["PB-023"] = ("Hecho — Sprint 7", "Webhook firmado, reintento y plantilla n8n validada.")
    status["PB-024"] = ("Hecho — Sprint 7", "IA vía n8n con callback idempotente y fallback local.")
    status["PB-025"] = ("Hecho — Sprint 7", "In-app + canal externo por webhook; correo real requiere SMTP en n8n.")
    status["PB-026"] = ("Hecho — Sprint 7", "Filtros, contadores y reintento de eventos.")
    status["PB-027"] = ("Hecho — Sprint 7", "Reportes por periodo/estado/zona y CSV.")
    status["PB-028"] = ("Hecho — Sprint 7", "Tiempos de primera atención, asignación y resolución.")
    status["PB-030"] = ("Hecho — Sprint 7", "Vitest: 16 unitarias + 8 de integración.")
    status["PB-031"] = ("Hecho", "Documentación n8n y plantillas de workflow (eventos/IA y correo).")
    status["PB-032"] = ("Hecho", f"Despliegue público permanente: {URL}")

    doc = Document()
    P.setup_doc(doc, "MILA · Product Backlog actualizado · Sprint 7")
    P.cover(
        doc,
        eyebrow="PRODUCT BACKLOG — CORTE DE ESTADO",
        title="Backlog de producto actualizado",
        subtitle="Sprints 5, 6 y 7 entregados",
        meta_lines=["Equipo 1", f"Product Owner: {PO.split(' (')[0]}",
                    "Fuente: Product Backlog 13 semanas (actualizado con estado real de MILA)"],
    )
    P.section_title(doc, "1.", "Resumen ejecutivo")
    P.para(
        doc,
        "Con el Sprint 7 el Product Backlog queda completo: las 34 historias tienen implementación entregada. Este corte reemplaza etiquetas genéricas por el estado observado en MILA y deja explícitas las dependencias operativas (instancia de n8n y credencial SMTP).",
        justify=True, after=8,
    )
    P.table(doc, ["Bloque", "IDs", "Estado global", "Lectura"], [
        ["Fundamentos (S2)", "001, 002, 029, 033, 034", "Hecho*", "Auth por rol y modelo base"],
        ["Solicitudes (S3)", "003–006, 031, 032", "Hecho", "Alta, adjuntos, consulta, documentación y despliegue"],
        ["Agente IA (S4)", "007–011", "Hecho", "Incluye revisión humana"],
        ["Escalamiento (S5)", "012–016", "Hecho", "Ciclo hasta técnico asignado"],
        ["Visitas / cierre (S6)", "017–021", "Hecho", "Agenda, cierre extendido y evidencias"],
        ["Trazabilidad / n8n / reportes / QA (S7)", "022–028, 030", "Hecho — por aceptar", "Timeline global, flujos n8n, logs, reportes, métricas y pruebas"],
    ], status_col=2)
    P.para(doc, "*PB-001: el registro libre se omitió por seguridad operativa (cuentas provisionadas); la aceptación se cubre con autenticación por rol.",
           size=9.5, color=P.MUTED, italic=True, after=8)
    P.section_title(doc, "2.", "Sprint 7 — entregado (por aceptar)")
    P.table(doc, ["ID", "Historia", "Pts", "Estado", "Avance"], [
        [s["id"], s["story"].replace("Como ", "").split(" quiero ")[-1].rstrip(".").capitalize(), str(s["pts"]), "Hecho — Sprint 7", s["evidence"].split(" · ")[0]]
        for s in STORIES
    ], status_col=3)
    P.section_title(doc, "3.", "Backlog completo actualizado")
    rows = []
    for pid, epic, story, prio, pts, sprint in P.ITEMS:
        st, note = status[pid]
        rows.append([pid, epic, story, f"{prio} · {pts} · {sprint}", st, note])
    P.table(doc, ["ID", "Épica", "Historia / trabajo", "Prioridad", "Estado", "Notas"], rows, status_col=4)
    P.section_title(doc, "4.", "Dependencias operativas y deuda conocida")
    for t in [
        "n8n: la demo pública usa el análisis de IA dentro de la aplicación; para orquestarlo con n8n se configura N8N_WEBHOOK_URL, AI_VIA_N8N y los secretos descritos en la guía.",
        "Correo real: la plantilla de notificaciones requiere una credencial SMTP en n8n.",
        "Pruebas: la suite cubre lógica y API; no incluye pruebas de interfaz en navegador ni de carga.",
        "Aceptación formal del Product Owner pendiente en la Sprint Review.",
    ]:
        P.bullet(doc, t)
    P.section_title(doc, "5.", "Leyenda de estados")
    P.bullet(doc, "Hecho: funcionalidad usable y alineada al criterio principal de aceptación.")
    P.bullet(doc, "Hecho — por aceptar: implementada y verificada; falta la aceptación formal del Product Owner.")
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=12)
    doc.save(BACKLOG)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)
    build_plan()
    build_tasks()
    build_guide()
    build_backlog()
    for f in (PLAN, TASKS, GUIDE, BACKLOG):
        (ART / f.name).write_bytes(f.read_bytes())
        print("ok", f.name, f.stat().st_size)


if __name__ == "__main__":
    main()
