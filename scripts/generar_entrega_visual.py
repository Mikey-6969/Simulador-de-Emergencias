#!/usr/bin/env python3
"""Genera PPT y Word presentables para la entrega Sprint 5 MILA."""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn, nsmap
from docx.shared import Cm, Inches, Pt, RGBColor
from pptx import Presentation
from pptx.dml.color import RGBColor as PptRGB
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Emu, Inches as PptInches, Pt as PptPt

ROOT = Path("/workspace/docs/entrega-sprint5")
IMG = ROOT / "imagenes"
OUT_PPT = ROOT / "MILA_Sprint5_Requerimientos_HU.pptx"
OUT_DOC = ROOT / "02_EVIDENCIAS_PANTALLAZOS_MILA.docx"
ART = Path("/opt/cursor/artifacts")

# Palette — ink + sea + ember (readable, not purple/cream/broadsheet)
INK = PptRGB(0x0E, 0x1C, 0x2F)
SEA = PptRGB(0x0D, 0x94, 0x88)
SEA_DEEP = PptRGB(0x0F, 0x76, 0x6E)
EMBER = PptRGB(0xEA, 0x58, 0x0C)
FOG = PptRGB(0xEE, 0xF2, 0xF6)
MIST = PptRGB(0xF8, 0xFA, 0xFC)
WHITE = PptRGB(0xFF, 0xFF, 0xFF)
MUTED = PptRGB(0x64, 0x74, 0x8B)
SOFT = PptRGB(0xCB, 0xD5, 0xE1)

DOC_INK = RGBColor(0x0E, 0x1C, 0x2F)
DOC_SEA = RGBColor(0x0D, 0x94, 0x88)
DOC_EMBER = RGBColor(0xEA, 0x58, 0x0C)
DOC_MUTED = RGBColor(0x64, 0x74, 0x8B)

SLIDE_W = PptInches(13.333)
SLIDE_H = PptInches(7.5)


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


