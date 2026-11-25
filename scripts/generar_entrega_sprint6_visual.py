#!/usr/bin/env python3
"""Entrega visual Sprint 6: Word (objetivo, HU, tareas, pantallazos) + PowerPoint."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from docx import Document  # noqa: E402
from docx.enum.text import WD_ALIGN_PARAGRAPH  # noqa: E402
from docx.shared import Cm, Pt  # noqa: E402
from pptx import Presentation  # noqa: E402
from pptx.dml.color import RGBColor as PptRGB  # noqa: E402
from pptx.enum.shapes import MSO_SHAPE  # noqa: E402
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR  # noqa: E402
from pptx.util import Inches as PptInches, Pt as PptPt  # noqa: E402

import generar_docs_entrega_polish as P  # noqa: E402

ROOT = Path("/workspace/docs/entrega-sprint6")
IMG = ROOT / "imagenes"
ART = Path("/opt/cursor/artifacts")
OUT_DOC = ROOT / "05_ENTREGA_SPRINT6_OBJETIVO_HU_PANTALLAZOS.docx"
OUT_PPT = ROOT / "MILA_Sprint6_Requerimientos_HU.pptx"

INK = PptRGB(0x0E, 0x1C, 0x2F)
SEA = PptRGB(0x0D, 0x94, 0x88)
SEA_DEEP = PptRGB(0x0F, 0x76, 0x6E)
EMBER = PptRGB(0xEA, 0x58, 0x0C)
FOG = PptRGB(0xEE, 0xF2, 0xF6)
MIST = PptRGB(0xF8, 0xFA, 0xFC)
WHITE = PptRGB(0xFF, 0xFF, 0xFF)
MUTED = PptRGB(0x64, 0x74, 0x8B)
SOFT = PptRGB(0xCB, 0xD5, 0xE1)
SLIDE_W = PptInches(13.333)
SLIDE_H = PptInches(7.5)

URL = "https://mila-mesa-de-ayuda.vercel.app"
PO = "Michael Andrés Perdomo Murcia"
SM = "Laura Valentina Zambrano Cárcamo"
PERIOD = "Semanas 10–11 · 12/11/2026 – 25/11/2026"
CASE = "MILA-2026-00003"

STORIES = [
    {
        "id": "PB-017", "epic": "Visitas", "pts": 8, "prio": "Obligatorio",
        "role": "coordinador / especialista",
        "want": "programar, reprogramar y cancelar visitas respetando la capacidad del técnico",
        "so": "evitar solapes de agenda y sobrecarga diaria en campo",
        "status": "Hecho — verificado en producción",
        "ac": [
            "Formulario de visita con técnico, fecha/hora, dirección y notas.",
            "Detección de conflicto si ya hay visita en la misma ventana del técnico.",
            "Agenda semanal por técnico con capacidad diaria visible.",
            "Acciones de reprogramar y cancelar sobre visitas programadas.",
        ],
        "shots": ["01_especialista_programar_visita.png", "02_visita_programada_reprogramar_cancelar.png",
                  "03_conflicto_agenda.png", "04_agenda_semanal_coordinador.png"],
        "evidence": f"Caso {CASE}: visita 27/11/2026 10:00; conflicto al intentar segunda visita; agenda /especialista/agenda.",
    },
    {
        "id": "PB-018", "epic": "Campo", "pts": 5, "prio": "Obligatorio",
        "role": "técnico de campo",
        "want": "consultar el detalle completo del caso asignado",
        "so": "llegar a la visita con antecedentes, IA, visitas y datos del cliente",
        "status": "Hecho — verificado en producción",
        "ac": [
            "Bandeja del técnico con casos asignados (/especialista?vista=mios).",
            "Detalle con descripción, cliente, análisis IA, escalamiento y visitas.",
            "Antecedentes del mismo cliente (casos previos y cierres).",
            "Acción «Iniciar atención» para pasar a EN_ATENCION.",
        ],
        "shots": ["05_tecnico_bandeja.png", "06_tecnico_detalle_antecedentes.png"],
        "evidence": "Técnico Omar Oriente 1: bandeja y detalle con antecedentes MILA-2026-00002/00004.",
    },
    {
        "id": "PB-019", "epic": "Cierre", "pts": 8, "prio": "Obligatorio",
        "role": "técnico de campo",
        "want": "registrar el cierre con actividades, diagnóstico, solución y resultado",
        "so": "dejar evidencia operativa del trabajo realizado en sitio",
        "status": "Hecho — verificado en producción",
        "ac": [
            "Resultado tipado: RESUELTO / PENDIENTE / NUEVA_VISITA / ESCALADO.",
            "Campos obligatorios: actividades, diagnóstico y solución.",
            "Campos extendidos: tiempo, recibido por, repuestos, recomendaciones, conformidad.",
            "El caso pasa a CERRADA (o estado coherente) y se notifica al cliente.",
        ],
        "shots": ["07_tecnico_cierre_extendido_evidencias.png", "08_cierre_registrado_con_evidencias.png"],
        "evidence": f"{CASE} cerrado RESUELTO; 45 min; recibido por Ana Gómez; cliente conforme.",
    },
    {
        "id": "PB-020", "epic": "Evidencias", "pts": 5, "prio": "Obligatorio",
        "role": "técnico de campo",
        "want": "adjuntar evidencias fotográficas al cierre de la visita",
        "so": "soportar el resultado con prueba visual del trabajo en campo",
        "status": "Hecho — verificado en producción",
        "ac": [
            "Hasta 4 imágenes en el formulario de cierre.",
            "Almacenadas en BD (Attachment.closureId / mimeType / data).",
            "Visibles en el detalle del caso y en el formato de cierre.",
            "Descarga controlada por sesión (/api/attachments/[id]).",
        ],
        "shots": ["07_tecnico_cierre_extendido_evidencias.png", "08_cierre_registrado_con_evidencias.png",
                  "09_formato_cierre_imprimible.png"],
        "evidence": "2 evidencias (evidencia_equipo.png, evidencia_instalacion.png) asociadas al cierre.",
    },
    {
        "id": "PB-021", "epic": "Cierre", "pts": 5, "prio": "Deseable",
        "role": "coordinador / técnico",
        "want": "consultar un formato de cierre ampliado e imprimible",
        "so": "entregar o archivar el acta del servicio con todos los campos del cierre",
        "status": "Hecho — verificado en producción",
        "ac": [
            "Vista /especialista/casos/[id]/cierre con datos del servicio.",
            "Incluye actividades, diagnóstico, solución, repuestos y recomendaciones.",
            "Lista visitas del caso y miniaturas de evidencias fotográficas.",
            "Botón «Imprimir / guardar PDF» para exportación.",
        ],
        "shots": ["09_formato_cierre_imprimible.png"],
        "evidence": f"Formato de cierre de {CASE} con evidencias y botón de impresión.",
    },
]

TASKS = [
    ("PB-017", "Modelo Visit + reglas de capacidad/conflicto", "Michael", "Hecho"),
    ("PB-017", "UI programar / reprogramar / cancelar + agenda semanal", "Michael", "Hecho"),
    ("PB-018", "Bandeja del técnico y detalle con antecedentes", "Michael", "Hecho"),
    ("PB-019", "API y formulario de cierre con outcomes tipados", "Michael", "Hecho"),
    ("PB-020", "Adjuntos de evidencias en BD y descarga autenticada", "Michael", "Hecho"),
    ("PB-021", "Vista imprimible de cierre ampliado", "Michael", "Hecho"),
    ("QA", "Verificación en producción + pantallazos reales", "Equipo", "Hecho"),
    ("Docs", "Word y PowerPoint de entrega académica", "Equipo", "Hecho"),
]

SHOTS = [
    ("01_especialista_programar_visita.png", "PB-017", "Detalle del caso con panel de visitas y capacidad del técnico."),
    ("02_visita_programada_reprogramar_cancelar.png", "PB-017", "Visita programada con controles de reprogramar / cancelar."),
    ("03_conflicto_agenda.png", "PB-017", "Conflicto de agenda: rechazo de segunda visita en la misma ventana."),
    ("04_agenda_semanal_coordinador.png", "PB-017", "Agenda semanal del coordinador con capacidad por técnico."),
    ("05_tecnico_bandeja.png", "PB-018", "Bandeja del técnico con casos asignados."),
    ("06_tecnico_detalle_antecedentes.png", "PB-018", "Detalle del técnico: antecedentes, IA y visitas."),
    ("07_tecnico_cierre_extendido_evidencias.png", "PB-019 / 020 / 021", "Formulario de cierre extendido con 2 evidencias cargadas."),
    ("08_cierre_registrado_con_evidencias.png", "PB-019 / 020", "Cierre registrado con evidencias visibles en el caso."),
    ("09_formato_cierre_imprimible.png", "PB-021 / 020", "Formato de cierre imprimible con evidencias."),
    ("10_cliente_caso_cerrado_notificaciones.png", "PB-019", "Vista del cliente: caso cerrado y notificaciones."),
]


def picture(doc, name, width_cm=15.2):
    path = IMG / name
    if not path.exists():
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Cm(width_cm))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    P.style_run(cap.add_run(name), size=8.5, color=P.MUTED, italic=True)


def build_docx() -> None:
    doc = Document()
    P.setup_doc(doc, "MILA · Entrega Sprint 6")
    P.cover(
        doc,
        eyebrow="DOCUMENTO DE ENTREGA ACADÉMICA",
        title="Sprint 6 — Visitas, atención en campo y cierre",
        subtitle="Objetivo, historias PB-017 a PB-021, tareas y evidencias visuales",
        meta_lines=[
            "Equipo 1",
            f"Product Owner: {PO}",
            f"Scrum Master: {SM}",
            PERIOD,
            f"App verificada: {URL}",
            f"Caso de evidencia en producción: {CASE}",
        ],
    )

    P.section_title(doc, "1.", "Objetivo del sprint")
    P.para(
        doc,
        "Completar el ciclo operativo de mesa de ayuda en campo: programar visitas sin conflictos de agenda, "
        "dar al técnico el contexto completo del caso, registrar el cierre con resultado tipado y evidencias "
        "fotográficas, y generar un formato de cierre ampliado e imprimible.",
        justify=True, after=8,
    )
    P.para(
        doc,
        "Meta de demostración: un caso escalado recibe visita programada, el técnico inicia atención, cierra con "
        "evidencias y el cliente ve el caso cerrado. Verificado en la aplicación pública el 25/11/2026.",
        bold=True, size=10.5, justify=True, after=10,
    )
    P.table(doc, ["Campo", "Detalle"], [
        ["Proyecto", "MILA — Mesa Inteligente de Logística y Atención"],
        ["Sprint", "Sprint 6 (semanas 10–11)"],
        ["Periodo", "12/11/2026 – 25/11/2026"],
        ["Compromiso", "31 puntos · 5 historias (PB-017 a PB-021)"],
        ["Estado global", "Hecho — verificado en producción"],
        ["Aplicación pública", URL],
        ["Caso de evidencia", CASE],
    ])

    P.section_title(doc, "2.", "Historias de usuario comprometidas")
    P.table(
        doc,
        ["ID", "Épica", "Historia (resumen)", "Pts", "Estado"],
        [
            [s["id"], s["epic"],
             f"Como {s['role']} quiero {s['want']}",
             str(s["pts"]), s["status"]]
            for s in STORIES
        ],
        status_col=4,
    )

    P.section_title(doc, "3.", "Criterios de aceptación y estado por historia")
    for s in STORIES:
        P.subsection(doc, f"{s['id']} · Como {s['role']} quiero {s['want']}")
        P.para(doc, f"Para {s['so']}. Estado: {s['status']}.", size=10.5, italic=True, after=6)
        P.table(doc, ["#", "Criterio de aceptación"],
                [[str(i + 1), ac] for i, ac in enumerate(s["ac"])])
        P.para(doc, f"Evidencia en producción: {s['evidence']}", size=9.5, color=P.MUTED, italic=True, after=8)

    P.section_title(doc, "4.", "Tareas del sprint")
    P.table(doc, ["Historia", "Tarea", "Responsable", "Estado"],
            [[t[0], t[1], t[2], t[3]] for t in TASKS], status_col=3)

    P.section_title(doc, "5.", "Resumen de pantallazos (producción)")
    P.para(
        doc,
        f"Las capturas se tomaron el 25/11/2026 directamente desde {URL} (no desde un entorno local). "
        f"Caso principal de evidencia: {CASE}.",
        justify=True, size=10.5, after=8,
    )
    P.table(doc, ["Archivo", "HU", "Qué demuestra"], [[n, h, d] for n, h, d in SHOTS])

    P.section_title(doc, "6.", "Evidencias visuales")
    for i, (name, hu, desc) in enumerate(SHOTS, 1):
        P.subsection(doc, f"6.{i} {hu}")
        P.para(doc, desc, size=10.5, justify=True, after=6)
        picture(doc, name)

    P.section_title(doc, "7.", "Confirmación de cumplimiento")
    P.table(doc, ["ID", "Estado", "Confirmación"], [
        ["PB-017", "Hecho", "Visita programada, conflicto de agenda y agenda semanal verificados en producción."],
        ["PB-018", "Hecho", "Bandeja y detalle del técnico con antecedentes e IA verificados."],
        ["PB-019", "Hecho", "Cierre RESUELTO con actividades, diagnóstico, solución y conformidad."],
        ["PB-020", "Hecho", "2 evidencias fotográficas asociadas al cierre y visibles en formato."],
        ["PB-021", "Hecho", "Formato de cierre ampliado con impresión/PDF y evidencias."],
    ], status_col=1)

    P.para(doc, "— Fin del documento —", size=9, color=P.MUTED, center=True, before=14)
    doc.save(OUT_DOC)
    (ART / OUT_DOC.name).write_bytes(OUT_DOC.read_bytes())
    print("ok", OUT_DOC.name, OUT_DOC.stat().st_size)


def set_run_font(run, name="Calibri", size=18, bold=False, color=INK):
    run.font.name = name
    run.font.size = PptPt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    try:
        rPr = run._r.get_or_add_rPr()
        latin = rPr.get_or_add_latin()
        latin.typeface = name
        ea = rPr.get_or_add_ea()
        ea.typeface = name
        cs = rPr.get_or_add_cs()
        cs.typeface = name
    except Exception:
        pass


def add_rect(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    return shape


def add_round(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    try:
        shape.adjustments[0] = 0.12
    except Exception:
        pass
    return shape


def add_text(slide, x, y, w, h, lines, *, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, font="Calibri"):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    first = True
    for item in lines:
        text, st = item if isinstance(item, tuple) else (item, {})
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = st.get("align", align)
        p.space_before = PptPt(st.get("before", 0))
        p.space_after = PptPt(st.get("after", 4))
        run = p.add_run()
        run.text = text
        set_run_font(run, name=st.get("font", font), size=st.get("size", size),
                     bold=st.get("bold", bold), color=st.get("color", color))
    return box


def add_image(slide, path: Path, x, y, w, h=None):
    if not path.exists():
        return
    if h is None:
        slide.shapes.add_picture(str(path), x, y, width=w)
    else:
        slide.shapes.add_picture(str(path), x, y, width=w, height=h)


def slide_chrome(slide, *, dark=False, number=None, total=13):
    if dark:
        add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, INK)
        add_rect(slide, PptInches(8.8), 0, PptInches(4.6), SLIDE_H, SEA_DEEP)
        tri = slide.shapes.add_shape(MSO_SHAPE.RIGHT_TRIANGLE, PptInches(7.2), 0, PptInches(1.7), SLIDE_H)
        tri.fill.solid()
        tri.fill.fore_color.rgb = SEA_DEEP
        tri.line.fill.background()
        tri.rotation = 180
    else:
        add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, MIST)
        add_rect(slide, 0, 0, PptInches(0.18), SLIDE_H, SEA)
        add_rect(slide, 0, SLIDE_H - PptInches(0.45), SLIDE_W, PptInches(0.45), FOG)
        add_text(slide, PptInches(0.45), SLIDE_H - PptInches(0.38), PptInches(8), PptInches(0.3),
                 [("MILA · Sprint 6 · Equipo 1 · TS5C", {"size": 10, "color": MUTED})])
        if number is not None:
            add_text(slide, PptInches(11.6), SLIDE_H - PptInches(0.38), PptInches(1.4), PptInches(0.3),
                     [(f"{number:02d} / {total:02d}", {"size": 10, "color": MUTED, "align": PP_ALIGN.RIGHT})],
                     align=PP_ALIGN.RIGHT)


def build_pptx() -> None:
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    total = 13
    n = [0]

    def next_num():
        n[0] += 1
        return n[0]

    # 1 Cover
    s = prs.slides.add_slide(blank)
    next_num()
    slide_chrome(s, dark=True)
    add_round(s, PptInches(0.7), PptInches(1.45), PptInches(1.55), PptInches(0.42), EMBER)
    add_text(s, PptInches(0.85), PptInches(1.5), PptInches(1.4), PptInches(0.35),
             [("SPRINT 6", {"size": 12, "bold": True, "color": WHITE})])
    add_text(s, PptInches(0.7), PptInches(2.15), PptInches(7.8), PptInches(1.3),
             [("MILA", {"size": 72, "bold": True, "color": WHITE, "font": "Georgia", "after": 0})])
    add_text(s, PptInches(0.7), PptInches(3.5), PptInches(7.8), PptInches(1.3),
             [
                 ("Mesa Inteligente de Logística y Atención", {"size": 22, "color": FOG, "after": 10}),
                 ("Visitas, atención en campo y cierre · PB-017 → PB-021", {"size": 16, "color": SOFT}),
             ])
    add_text(s, PptInches(0.7), PptInches(5.55), PptInches(7.2), PptInches(1),
             [
                 ("Diseño de Software II · TS5C", {"size": 14, "color": SOFT, "after": 4}),
                 (f"Equipo 1 · PO: {PO}", {"size": 15, "color": WHITE, "bold": True}),
             ])
    add_round(s, PptInches(9.15), PptInches(2.35), PptInches(3.55), PptInches(3.35), INK)
    add_rect(s, PptInches(9.15), PptInches(2.35), PptInches(0.12), PptInches(3.35), EMBER)
    add_text(s, PptInches(9.5), PptInches(2.65), PptInches(3.0), PptInches(2.8),
             [
                 ("En este sprint", {"size": 13, "bold": True, "color": EMBER, "after": 14}),
                 ("Agenda y capacidad", {"size": 15, "color": WHITE, "after": 10}),
                 ("Detalle del técnico", {"size": 15, "color": WHITE, "after": 10}),
                 ("Cierre con resultado", {"size": 15, "color": WHITE, "after": 10}),
                 ("Evidencias fotográficas", {"size": 15, "color": WHITE, "after": 10}),
                 ("Formato de cierre", {"size": 15, "color": WHITE, "after": 10}),
             ])

    # 2 Objetivo
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.55),
             [("Objetivo del sprint", {"size": 32, "bold": True, "font": "Georgia"})])
    add_text(s, PptInches(0.55), PptInches(0.95), PptInches(12), PptInches(0.55),
             [("Cerrar el ciclo en campo: visita programada → atención → cierre con evidencias.",
               {"size": 16, "color": MUTED})])
    cards = [
        ("01", "Agenda", "Programar visitas sin solapes ni sobrecarga del técnico."),
        ("02", "Campo", "El técnico ve el caso completo y registra el cierre."),
        ("03", "Evidencia", "Fotos + formato imprimible del servicio prestado."),
    ]
    for i, (code, title, body) in enumerate(cards):
        x = PptInches(0.55 + i * 4.15)
        add_round(s, x, PptInches(1.9), PptInches(3.9), PptInches(3.85), WHITE)
        add_rect(s, x, PptInches(1.9), PptInches(3.9), PptInches(0.14), SEA if i < 2 else EMBER)
        add_text(s, x + PptInches(0.35), PptInches(2.3), PptInches(3.2), PptInches(0.55),
                 [(code, {"size": 30, "bold": True, "color": SEA if i < 2 else EMBER, "font": "Georgia"})])
        add_text(s, x + PptInches(0.35), PptInches(3.1), PptInches(3.2), PptInches(0.45),
                 [(title, {"size": 22, "bold": True, "color": INK})])
        add_text(s, x + PptInches(0.35), PptInches(3.75), PptInches(3.2), PptInches(1.5),
                 [(body, {"size": 15, "color": MUTED})])

    # 3 Mapa backlog
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.5),
             [("Mapa del backlog Sprint 6", {"size": 32, "bold": True, "font": "Georgia"})])
    items = [
        ("PB-017", "Visitas", "Programar visita con control de cupo", "8 pts", SEA),
        ("PB-018", "Campo", "Detalle completo para el técnico", "5 pts", EMBER),
        ("PB-019", "Cierre", "Actividades, diagnóstico y resultado", "8 pts", SEA),
        ("PB-020", "Evidencias", "Fotos asociadas al cierre", "5 pts", EMBER),
        ("PB-021", "Formato", "Cierre ampliado e imprimible", "5 pts", SEA),
    ]
    for i, (code, tag, title, pts, accent) in enumerate(items):
        y = PptInches(1.1 + i * 1.05)
        add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(0.92), WHITE)
        add_rect(s, PptInches(0.55), y, PptInches(0.14), PptInches(0.92), accent)
        add_text(s, PptInches(0.95), y + PptInches(0.25), PptInches(1.7), PptInches(0.45),
                 [(code, {"size": 18, "bold": True, "color": accent})])
        add_round(s, PptInches(2.8), y + PptInches(0.26), PptInches(2.15), PptInches(0.4), FOG)
        add_text(s, PptInches(2.95), y + PptInches(0.3), PptInches(1.9), PptInches(0.35),
                 [(tag, {"size": 12, "bold": True, "color": INK})])
        add_text(s, PptInches(5.2), y + PptInches(0.28), PptInches(5.4), PptInches(0.45),
                 [(title, {"size": 16, "color": INK})])
        add_text(s, PptInches(10.9), y + PptInches(0.28), PptInches(1.5), PptInches(0.45),
                 [(pts, {"size": 14, "bold": True, "color": MUTED, "align": PP_ALIGN.RIGHT})],
                 align=PP_ALIGN.RIGHT)

    # 4-8 HU slides
    for story in STORIES:
        s = prs.slides.add_slide(blank)
        num = next_num()
        slide_chrome(s, number=num, total=total)
        accent = SEA if story["pts"] >= 8 else EMBER
        add_round(s, PptInches(0.55), PptInches(0.35), PptInches(1.7), PptInches(0.45), accent)
        add_text(s, PptInches(0.7), PptInches(0.4), PptInches(1.5), PptInches(0.35),
                 [(story["id"], {"size": 14, "bold": True, "color": WHITE})])
        add_text(s, PptInches(2.5), PptInches(0.38), PptInches(8), PptInches(0.45),
                 [("Historia de usuario", {"size": 14, "color": MUTED})])
        add_round(s, PptInches(10.4), PptInches(0.35), PptInches(2.35), PptInches(0.45), FOG)
        add_text(s, PptInches(10.55), PptInches(0.4), PptInches(2.1), PptInches(0.35),
                 [(f"{story['pts']} pts · Hecho", {"size": 12, "bold": True, "color": SEA})])
        add_round(s, PptInches(0.55), PptInches(1.05), PptInches(12.2), PptInches(2.15), WHITE)
        add_text(s, PptInches(0.9), PptInches(1.2), PptInches(11.5), PptInches(1.9),
                 [
                     (f"Como {story['role']}", {"size": 15, "color": MUTED, "after": 6}),
                     (f"quiero {story['want']}", {"size": 20, "bold": True, "color": INK, "after": 8}),
                     (f"para {story['so']}", {"size": 15, "color": MUTED}),
                 ])
        add_text(s, PptInches(0.55), PptInches(3.45), PptInches(12), PptInches(0.35),
                 [("Criterios de aceptación", {"size": 15, "bold": True, "color": INK})])
        for i, c in enumerate(story["ac"]):
            y = PptInches(3.9 + i * 0.55)
            add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(0.48), FOG if i % 2 == 0 else WHITE)
            add_text(s, PptInches(0.85), y + PptInches(0.08), PptInches(11.6), PptInches(0.35),
                     [(f"▸  {c}", {"size": 13, "color": INK})])

    # 9 Evidencias PB-017 (2 shots)
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.28), PptInches(12), PptInches(0.45),
             [("Evidencia · PB-017 Visitas y capacidad", {"size": 26, "bold": True, "font": "Georgia"})])
    add_text(s, PptInches(0.55), PptInches(0.75), PptInches(12), PptInches(0.35),
             [(f"Producción · {CASE} · conflicto de agenda y agenda semanal", {"size": 13, "color": MUTED})])
    add_image(s, IMG / "03_conflicto_agenda.png", PptInches(0.45), PptInches(1.2), PptInches(6.2))
    add_image(s, IMG / "04_agenda_semanal_coordinador.png", PptInches(6.8), PptInches(1.2), PptInches(6.0))

    # 10 Evidencias PB-018
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.28), PptInches(12), PptInches(0.45),
             [("Evidencia · PB-018 Detalle del técnico", {"size": 26, "bold": True, "font": "Georgia"})])
    add_text(s, PptInches(0.55), PptInches(0.75), PptInches(12), PptInches(0.35),
             [("Bandeja del técnico y detalle con antecedentes e IA", {"size": 13, "color": MUTED})])
    add_image(s, IMG / "05_tecnico_bandeja.png", PptInches(0.45), PptInches(1.2), PptInches(6.2))
    add_image(s, IMG / "06_tecnico_detalle_antecedentes.png", PptInches(6.8), PptInches(1.2), PptInches(6.0))

    # 11 Evidencias PB-019/020
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.28), PptInches(12), PptInches(0.45),
             [("Evidencia · PB-019 / PB-020 Cierre y evidencias", {"size": 26, "bold": True, "font": "Georgia"})])
    add_text(s, PptInches(0.55), PptInches(0.75), PptInches(12), PptInches(0.35),
             [("Formulario de cierre extendido con 2 fotografías y cierre registrado", {"size": 13, "color": MUTED})])
    add_image(s, IMG / "07_tecnico_cierre_extendido_evidencias.png", PptInches(0.45), PptInches(1.2), PptInches(6.2))
    add_image(s, IMG / "08_cierre_registrado_con_evidencias.png", PptInches(6.8), PptInches(1.2), PptInches(6.0))

    # 12 Evidencia PB-021
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.28), PptInches(12), PptInches(0.45),
             [("Evidencia · PB-021 Formato de cierre ampliado", {"size": 26, "bold": True, "font": "Georgia"})])
    add_text(s, PptInches(0.55), PptInches(0.75), PptInches(12), PptInches(0.35),
             [("Vista imprimible con actividades, solución, visitas y miniaturas de evidencias",
               {"size": 13, "color": MUTED})])
    add_image(s, IMG / "09_formato_cierre_imprimible.png", PptInches(1.8), PptInches(1.15), PptInches(9.6))

    # 13 Cierre
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.5),
             [("Estado de cumplimiento", {"size": 32, "bold": True, "font": "Georgia"})])
    rows = [
        ("PB-017", "Visitas con cupo", "Hecho"),
        ("PB-018", "Detalle del técnico", "Hecho"),
        ("PB-019", "Cierre y resultado", "Hecho"),
        ("PB-020", "Evidencias fotográficas", "Hecho"),
        ("PB-021", "Formato de cierre", "Hecho"),
    ]
    for i, (code, title, st) in enumerate(rows):
        y = PptInches(1.15 + i * 0.85)
        add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(0.72), WHITE)
        add_rect(s, PptInches(0.55), y, PptInches(0.14), PptInches(0.72), SEA)
        add_text(s, PptInches(0.95), y + PptInches(0.18), PptInches(1.7), PptInches(0.4),
                 [(code, {"size": 16, "bold": True, "color": SEA})])
        add_text(s, PptInches(2.9), y + PptInches(0.18), PptInches(6), PptInches(0.4),
                 [(title, {"size": 16, "color": INK})])
        add_round(s, PptInches(10.3), y + PptInches(0.16), PptInches(2.1), PptInches(0.4), FOG)
        add_text(s, PptInches(10.45), y + PptInches(0.2), PptInches(1.9), PptInches(0.35),
                 [(st, {"size": 13, "bold": True, "color": SEA})])
    add_text(s, PptInches(0.55), PptInches(5.6), PptInches(12), PptInches(0.7),
             [
                 (f"Verificado en {URL}", {"size": 13, "color": MUTED, "after": 2}),
                 (f"Caso de evidencia: {CASE} · capturas del 25/11/2026", {"size": 13, "color": MUTED}),
             ])

    prs.save(OUT_PPT)
    (ART / OUT_PPT.name).write_bytes(OUT_PPT.read_bytes())
    print("ok", OUT_PPT.name, OUT_PPT.stat().st_size)


def refresh_existing_guide() -> None:
    """Regenera la guía 03 con los pantallazos nuevos de producción."""
    import generar_docs_sprint6_entrega as G
    G.build_guide()
    print("ok regeneró 03_GUIA")


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)
    (ART / "entrega-sprint6").mkdir(parents=True, exist_ok=True)
    for png in IMG.glob("*.png"):
        (ART / "entrega-sprint6" / png.name).write_bytes(png.read_bytes())
    build_docx()
    build_pptx()
    refresh_existing_guide()
    # también copiar plan/tareas ya existentes a artifacts
    for name in [
        "01_PLAN_SPRINT6_MILA.docx",
        "02_SPRINT_BACKLOG_Y_TAREAS_SPRINT6.docx",
        "03_GUIA_PANTALLAZOS_Y_ENTREGA_SPRINT6.docx",
        "04_BACKLOG_PRODUCTO_ACTUALIZADO_SPRINT6.docx",
        OUT_DOC.name,
        OUT_PPT.name,
    ]:
        src = ROOT / name
        if src.exists():
            (ART / name).write_bytes(src.read_bytes())
            print("artifact", name, src.stat().st_size)


if __name__ == "__main__":
    main()
