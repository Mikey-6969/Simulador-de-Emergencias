#!/usr/bin/env python3
"""Genera guía de pantallazos y backlog actualizado del Sprint 6 (Word)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from docx import Document  # noqa: E402
from docx.enum.text import WD_ALIGN_PARAGRAPH  # noqa: E402
from docx.shared import Cm  # noqa: E402

import generar_docs_entrega_polish as P  # noqa: E402

OUT = Path("/workspace/docs/entrega-sprint6")
IMG = OUT / "imagenes"
ART = Path("/opt/cursor/artifacts")
GUIDE = OUT / "03_GUIA_PANTALLAZOS_Y_ENTREGA_SPRINT6.docx"
BACKLOG = OUT / "04_BACKLOG_PRODUCTO_ACTUALIZADO_SPRINT6.docx"

SHOTS = [
    ("01_especialista_programar_visita.png", "PB-017", "Panel «Visitas» del especialista: formulario para programar la visita (técnico, fecha, ventana horaria, dirección)."),
    ("02_visita_programada_reprogramar_cancelar.png", "PB-017", "Visita programada, estado VISITA_PROGRAMADA y acciones de reprogramar / cancelar."),
    ("03_conflicto_agenda.png", "PB-017", "Rechazo de una segunda visita en la misma ventana del técnico (detección de conflicto)."),
    ("04_agenda_semanal_coordinador.png", "PB-017", "Agenda semanal por técnico con capacidad diaria y visitas programadas."),
    ("05_tecnico_bandeja.png", "PB-018", "Bandeja «Asignados a mí» del técnico con el caso con visita."),
    ("06_tecnico_detalle_antecedentes.png", "PB-018", "Detalle para el técnico: análisis IA, escalamiento y antecedentes del cliente."),
    ("07_tecnico_cierre_extendido_evidencias.png", "PB-019 / 020 / 021", "Formulario de cierre extendido: actividades, diagnóstico, solución, tiempo, repuestos, recomendaciones, conformidad y evidencias."),
    ("08_cierre_registrado_con_evidencias.png", "PB-019 / 020 / 021", "Cierre registrado visible para el especialista con evidencias adjuntas."),
    ("09_formato_cierre_imprimible.png", "PB-021", "Formato de cierre de servicio imprimible / exportable a PDF."),
    ("10_cliente_caso_cerrado_notificaciones.png", "PB-017 / 019", "Vista del cliente: caso cerrado y avisos in-app de visita y cierre."),
]


def picture(doc, name: str) -> None:
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
    P.setup_doc(doc, "MILA · Guía de pantallazos y entrega · Sprint 6")
    P.cover(
        doc,
        eyebrow="DOCUMENTO DE ENTREGA ACADÉMICA",
        title="Guía de pantallazos y alcance de la entrega",
        subtitle="Evidencias visuales de las historias PB-017 a PB-021",
        meta_lines=[
            "Equipo 1",
            "Product Owner: Michael Andrés Perdomo Murcia",
            "Sprint 6 — Visitas técnicas y cierre del servicio",
        ],
    )

    P.section_title(doc, "1.", "Qué entrega el Sprint 6")
    P.para(
        doc,
        "El objetivo del sprint es cerrar el ciclo en campo: el coordinador programa visitas sin conflictos de agenda, el técnico consulta antecedentes antes de desplazarse y registra un cierre estructurado con evidencias fotográficas y formato imprimible.",
        justify=True,
        after=8,
    )
    P.table(
        doc,
        ["ID", "Épica", "Historia (resumen)", "Estado"],
        [
            ["PB-017", "Visitas", "Programar visita sin conflictos; reprogramar/cancelar; agenda semanal", "Hecho — Sprint 6"],
            ["PB-018", "Visitas", "Consultar solicitud, IA y antecedentes antes de desplazarse", "Hecho — Sprint 6"],
            ["PB-019", "Cierre", "Actividades, diagnóstico, solución, tiempo, repuestos y recomendaciones", "Hecho — Sprint 6"],
            ["PB-020", "Cierre", "Resultado RESUELTO / PENDIENTE / NUEVA_VISITA / ESCALADO", "Hecho — Sprint 6"],
            ["PB-021", "Cierre", "Evidencias fotográficas y formato de cierre imprimible", "Hecho — Sprint 6"],
        ],
        status_col=3,
    )
    P.subsection(doc, "Caso demo")
    P.para(
        doc,
        "MILA-2026-00002 · «Impresora no imprime en sede Oriente» · Zona ORIENTE · Servicio Hardware / Equipos · Técnico: Omar Técnico Oriente 1. El cliente tiene un caso histórico cerrado (MILA-2026-00001) que aparece como antecedente.",
        justify=True,
        size=10.5,
        after=8,
    )
    P.para(doc, "Aplicación pública: https://mila-mesa-de-ayuda.vercel.app", size=10, color=P.MUTED, after=10)

    P.section_title(doc, "2.", "Resumen de pantallazos")
    P.table(
        doc,
        ["Archivo", "HU", "Qué demuestra"],
        [[n, h, d] for n, h, d in SHOTS],
    )

    P.section_title(doc, "3.", "Evidencias")
    for i, (name, hu, desc) in enumerate(SHOTS, 1):
        P.subsection(doc, f"3.{i} {hu}")
        P.para(doc, desc, size=10.5, justify=True, after=6)
        picture(doc, name)

    P.section_title(doc, "4.", "Lectura sugerida en sustentación")
    for i, line in enumerate(
        [
            "Capturas 01–02: programar y gestionar la visita (PB-017).",
            "Captura 03: la agenda impide solapamientos del mismo técnico.",
            "Captura 04: agenda semanal con capacidad por técnico.",
            "Capturas 05–06: el técnico revisa IA y antecedentes (PB-018).",
            "Capturas 07–09: cierre extendido, evidencias y formato imprimible (PB-019/020/021).",
            "Captura 10: el cliente recibe la notificación y ve el caso cerrado.",
        ],
        1,
    ):
        P.bullet(doc, f"{i}. {line}")

    P.section_title(doc, "5.", "Notas técnicas")
    P.bullet(doc, "Las franjas se calculan en hora de Bogotá (America/Bogota), independientemente de la zona del servidor.")
    P.bullet(doc, "Las evidencias se guardan en base de datos (tope total del cierre: 3 MB, hasta 4 imágenes) para operar en despliegue serverless.")
    P.bullet(doc, "El formato de cierre se abre en /especialista/casos/[id]/cierre y se exporta con «Imprimir / guardar PDF».")
    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=16)
    doc.save(GUIDE)


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    build_guide()
    P.OUT_BACKLOG = BACKLOG
    P.build_backlog()
    for src in (GUIDE, BACKLOG):
        (ART / src.name).write_bytes(src.read_bytes())
        print("ok", src.name, src.stat().st_size)


if __name__ == "__main__":
    main()