def add_rect(slide, x, y, w, h, fill, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
    return shape


def add_round(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    # softer corners
    try:
        shape.adjustments[0] = 0.12
    except Exception:
        pass
    return shape


def add_text(slide, x, y, w, h, lines, *, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, font="Calibri", valign=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    try:
        tf._txBody.bodyPr.set("anchor", {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[valign])
    except Exception:
        pass
    first = True
    for item in lines:
        if isinstance(item, tuple):
            text, st = item
        else:
            text, st = item, {}
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = st.get("align", align)
        p.space_before = PptPt(st.get("before", 0))
        p.space_after = PptPt(st.get("after", 4))
        run = p.add_run()
        run.text = text
        set_run_font(
            run,
            name=st.get("font", font),
            size=st.get("size", size),
            bold=st.get("bold", bold),
            color=st.get("color", color),
        )
    return box


def slide_chrome(slide, *, dark=False, number=None, total=12):
    if dark:
        add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, INK)
        # diagonal wash
        add_rect(slide, PptInches(8.8), 0, PptInches(4.6), SLIDE_H, SEA_DEEP)
        tri = slide.shapes.add_shape(
            MSO_SHAPE.RIGHT_TRIANGLE,
            PptInches(7.2),
            0,
            PptInches(1.7),
            SLIDE_H,
        )
        tri.fill.solid()
        tri.fill.fore_color.rgb = SEA_DEEP
        tri.line.fill.background()
        tri.rotation = 180
    else:
        add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, MIST)
        add_rect(slide, 0, 0, PptInches(0.18), SLIDE_H, SEA)
        add_rect(slide, 0, SLIDE_H - PptInches(0.45), SLIDE_W, PptInches(0.45), FOG)
        add_text(
            slide,
            PptInches(0.45),
            SLIDE_H - PptInches(0.38),
            PptInches(8),
            PptInches(0.3),
            [("MILA · Sprint 5 · Equipo 1 · TS5C", {"size": 10, "color": MUTED, "bold": False})],
        )
        if number is not None:
            add_text(
                slide,
                PptInches(11.6),
                SLIDE_H - PptInches(0.38),
                PptInches(1.4),
                PptInches(0.3),
                [(f"{number:02d} / {total:02d}", {"size": 10, "color": MUTED, "align": PP_ALIGN.RIGHT})],
                align=PP_ALIGN.RIGHT,
            )


def build_pptx():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    total = 12

    # 1 Cover
    s = prs.slides.add_slide(blank)
    slide_chrome(s, dark=True)
    add_round(s, PptInches(0.7), PptInches(1.5), PptInches(1.35), PptInches(0.42), EMBER)
    add_text(s, PptInches(0.85), PptInches(1.55), PptInches(1.2), PptInches(0.35),
             [("SPRINT 5", {"size": 12, "bold": True, "color": WHITE})])
    add_text(s, PptInches(0.7), PptInches(2.2), PptInches(7.5), PptInches(1.4),
             [("MILA", {"size": 72, "bold": True, "color": WHITE, "font": "Georgia", "after": 0})])
    add_text(s, PptInches(0.7), PptInches(3.55), PptInches(7.8), PptInches(1.2),
             [
                 ("Mesa Inteligente de Logística y Atención", {"size": 22, "color": FOG, "after": 10}),
                 ("Requerimientos e historias de usuario PB-012 → PB-016", {"size": 16, "color": SOFT}),
             ])
    add_text(s, PptInches(0.7), PptInches(5.6), PptInches(7), PptInches(1),
             [
                 ("Diseño de Software II · TS5C", {"size": 14, "color": SOFT, "after": 2}),
                 ("Equipo 1 · PO: Michael Andrés Perdomo Murcia", {"size": 14, "color": WHITE, "bold": True}),
             ])
    add_text(s, PptInches(9.3), PptInches(2.6), PptInches(3.5), PptInches(3),
             [
                 ("Cierre operativo", {"size": 14, "bold": True, "color": WHITE, "after": 12}),
                 ("Estados · Escalamiento", {"size": 15, "color": FOG, "after": 8}),
                 ("Técnicos · Capacidad", {"size": 15, "color": FOG, "after": 8}),
                 ("Recomendación · Asignación", {"size": 15, "color": FOG, "after": 8}),
             ])

    # 2 Objetivo
    s = prs.slides.add_slide(blank)
    slide_chrome(s, number=2, total=total)
    add_text(s, PptInches(0.55), PptInches(0.35), PptInches(10), PptInches(0.5),
             [("Objetivo del sprint", {"size": 32, "bold": True, "font": "Georgia", "color": INK})])
    add_text(s, PptInches(0.55), PptInches(1.0), PptInches(12), PptInches(0.6),
             [("Cerrar el ciclo de mesa de ayuda hasta que un técnico de campo recibe el caso asignado.",
               {"size": 16, "color": MUTED})])
    cards = [
        ("01", "Backlog", "Completar PB-012 a PB-016 con criterios de aceptación claros."),
        ("02", "Operación", "Especialista gestiona estados, escalamiento y asignación."),
        ("03", "Campo", "El técnico ve el caso en su bandeja con contexto completo."),
    ]
    for i, (num, title, body) in enumerate(cards):
        x = PptInches(0.55 + i * 4.15)
        add_round(s, x, PptInches(2.0), PptInches(3.9), PptInches(3.6), WHITE)
        add_rect(s, x, PptInches(2.0), PptInches(3.9), PptInches(0.12), SEA if i < 2 else EMBER)
        add_text(s, x + PptInches(0.3), PptInches(2.35), PptInches(3.3), PptInches(0.5),
                 [(num, {"size": 28, "bold": True, "color": SEA if i < 2 else EMBER, "font": "Georgia"})])
        add_text(s, x + PptInches(0.3), PptInches(3.05), PptInches(3.3), PptInches(0.5),
                 [(title, {"size": 20, "bold": True, "color": INK})])
        add_text(s, x + PptInches(0.3), PptInches(3.65), PptInches(3.3), PptInches(1.6),
                 [(body, {"size": 14, "color": MUTED})])

    # 3 Mapa backlog
    s = prs.slides.add_slide(blank)
    slide_chrome(s, number=3, total=total)
    add_text(s, PptInches(0.55), PptInches(0.35), PptInches(12), PptInches(0.5),
             [("Mapa del backlog Sprint 5", {"size": 32, "bold": True, "font": "Georgia"})])
    items = [
        ("PB-012", "Estados", "Cambiar estado del caso", "5 pts"),
        ("PB-013", "Escalamiento", "Escalar con motivo registrado", "5 pts"),
        ("PB-014", "Técnicos", "Zonas, skills y capacidad", "8 pts"),
        ("PB-015", "Recomendación", "Score por zona / carga", "8 pts"),
        ("PB-016", "Asignación", "Confirmar técnico + aviso", "5 pts"),
    ]
    for i, (code, tag, title, pts) in enumerate(items):
        y = PptInches(1.15 + i * 1.05)
        add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(0.92), WHITE)
        add_rect(s, PptInches(0.55), y, PptInches(0.14), PptInches(0.92), SEA if i % 2 == 0 else EMBER)
        add_text(s, PptInches(0.95), y + PptInches(0.22), PptInches(1.6), PptInches(0.5),
                 [(code, {"size": 18, "bold": True, "color": SEA if i % 2 == 0 else EMBER})])
        add_round(s, PptInches(2.7), y + PptInches(0.26), PptInches(2.0), PptInches(0.4), FOG)
        add_text(s, PptInches(2.85), y + PptInches(0.3), PptInches(1.8), PptInches(0.35),
                 [(tag, {"size": 12, "bold": True, "color": INK})])
        add_text(s, PptInches(5.0), y + PptInches(0.28), PptInches(5.5), PptInches(0.45),
                 [(title, {"size": 16, "color": INK})])
        add_text(s, PptInches(11.0), y + PptInches(0.28), PptInches(1.4), PptInches(0.45),
                 [(pts, {"size": 14, "bold": True, "color": MUTED, "align": PP_ALIGN.RIGHT})],
                 align=PP_ALIGN.RIGHT)

    # Helper for HU slides
    def hu_slide(code, role, want, so_that, criteria, accent=SEA):
        s = prs.slides.add_slide(blank)
        slide_chrome(s, number=None, total=total)
        add_round(s, PptInches(0.55), PptInches(0.35), PptInches(1.7), PptInches(0.45), accent)
        add_text(s, PptInches(0.7), PptInches(0.4), PptInches(1.5), PptInches(0.35),
                 [(code, {"size": 14, "bold": True, "color": WHITE})])
        add_text(s, PptInches(2.5), PptInches(0.38), PptInches(10), PptInches(0.45),
                 [("Historia de usuario", {"size": 14, "color": MUTED})])
        add_round(s, PptInches(0.55), PptInches(1.1), PptInches(12.2), PptInches(2.35), WHITE)
        add_text(s, PptInches(0.9), PptInches(1.3), PptInches(11.5), PptInches(2.0),
                 [
                     (f"Como {role}", {"size": 15, "color": MUTED, "after": 6}),
                     (f"quiero {want}", {"size": 22, "bold": True, "color": INK, "after": 8}),
                     (f"para {so_that}", {"size": 15, "color": MUTED}),
                 ])
        add_text(s, PptInches(0.55), PptInches(3.7), PptInches(12), PptInches(0.4),
                 [("Criterios de aceptación", {"size": 16, "bold": True, "color": INK})])
        for i, c in enumerate(criteria):
            y = PptInches(4.2 + i * 0.55)
            add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(0.48), FOG if i % 2 == 0 else WHITE)
            add_text(s, PptInches(0.85), y + PptInches(0.08), PptInches(11.6), PptInches(0.35),
                     [(f"▸  {c}", {"size": 13, "color": INK})])
        return s

    hu_slide(
        "PB-012",
        "coordinador / especialista",
        "cambiar el estado del caso según el flujo de atención",
        "que el avance real quede visible para cliente, técnico y operación.",
        [
            "Estados tipados: NUEVA → análisis → escalada → asignada → atención → cerrada.",
            "El cambio queda registrado en TimelineEvent con actor y marca temporal.",
            "La consola especialista refleja el estado actual sin recargar a ciegas.",
        ],
    )
    # fix page numbers for HU slides - redo chrome numbers manually later via footer already on slide_chrome
    # Actually hu_slide called slide_chrome with number=None - update slides 4-8 numbers by rebuilding with numbers

    # Rebuild HU with numbers - delete approach: just recreate remaining slides properly
    # Remove last slide and redo - easier to rebuild whole ppt cleanly below

    prs.save(OUT_PPT)  # temporary; overwritten below
    return prs


