#!/usr/bin/env python3
"""Genera la documentación académica de planeación del Sprint 6 (Word)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from docx import Document  # noqa: E402

import generar_docs_entrega_polish as P  # noqa: E402

OUT = Path("/workspace/docs/entrega-sprint6")
ART = Path("/opt/cursor/artifacts")
PLAN = OUT / "01_PLAN_SPRINT6_MILA.docx"
TASKS = OUT / "02_SPRINT_BACKLOG_Y_TAREAS_SPRINT6.docx"

PO = "Michael Andrés Perdomo Murcia (Product Owner)"
SM = "Laura Valentina Zambrano Cárcamo (Scrum Master)"

STORIES = [
    {
        "id": "PB-017",
        "epic": "Visitas",
        "story": "Como coordinador quiero programar una visita evitando conflictos de agenda.",
        "prio": "Obligatorio",
        "pts": 8,
        "ac": [
            "Dado un caso ESCALADO o ASIGNADO, cuando el coordinador programa una visita para un técnico, entonces se crea la visita con fecha, ventana horaria y dirección.",
            "Dado que el técnico ya tiene una visita en la misma ventana, cuando se intenta programar otra, entonces el sistema rechaza la operación e informa el conflicto.",
            "Dado que la visita se programa, entonces el caso pasa a VISITA_PROGRAMADA y se registra el evento en la línea de tiempo.",
            "El cliente y el técnico reciben una notificación in-app de la visita programada.",
        ],
        "evidence": "POST /api/tickets/[id]/visits · panel «Visitas» del especialista",
    },
    {
        "id": "PB-018",
        "epic": "Visitas",
        "story": "Como técnico quiero consultar solicitud, ubicación, antecedentes y recomendaciones antes de desplazarme.",
        "prio": "Obligatorio",
        "pts": 5,
        "ac": [
            "Dado un caso asignado, cuando el técnico abre el detalle, entonces visualiza descripción, zona, datos del cliente y visitas programadas.",
            "El detalle muestra el último análisis de la IA (resumen, ambigüedades y recomendaciones) y su decisión de revisión.",
            "El técnico solo puede acceder a casos que tiene asignados; el acceso a casos ajenos es denegado.",
        ],
        "evidence": "Detalle del caso en consola del técnico · control canAccessTicket",
    },
    {
        "id": "PB-019",
        "epic": "Cierre",
        "story": "Como técnico quiero registrar actividades, diagnóstico y solución aplicada.",
        "prio": "Obligatorio",
        "pts": 8,
        "ac": [
            "Dado un caso en atención, cuando el técnico diligencia actividades, diagnóstico y solución (mínimo 8 caracteres cada uno), entonces se guarda el registro de cierre.",
            "Solo el técnico asignado (o un administrador) puede registrar el cierre.",
            "El registro de cierre queda asociado al caso y visible para el especialista.",
            "El cierre genera un evento en la línea de tiempo y una notificación al cliente.",
        ],
        "evidence": "POST /api/tickets/[id]/close · modelo Closure",
    },
    {
        "id": "PB-020",
        "epic": "Cierre",
        "story": "Como técnico quiero registrar si el servicio fue resuelto, pendiente, requiere nueva visita o escalamiento.",
        "prio": "Obligatorio",
        "pts": 5,
        "ac": [
            "El formulario de cierre ofrece los resultados RESUELTO, PENDIENTE, NUEVA_VISITA y ESCALADO.",
            "RESUELTO lleva el caso a CERRADA y completa visitas y asignaciones abiertas.",
            "NUEVA_VISITA devuelve el caso a ASIGNADA; ESCALADO lo lleva a ESCALADA; PENDIENTE lo mantiene EN_ATENCION.",
            "Cada resultado se emite como evento ticket.closed hacia n8n.",
        ],
        "evidence": "Enumeración ClosureOutcome · transiciones en closeTicket()",
    },
    {
        "id": "PB-021",
        "epic": "Cierre",
        "story": "Como técnico quiero adjuntar evidencias y diligenciar el formato de cierre.",
        "prio": "Deseable",
        "pts": 5,
        "ac": [
            "Dado el formulario de cierre, cuando el técnico adjunta hasta 4 imágenes (máx. 2,5 MB c/u), entonces quedan asociadas al cierre.",
            "Las evidencias se almacenan en base de datos y se sirven por una ruta autenticada; nunca como archivo público.",
            "El especialista y el cliente del caso pueden visualizar las evidencias; terceros no.",
            "La línea de tiempo indica la cantidad de evidencias fotográficas del cierre.",
        ],
        "evidence": "Campo images en /close · Attachment.closureId · enlaces «Evidencia» en detalle",
    },
]

DONE = "Hecho"
STORY_DONE = "Hecho — por aceptar"


def build_plan() -> None:
    doc = Document()
    P.setup_doc(doc, "MILA · Plan del Sprint 6")
    P.cover(
        doc,
        eyebrow="PLANEACIÓN DE SPRINT — SCRUM",
        title="Plan del Sprint 6",
        subtitle="Agenda de visitas, atención en campo, cierre y evidencias",
        meta_lines=[
            "Equipo 1",
            f"Product Owner: {PO.split(' (')[0]}",
            f"Scrum Master: {SM.split(' (')[0]}",
            "Semanas 10–11 · 12/11/2026 – 25/11/2026",
        ],
    )

    P.section_title(doc, "1.", "Información general del sprint")
    P.table(
        doc,
        ["Campo", "Detalle"],
        [
            ["Proyecto", "MILA — Mesa Inteligente de Logística y Atención"],
            ["Sprint", "Sprint 6 (semanas 10 y 11 del roadmap de 13 semanas)"],
            ["Periodo", "12/11/2026 – 25/11/2026"],
            ["Product Owner", PO],
            ["Scrum Master", SM],
            ["Compromiso (puntos de historia)", "31 puntos · 5 historias (PB-017 a PB-021)"],
            ["Entregable de demo", "Demo visita / cierre (roadmap, semana 11)"],
        ],
    )

    P.section_title(doc, "2.", "Objetivo del sprint")
    P.para(
        doc,
        "Permitir que el coordinador programe visitas sin conflictos de agenda y que el técnico de campo consulte los antecedentes del caso, atienda el servicio y lo cierre formalmente con diagnóstico, solución, resultado y evidencias fotográficas, de modo que el ciclo de vida del caso quede completo y trazable hasta el cierre.",
        justify=True,
        after=8,
    )
    P.para(
        doc,
        "Meta de demostración: un mismo caso recorre cliente → especialista → técnico → cierre con evidencia, sin pasos manuales fuera de la plataforma.",
        bold=True,
        size=10.5,
        justify=True,
        after=10,
    )

    P.section_title(doc, "3.", "Historias de usuario seleccionadas")
    P.para(
        doc,
        "Las historias provienen del Product Backlog actualizado tras la entrega del Sprint 5 (PB-012 a PB-016 completadas). Se seleccionan las cinco historias del bloque Visitas y Cierre asignadas a este sprint.",
        justify=True,
        after=8,
    )
    P.table(
        doc,
        ["ID", "Épica", "Historia de usuario", "Prioridad", "Pts", "Estado al cierre"],
        [
            [s["id"], s["epic"], s["story"], s["prio"], str(s["pts"]), STORY_DONE]
            for s in STORIES
        ],
        status_col=5,
    )
    P.para(
        doc,
        "Total comprometido: 31 puntos (26 obligatorios + 5 deseables).",
        size=10,
        color=P.MUTED,
        italic=True,
        after=10,
    )

    P.section_title(doc, "4.", "Criterios de aceptación por historia")
    for s in STORIES:
        P.subsection(doc, f"{s['id']} · {s['story']}")
        P.table(
            doc,
            ["#", "Criterio de aceptación"],
            [[str(i + 1), ac] for i, ac in enumerate(s["ac"])],
        )
        P.para(
            doc,
            f"Evidencia técnica: {s['evidence']}. Estimación: {s['pts']} puntos.",
            size=9.5,
            color=P.MUTED,
            italic=True,
            after=6,
        )

    P.section_title(doc, "5.", "Estimación y capacidad")
    P.table(
        doc,
        ["Semana", "Foco", "Historias", "Puntos"],
        [
            ["10 (12/11–18/11)", "Agenda y programación de visitas", "PB-017, PB-018", "13"],
            ["11 (19/11–25/11)", "Atención, cierre y evidencias", "PB-019, PB-020, PB-021", "18"],
            ["Total", "", "5 historias", "31"],
        ],
    )
    P.para(
        doc,
        "Escala de estimación: puntos de historia (Fibonacci modificado: 3, 5, 8). Las historias de 8 puntos (PB-017, PB-019) concentran la mayor complejidad: reglas de conflicto de agenda y transiciones de estado del cierre.",
        justify=True,
        size=10.5,
        after=10,
    )

    P.section_title(doc, "6.", "Alcance, dependencias y fuera de alcance")
    P.subsection(doc, "Dependencias")
    for t in [
        "Sprint 5 completado: escalamiento, perfiles de técnico y asignación (PB-012 a PB-016).",
        "Catálogo de usuarios sembrado (administrador, especialistas, técnicos, clientes por zona).",
        "Base de datos PostgreSQL con los modelos Visit, Closure y Attachment.",
    ]:
        P.bullet(doc, t)
    P.subsection(doc, "Incluido como mejora transversal")
    for t in [
        "Revisión humana del análisis de IA (aceptar, modificar, rechazar) — cierra el ítem pendiente de PB-010.",
        "Notificaciones in-app con campana (porción inicial de PB-025).",
    ]:
        P.bullet(doc, t)
    P.subsection(doc, "Fuera de alcance (Sprint 7)")
    for t in [
        "Línea de tiempo global avanzada (PB-022) y orquestación completa con n8n (PB-023/024).",
        "Reportes por periodo, estado y zona (PB-027) y métricas de tiempos (PB-028).",
        "Agenda visual semanal del técnico y notificaciones por canales externos.",
    ]:
        P.bullet(doc, t)

    P.section_title(doc, "7.", "Definición de terminado (DoD)")
    for t in [
        "Funcionalidad implementada y alineada con los criterios de aceptación.",
        "Endpoints protegidos por rol, validación de entrada y verificación de origen (CSRF).",
        "Compilación de producción exitosa y prueba de flujo de extremo a extremo ejecutada.",
        "Evento registrado en la línea de tiempo y emitido a n8n cuando aplica.",
        "Documentación y backlog actualizados; evidencia visual disponible para la demo.",
        "Aceptación del Product Owner.",
    ]:
        P.bullet(doc, t)

    P.section_title(doc, "8.", "Riesgos y mitigación")
    P.table(
        doc,
        ["Riesgo", "Impacto", "Mitigación"],
        [
            ["Conflictos de agenda no detectados", "Alto", "Validación por técnico y ventana horaria en la API de visitas."],
            ["Archivos de evidencia expuestos", "Alto", "Almacenamiento en base de datos y descarga solo con sesión y permiso sobre el caso."],
            ["Archivos locales no persistentes en hosting serverless", "Medio", "Evidencias en base de datos (Bytes) en lugar de disco."],
            ["Dependencia de secretos y datos semilla en producción", "Medio", "Secretos de entorno y administración de usuarios desde la propia aplicación."],
        ],
    )

    P.section_title(doc, "9.", "Entregables y ceremonias")
    P.table(
        doc,
        ["Entregable / ceremonia", "Responsable", "Descripción"],
        [
            ["Incremento de software", "Equipo de desarrollo", "Visitas, atención, cierre y evidencias operativos en la aplicación"],
            ["Plan del Sprint 6 (este documento)", "Product Owner", "Objetivo, historias, criterios y estimaciones"],
            ["Sprint Backlog y tareas", "Equipo / Scrum Master", "Desglose de tareas con responsables"],
            ["Backlog actualizado", "Product Owner", "Estado de PB-001 a PB-034 tras el sprint"],
            ["Sprint Review / demo", "Equipo completo", "Demo visita/cierre con evidencias"],
            ["Retrospectiva", "Scrum Master", "Acciones de mejora para el Sprint 7"],
        ],
    )
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=14)
    doc.save(PLAN)


TASKS_DATA = [
    ("PB-017", [
        ("Modelar entidad Visit (fecha, ventana, estado) y migración", "Michael", 3, DONE),
        ("Regla de conflicto de agenda por técnico y ventana", "Michael", 5, DONE),
        ("Endpoint POST /api/tickets/[id]/visits con validación y CSRF", "Michael", 4, DONE),
        ("Formulario de programación y listado de visitas en consola", "Michael", 4, DONE),
        ("Revisión de criterios y pruebas de conflicto", "Valentina", 2, "Pendiente"),
    ]),
    ("PB-018", [
        ("Detalle del caso para técnico: solicitud, zona y cliente", "Michael", 3, DONE),
        ("Mostrar visitas y último análisis de IA", "Michael", 3, DONE),
        ("Control de acceso por caso asignado", "Michael", 2, DONE),
    ]),
    ("PB-019", [
        ("Modelar entidad Closure (actividades, diagnóstico, solución)", "Michael", 3, DONE),
        ("Endpoint de inicio de atención y de cierre", "Michael", 5, DONE),
        ("Formulario de cierre del técnico", "Michael", 4, DONE),
        ("Eventos de timeline y notificación al cliente", "Michael", 2, DONE),
        ("Validación funcional con el Product Owner", "Valentina", 2, "Pendiente"),
    ]),
    ("PB-020", [
        ("Enumeración ClosureOutcome y reglas de transición de estado", "Michael", 4, DONE),
        ("Cierre de visitas y asignaciones al resolver", "Michael", 2, DONE),
        ("Evento ticket.closed hacia n8n", "Michael", 2, DONE),
    ]),
    ("PB-021", [
        ("Extender Attachment (closureId, tipo MIME, bytes) en el esquema", "Michael", 2, DONE),
        ("Almacenar evidencias en base de datos (apto serverless)", "Michael", 3, DONE),
        ("Aceptar imágenes en el endpoint de cierre", "Michael", 2, DONE),
        ("Selector de fotos en el formulario de cierre", "Michael", 3, DONE),
        ("Mostrar evidencias del cierre en el detalle del especialista", "Michael", 2, DONE),
        ("Prueba de extremo a extremo (cierre con evidencia y descarga)", "Valentina", 2, "Pendiente"),
    ]),
    ("TRANS", [
        ("Revisión humana del análisis de IA (aceptar/modificar/rechazar)", "Michael", 4, DONE),
        ("Notificaciones in-app con campana", "Michael", 4, DONE),
        ("Actualizar backlog, plan y evidencias del sprint", "Equipo", 4, DONE),
        ("Sprint Review y retrospectiva", "Valentina", 2, "Pendiente"),
    ]),
]


def build_tasks() -> None:
    doc = Document()
    P.setup_doc(doc, "MILA · Sprint Backlog y tareas · Sprint 6")
    P.cover(
        doc,
        eyebrow="SPRINT BACKLOG — SCRUM",
        title="Sprint Backlog y tareas del Sprint 6",
        subtitle="Desglose de tareas, responsables y estimación en horas",
        meta_lines=[
            "Equipo 1",
            f"Product Owner: {PO.split(' (')[0]}",
            f"Scrum Master: {SM.split(' (')[0]}",
            "Semanas 10–11 · 12/11/2026 – 25/11/2026",
        ],
    )

    P.section_title(doc, "1.", "Resumen de tareas")
    rows = []
    total_h = 0
    for pid, tasks in TASKS_DATA:
        h = sum(t[2] for t in tasks)
        total_h += h
        label = pid if pid != "TRANS" else "Transversal"
        pend = sum(1 for t in tasks if t[3] != DONE)
        rows.append([label, str(len(tasks)), f"{h} h", DONE if not pend else f"Parcial ({pend} pendiente)"])
    rows.append(["Total", str(sum(len(t) for _, t in TASKS_DATA)), f"{total_h} h", ""])
    P.table(doc, ["Historia", "Tareas", "Horas estimadas", "Estado"], rows, status_col=3)
    P.para(
        doc,
        "Las horas son estimaciones de esfuerzo del equipo para planeación; no sustituyen los puntos de historia del plan.",
        size=9.5,
        color=P.MUTED,
        italic=True,
        after=10,
    )

    P.para(
        doc,
        "Los responsables de las tareas de aceptación y ceremonias son una propuesta de distribución y pueden ajustarse con el equipo.",
        size=9.5,
        color=P.MUTED,
        italic=True,
        after=6,
    )
    P.section_title(doc, "2.", "Distribución de responsables")
    P.table(
        doc,
        ["Integrante", "Rol", "Responsabilidades en el sprint"],
        [
            ["Michael Andrés Perdomo Murcia", "Product Owner / desarrollo", "Priorización, criterios de aceptación, implementación de API, base de datos e interfaz"],
            ["Laura Valentina Zambrano Cárcamo", "Scrum Master", "Facilitación de ceremonias, revisión de criterios, pruebas de aceptación y documentación"],
        ],
    )

    P.section_title(doc, "3.", "Tareas por historia")
    for i, (pid, tasks) in enumerate(TASKS_DATA, start=1):
        if pid == "TRANS":
            P.subsection(doc, "3.6 Tareas transversales")
        else:
            story = next(s for s in STORIES if s["id"] == pid)
            P.subsection(doc, f"3.{i} {pid} · {story['story']}")
        P.table(
            doc,
            ["#", "Tarea", "Responsable", "Horas", "Estado"],
            [[str(n + 1), t[0], t[1], str(t[2]), t[3]] for n, t in enumerate(tasks)],
            status_col=4,
        )

    P.section_title(doc, "4.", "Entregables del sprint")
    for t in [
        "Aplicación MILA con visitas, atención, cierre y evidencias operativos.",
        "Plan del Sprint 6 (01) y este Sprint Backlog (02).",
        "Backlog de producto actualizado (estado de PB-017 a PB-021).",
        "Demo visita/cierre con evidencia fotográfica.",
    ]:
        P.bullet(doc, t)
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=14)
    doc.save(TASKS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)
    build_plan()
    build_tasks()
    for f in (PLAN, TASKS):
        dest = ART / f.name
        dest.write_bytes(f.read_bytes())
        print("ok", f.name, f.stat().st_size)


if __name__ == "__main__":
    main()