def build_pptx_full():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    total = 12
    n = [0]

    def next_num():
        n[0] += 1
        return n[0]

    # Cover
    s = prs.slides.add_slide(blank)
    next_num()
    slide_chrome(s, dark=True)
    add_round(s, PptInches(0.7), PptInches(1.45), PptInches(1.45), PptInches(0.42), EMBER)
    add_text(s, PptInches(0.85), PptInches(1.5), PptInches(1.3), PptInches(0.35),
             [("SPRINT 5", {"size": 12, "bold": True, "color": WHITE})])
    add_text(s, PptInches(0.7), PptInches(2.15), PptInches(7.8), PptInches(1.3),
             [("MILA", {"size": 72, "bold": True, "color": WHITE, "font": "Georgia", "after": 0})])
    add_text(s, PptInches(0.7), PptInches(3.5), PptInches(7.8), PptInches(1.3),
             [
                 ("Mesa Inteligente de Logística y Atención", {"size": 22, "color": FOG, "after": 10}),
                 ("Requerimientos e historias PB-012 → PB-016", {"size": 16, "color": SOFT}),
             ])
    add_text(s, PptInches(0.7), PptInches(5.55), PptInches(7.2), PptInches(1),
             [
                 ("Diseño de Software II · TS5C", {"size": 14, "color": SOFT, "after": 4}),
                 ("Equipo 1 · PO: Michael Andrés Perdomo Murcia", {"size": 15, "color": WHITE, "bold": True}),
             ])
    add_round(s, PptInches(9.15), PptInches(2.35), PptInches(3.55), PptInches(3.35), INK)
    add_rect(s, PptInches(9.15), PptInches(2.35), PptInches(0.12), PptInches(3.35), EMBER)
    add_text(s, PptInches(9.5), PptInches(2.65), PptInches(3.0), PptInches(2.8),
             [
                 ("En este sprint", {"size": 13, "bold": True, "color": EMBER, "after": 14}),
                 ("Estados del caso", {"size": 15, "color": WHITE, "after": 10}),
                 ("Escalamiento motivado", {"size": 15, "color": WHITE, "after": 10}),
                 ("Catálogo de técnicos", {"size": 15, "color": WHITE, "after": 10}),
                 ("Recomendación IA/score", {"size": 15, "color": WHITE, "after": 10}),
                 ("Asignación a campo", {"size": 15, "color": WHITE, "after": 10}),
             ])

    # Objetivo
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.55),
             [("Objetivo del sprint", {"size": 32, "bold": True, "font": "Georgia"})])
    add_text(s, PptInches(0.55), PptInches(0.95), PptInches(12), PptInches(0.55),
             [("Llevar el caso desde el portal cliente hasta la bandeja del técnico asignado.",
               {"size": 16, "color": MUTED})])
    cards = [
        ("01", "Backlog", "Cerrar PB-012…PB-016 con criterios verificables."),
        ("02", "Operación", "Especialista controla estados, escalamiento y asignación."),
        ("03", "Campo", "El técnico recibe el caso con contexto y prioridad."),
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

    # Mapa
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.5),
             [("Mapa del backlog", {"size": 32, "bold": True, "font": "Georgia"})])
    items = [
        ("PB-012", "Estados", "Cambiar estado del caso", "5 pts", SEA),
        ("PB-013", "Escalamiento", "Escalar con motivo registrado", "5 pts", EMBER),
        ("PB-014", "Técnicos", "Zonas, skills y capacidad diaria", "8 pts", SEA),
        ("PB-015", "Recomendación", "Score por zona, skills y carga", "8 pts", EMBER),
        ("PB-016", "Asignación", "Confirmar técnico + notificación", "5 pts", SEA),
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

    hus = [
        ("PB-012", "coordinador / especialista",
         "cambiar el estado del caso según el flujo de atención",
         "que el avance real quede visible para cliente, técnico y operación.",
         [
             "Estados tipados desde NUEVA hasta CERRADA / CANCELADA.",
             "Cada transición deja rastro en TimelineEvent (actor + fecha).",
             "La consola especialista muestra el estado vigente de inmediato.",
         ], SEA),
        ("PB-013", "coordinador (y flujo cliente)",
         "escalar un caso a visita presencial con motivo registrado",
         "justificar la necesidad de atención en campo y mantener trazabilidad.",
         [
             "Motivo obligatorio (≥ 8 caracteres) al escalar.",
             "Se crea registro Escalation ligado al caso y al autor.",
             "El estado pasa a ESCALADA / pendiente de asignación.",
         ], EMBER),
        ("PB-014", "administrador / especialista",
         "registrar técnicos con zonas, capacidades y disponibilidad",
         "contar con un catálogo operable al momento de asignar visitas.",
         [
             "Perfil TechnicianProfile 1:1 con usuario TECNICO.",
             "Zonas (JSON), skills, capacityPerDay y flag available.",
             "Gestión desde /especialista/tecnicos.",
         ], SEA),
        ("PB-015", "coordinador / especialista",
         "recibir recomendaciones de técnicos según zona, skills y carga",
         "elegir al recurso más apto sin revisar el catálogo a ciegas.",
         [
             "Score por coincidencia de zona, habilidades y capacidad restante.",
             "Se muestra rationale legible junto al puntaje.",
             "Las recomendaciones quedan como Assignment RECOMENDADA.",
         ], EMBER),
        ("PB-016", "coordinador / especialista",
         "asignar un técnico a una solicitud escalada",
         "que el técnico reciba el caso y el cliente vea el avance.",
         [
             "Confirmación cambia Assignment a ASIGNADA y Ticket.assigneeId.",
             "Estado del caso → ASIGNADA; evento en timeline.",
             "Notificación in-app al técnico (y visibilidad en su bandeja).",
         ], SEA),
    ]

    for code, role, want, so_that, criteria, accent in hus:
        s = prs.slides.add_slide(blank)
        num = next_num()
        slide_chrome(s, number=num, total=total)
        add_round(s, PptInches(0.55), PptInches(0.32), PptInches(1.75), PptInches(0.42), accent)
        add_text(s, PptInches(0.72), PptInches(0.37), PptInches(1.5), PptInches(0.35),
                 [(code, {"size": 14, "bold": True, "color": WHITE})])
        add_text(s, PptInches(2.5), PptInches(0.36), PptInches(9), PptInches(0.4),
                 [("Historia de usuario", {"size": 14, "color": MUTED})])
        add_round(s, PptInches(0.55), PptInches(1.0), PptInches(12.2), PptInches(2.25), WHITE)
        add_rect(s, PptInches(0.55), PptInches(1.0), PptInches(0.14), PptInches(2.25), accent)
        add_text(s, PptInches(0.95), PptInches(1.2), PptInches(11.4), PptInches(1.9),
                 [
                     (f"Como {role}", {"size": 14, "color": MUTED, "after": 8}),
                     (f"quiero {want}", {"size": 20, "bold": True, "color": INK, "after": 10}),
                     (f"para {so_that}", {"size": 14, "color": MUTED}),
                 ])
        add_text(s, PptInches(0.55), PptInches(3.5), PptInches(12), PptInches(0.4),
                 [("Criterios de aceptación", {"size": 15, "bold": True, "color": INK})])
        for i, c in enumerate(criteria):
            y = PptInches(4.0 + i * 0.58)
            add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(0.5), WHITE if i % 2 else FOG)
            add_text(s, PptInches(0.9), y + PptInches(0.08), PptInches(11.5), PptInches(0.38),
                     [(f"▸  {c}", {"size": 13, "color": INK})])

    # Actores
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.5),
             [("Actores y consolas", {"size": 32, "bold": True, "font": "Georgia"})])
    actors = [
        ("Cliente", "/cliente", "Registra el caso, completa prediagnóstico (hasta 4 intentos) y consulta mis casos.", SEA),
        ("Especialista", "/especialista", "Bandeja por zona, estados, escalamiento, técnicos, recomendación y asignación.", EMBER),
        ("Técnico", "/especialista (filtro mío)", "Ve casos ASIGNADOS a su perfil, detalle y contexto del incidente.", SEA),
    ]
    for i, (title, route, body, accent) in enumerate(actors):
        x = PptInches(0.55 + i * 4.15)
        add_round(s, x, PptInches(1.25), PptInches(3.9), PptInches(4.5), WHITE)
        add_rect(s, x, PptInches(1.25), PptInches(3.9), PptInches(0.9), accent)
        add_text(s, x + PptInches(0.3), PptInches(1.45), PptInches(3.3), PptInches(0.55),
                 [(title, {"size": 22, "bold": True, "color": WHITE})])
        add_text(s, x + PptInches(0.3), PptInches(2.45), PptInches(3.3), PptInches(0.4),
                 [(route, {"size": 13, "bold": True, "color": accent})])
        add_text(s, x + PptInches(0.3), PptInches(3.05), PptInches(3.3), PptInches(2.2),
                 [(body, {"size": 14, "color": MUTED})])

    # Flujo demo
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.5),
             [("Flujo demo de sustentación", {"size": 32, "bold": True, "font": "Georgia"})])
    steps = [
        ("1", "Cliente", "Login → servicio → zona ORIENTE → detalle → 4 intentos IA → crea caso."),
        ("2", "Caso", "Se genera número visible (ej. MILA-2026-00002) con análisis y timeline."),
        ("3", "Especialista", "Abre bandeja zona Oriente → revisa → escala/asigna técnico."),
        ("4", "Técnico", "Login → bandeja “Asignados a mí” → abre detalle del caso."),
    ]
    for i, (nstep, title, body) in enumerate(steps):
        y = PptInches(1.15 + i * 1.25)
        add_round(s, PptInches(0.55), y, PptInches(12.2), PptInches(1.1), WHITE)
        circ = s.shapes.add_shape(MSO_SHAPE.OVAL, PptInches(0.85), y + PptInches(0.22), PptInches(0.65), PptInches(0.65))
        circ.fill.solid()
        circ.fill.fore_color.rgb = SEA if i % 2 == 0 else EMBER
        circ.line.fill.background()
        add_text(s, PptInches(0.85), y + PptInches(0.32), PptInches(0.65), PptInches(0.5),
                 [(nstep, {"size": 18, "bold": True, "color": WHITE, "align": PP_ALIGN.CENTER})],
                 align=PP_ALIGN.CENTER)
        add_text(s, PptInches(1.8), y + PptInches(0.22), PptInches(10.5), PptInches(0.7),
                 [
                     (title, {"size": 16, "bold": True, "color": INK, "after": 2}),
                     (body, {"size": 14, "color": MUTED}),
                 ])

    # RNF
    s = prs.slides.add_slide(blank)
    num = next_num()
    slide_chrome(s, number=num, total=total)
    add_text(s, PptInches(0.55), PptInches(0.32), PptInches(12), PptInches(0.5),
             [("Requisitos no funcionales", {"size": 32, "bold": True, "font": "Georgia"})])
    rnfs = [
        ("Rendimiento", "Login ≤ 1.5 s · registro ≤ 2 s · análisis IA ≤ 5 s (motor local/remoto)."),
        ("Seguridad", "JWT en cookie httpOnly, bcrypt, CSRF same-origin, rate limits."),
        ("Datos", "Prisma + PostgreSQL en runtime; DDL MySQL académico en docs/sql/mila.sql."),
        ("Observabilidad", "Timeline del caso + AutomationLog para webhooks n8n."),
    ]
    for i, (title, body) in enumerate(rnfs):
        col = i % 2
        row = i // 2
        x = PptInches(0.55 + col * 6.3)
        y = PptInches(1.2 + row * 2.4)
        add_round(s, x, y, PptInches(6.0), PptInches(2.15), WHITE)
        add_rect(s, x, y, PptInches(6.0), PptInches(0.12), SEA if col == 0 else EMBER)
        add_text(s, x + PptInches(0.35), y + PptInches(0.4), PptInches(5.3), PptInches(0.5),
                 [(title, {"size": 20, "bold": True, "color": INK})])
        add_text(s, x + PptInches(0.35), y + PptInches(1.05), PptInches(5.3), PptInches(0.85),
                 [(body, {"size": 14, "color": MUTED})])

    # Cierre
    s = prs.slides.add_slide(blank)
    next_num()
    slide_chrome(s, dark=True)
    add_text(s, PptInches(0.9), PptInches(2.2), PptInches(11), PptInches(1.2),
             [("Listos para sustentación", {"size": 40, "bold": True, "color": WHITE, "font": "Georgia", "align": PP_ALIGN.CENTER})],
             align=PP_ALIGN.CENTER)
    add_text(s, PptInches(1.5), PptInches(3.5), PptInches(10), PptInches(1.2),
             [
                 ("MILA · Equipo 1 · Sprint 5 · TS5C", {"size": 18, "color": FOG, "align": PP_ALIGN.CENTER, "after": 12}),
                 ("App: suport-mila.apps.grok.bot", {"size": 15, "color": SOFT, "align": PP_ALIGN.CENTER}),
             ],
             align=PP_ALIGN.CENTER)
    add_round(s, PptInches(5.4), PptInches(5.2), PptInches(2.5), PptInches(0.55), EMBER)
    add_text(s, PptInches(5.4), PptInches(5.3), PptInches(2.5), PptInches(0.4),
             [("Gracias", {"size": 18, "bold": True, "color": WHITE, "align": PP_ALIGN.CENTER})],
             align=PP_ALIGN.CENTER)

    prs.save(OUT_PPT)
    print("PPT saved", OUT_PPT, "slides", len(prs.slides))


# ---------- Word ----------

def shade_cell(cell, hex_color: str):
    tc = cell._tePr if hasattr(cell, "_tePr") else cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        if edge in kwargs:
            element = OxmlElement(f"w:{edge}")
            element.set(qn("w:val"), kwargs[edge].get("val", "single"))
            element.set(qn("w:sz"), str(kwargs[edge].get("sz", 4)))
            element.set(qn("w:color"), kwargs[edge].get("color", "CBD5E1"))
            tcBorders.append(element)
    tcPr.append(tcBorders)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.text = "PAGE"
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "end")
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)


def style_run(run, *, size=11, bold=False, color=DOC_INK, font="Calibri"):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    r = run._element
    rPr = r.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:ascii"), font)
    rFonts.set(qn("w:hAnsi"), font)


def para(doc, text, *, size=11, bold=False, color=DOC_INK, space_after=8, space_before=0, align="left", font="Calibri"):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run(text)
    style_run(run, size=size, bold=bold, color=color, font=font)
    return p


def add_heading_bar(doc, title, subtitle=None):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = True
    cell = table.rows[0].cells[0]
    shade_cell(cell, "0E1C2F")
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(title)
    style_run(run, size=16, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF), font="Georgia")
    if subtitle:
        p2 = cell.add_paragraph()
        run2 = p2.add_run(subtitle)
        style_run(run2, size=10, color=RGBColor(0xCB, 0xD5, 0xE1))
    doc.add_paragraph()


def info_card(doc, rows):
    table = doc.add_table(rows=len(rows), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (k, v) in enumerate(rows):
        c0, c1 = table.rows[i].cells
        shade_cell(c0, "EEF2F6" if i % 2 == 0 else "F8FAFC")
        shade_cell(c1, "FFFFFF" if i % 2 == 0 else "F8FAFC")
        c0.text = ""
        c1.text = ""
        r0 = c0.paragraphs[0].add_run(k)
        style_run(r0, size=10, bold=True, color=DOC_SEA)
        r1 = c1.paragraphs[0].add_run(v)
        style_run(r1, size=10, color=DOC_INK)
        set_cell_border(c0, top={"color": "E2E8F0"}, bottom={"color": "E2E8F0"}, left={"color": "E2E8F0"}, right={"color": "E2E8F0"})
        set_cell_border(c1, top={"color": "E2E8F0"}, bottom={"color": "E2E8F0"}, left={"color": "E2E8F0"}, right={"color": "E2E8F0"})
        c0.width = Cm(4.5)
        c1.width = Cm(12.5)
    doc.add_paragraph()


def shot_block(doc, badge, title, path: Path, caption, note=None):
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(10)
    spacer.paragraph_format.space_after = Pt(2)

    t = doc.add_table(rows=1, cols=1)
    cell = t.rows[0].cells[0]
    shade_cell(cell, "0D9488")
    cell.text = ""
    hp = cell.paragraphs[0]
    hr = hp.add_run(f"{badge}   {title}")
    style_run(hr, size=12, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))

    if path.exists():
        pic = doc.add_paragraph()
        pic.alignment = WD_ALIGN_PARAGRAPH.CENTER
        pic.paragraph_format.space_before = Pt(8)
        pic.paragraph_format.space_after = Pt(4)
        run = pic.add_run()
        run.add_picture(str(path), width=Cm(16.0))
    else:
        para(doc, f"[Imagen no encontrada: {path.name}]", color=DOC_EMBER, size=10)

    para(doc, caption, size=10, color=DOC_MUTED, space_after=4)
    if note:
        para(doc, note, size=10, bold=True, color=DOC_INK, space_after=10)


def build_docx():
    doc = Document()
    # margins
    for section in doc.sections:
        section.top_margin = Cm(1.6)
        section.bottom_margin = Cm(1.6)
        section.left_margin = Cm(1.8)
        section.right_margin = Cm(1.8)
        footer = section.footer
        footer.is_linked_to_previous = False
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        fr = fp.add_run("MILA · Sprint 5 · Evidencias  ·  p. ")
        style_run(fr, size=8, color=DOC_MUTED)
        add_page_number(fp)

    # Cover
    para(doc, "ENTREGA ACADÉMICA", size=11, bold=True, color=DOC_SEA, space_after=6, align="center")
    para(doc, "MILA", size=36, bold=True, color=DOC_INK, space_after=4, align="center", font="Georgia")
    para(doc, "Mesa Inteligente de Logística y Atención", size=14, color=DOC_MUTED, space_after=18, align="center")
    para(doc, "Evidencias de pantallazos — Sprint 5", size=16, bold=True, color=DOC_INK, space_after=6, align="center", font="Georgia")
    para(doc, "Flujo: cliente crea un caso → especialista asigna → técnico lo recibe", size=11, color=DOC_MUTED, space_after=20, align="center")

    info_card(doc, [
        ("Asignatura", "Diseño de Software II (TS5C)"),
        ("Equipo", "Equipo 1"),
        ("Product Owner", "Michael Andrés Perdomo Murcia"),
        ("Caso demo", "MILA-2026-00002 — Impresora no imprime en sede Oriente"),
        ("Zona", "ORIENTE"),
        ("App", "https://suport-mila.apps.grok.bot"),
    ])

    para(doc, "Cuentas usadas en la captura", size=12, bold=True, color=DOC_INK, space_before=4, space_after=6)
    info_card(doc, [
        ("Cliente", "cliente.oriente.01@mila.app"),
        ("Especialista", "especialista.oriente@mila.app"),
        ("Técnico", "tecnico.oriente1@mila.app  ·  Omar Técnico Oriente 1"),
        ("Contraseña demo", "MILA_DEMO_PASSWORD del entorno (no se publica en claro aquí)"),
    ])

    doc.add_page_break()
    add_heading_bar(doc, "1. Portal cliente — registro del caso", "Desde el ingreso hasta la creación con prediagnóstico IA")

    shots_client = [
        ("01", "Pantalla de inicio MILA", IMG / "01_landing.png",
         "Landing con marca MILA y acceso por rol (cliente / especialista / técnico)."),
        ("02", "Login del cliente", IMG / "02_login_cliente.png",
         "Formulario de ingreso con cuentas provisionadas por zona."),
        ("03", "Home del portal cliente", IMG / "03_cliente_home.png",
         "Dashboard del cliente con acción principal “Registrar caso”."),
        ("04", "Wizard — tipo de servicio", IMG / "04_registrar_paso_servicio.png",
         "Paso 1: selección de servicio (Hardware / Equipos en la demo)."),
        ("05", "Wizard — sede / zona", IMG / "05_registrar_paso_zona.png",
         "Paso 2: zona ORIENTE seleccionada (NORTE / SUR / ORIENTE / OCCIDENTE)."),
        ("06", "Wizard — detalle del incidente", IMG / "06_registrar_detalle.png",
         "Paso 3: título y descripción del problema de impresora."),
        ("07", "Prediagnóstico IA", IMG / "07_prediagnostico.png",
         "Paso 4: pasos de diagnóstico remoto sugeridos por el agente."),
        ("07b", "Intentos de diagnóstico", IMG / "07b_prediagnostico_intentos.png",
         "Se completan hasta 4 intentos fallidos antes de permitir crear el caso."),
        ("08", "Caso creado", IMG / "08_caso_creado.png",
         "Confirmación con número MILA-2026-00002, prioridad sugerida y resumen IA.",
         "✔ Evidencia clave: el cliente logró crear el caso."),
        ("08b", "Mis casos", IMG / "08b_mis_casos.png",
         "El caso aparece en el listado del cliente."),
    ]
    for item in shots_client:
        badge, title, path, caption = item[:4]
        note = item[4] if len(item) > 4 else None
        shot_block(doc, badge, title, path, caption, note)

    doc.add_page_break()
    add_heading_bar(doc, "2. Especialista — bandeja y asignación", "Zona Oriente: revisión del caso y asignación a técnico")

    for item in [
        ("09", "Login especialista", IMG / "09_login_especialista.png",
         "Acceso del coordinador/especialista de la zona Oriente."),
        ("10", "Bandeja del especialista", IMG / "10_bandeja_especialista.png",
         "Listado de casos de la zona; incluye el caso recién creado."),
        ("11", "Detalle del caso", IMG / "11_detalle_caso.png",
         "Vista de detalle con contexto, timeline y acciones operativas."),
        ("11b", "Asignación de técnico", IMG / "11_detalle_caso_asignar.png",
         "UI de recomendación/asignación hacia el técnico de campo."),
        ("11c", "Después de asignar", IMG / "11c_despues_asignar.png",
         "Estado actualizado tras confirmar la asignación (ASIGNADA).",
         "✔ Evidencia clave: el especialista asignó el caso."),
    ]:
        badge, title, path, caption = item[:4]
        note = item[4] if len(item) > 4 else None
        shot_block(doc, badge, title, path, caption, note)

    doc.add_page_break()
    add_heading_bar(doc, "3. Técnico — recepción del caso", "El técnico de Oriente ve el caso en su bandeja personal")

    for item in [
        ("12", "Login técnico", IMG / "12_login_tecnico.png",
         "Ingreso del técnico Omar Técnico Oriente 1."),
        ("13", "Bandeja del técnico", IMG / "13_bandeja_tecnico_caso.png",
         "Sección “Asignados a mí” con MILA-2026-00002 visible.",
         "✔ Evidencia clave: el técnico recibió el caso."),
        ("14", "Detalle en vista técnico", IMG / "14_tecnico_detalle_caso.png",
         "Detalle operativo del caso asignado (cliente, zona, servicio, estado)."),
    ]:
        badge, title, path, caption = item[:4]
        note = item[4] if len(item) > 4 else None
        shot_block(doc, badge, title, path, caption, note)

    doc.add_page_break()
    add_heading_bar(doc, "4. Diagrama entidad-relación", "Modelo de datos usado por el flujo de casos y asignación")
    para(doc, "El DER resume User, Ticket, TechnicianProfile, Assignment, Escalation, AiAnalysis y timeline.",
         size=11, color=DOC_MUTED, space_after=10)
    der = IMG / "der_mila.png"
    if der.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(der), width=Cm(16.0))
    para(doc, "Fuente: documentación de BD (Prisma / PostgreSQL) incluida en la entrega.", size=9, color=DOC_MUTED, align="center")

    para(doc, "Resumen de verificación", size=14, bold=True, color=DOC_INK, space_before=18, space_after=8, font="Georgia")
    info_card(doc, [
        ("Caso creado", "MILA-2026-00002"),
        ("Cliente", "Cliente ORIENTE 01"),
        ("Técnico receptor", "Omar Técnico Oriente 1"),
        ("Estado final capturado", "ASIGNADA"),
        ("PB cubiertos en el flujo", "PB-012…PB-016 (estados, escalamiento/asignación, técnicos)"),
    ])

    doc.save(OUT_DOC)
    print("DOCX saved", OUT_DOC, "size", OUT_DOC.stat().st_size)


def main():
    build_pptx_full()
    build_docx()
    # publish artifacts
    ART.mkdir(parents=True, exist_ok=True)
    for src, name in [
        (OUT_PPT, "MILA_Sprint5_Requerimientos_HU.pptx"),
        (OUT_DOC, "02_EVIDENCIAS_PANTALLAZOS_MILA.docx"),
    ]:
        dest = ART / name
        dest.write_bytes(src.read_bytes())
        print("artifact", dest, dest.stat().st_size)
    # also folder copies
    folder = ART / "entrega-sprint5"
    folder.mkdir(exist_ok=True)
    (folder / OUT_PPT.name).write_bytes(OUT_PPT.read_bytes())
    (folder / OUT_DOC.name).write_bytes(OUT_DOC.read_bytes())
    # refresh zip
    import zipfile
    zip_path = ART / "MILA_Sprint5_Entrega_Completa.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in [
            ROOT / "01_DOCUMENTACION_BASE_DE_DATOS.md",
            OUT_PPT,
            OUT_DOC,
            ROOT / "README_ENTREGA.md",
        ]:
            if p.exists():
                z.write(p, arcname=f"entrega-sprint5/{p.name}")
        if IMG.exists():
            for img in sorted(IMG.glob("*")):
                if img.is_file():
                    z.write(img, arcname=f"entrega-sprint5/imagenes/{img.name}")
    print("zip", zip_path, zip_path.stat().st_size)


if __name__ == "__main__":
    main()
