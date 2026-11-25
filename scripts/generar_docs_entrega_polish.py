#!/usr/bin/env python3
"""Genera Word académicos pulidos: guía pantallazos + backlog actualizado."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path("/workspace/docs/entrega-sprint5")
ART = Path("/opt/cursor/artifacts")
OUT_GUIDE = ROOT / "03_GUIA_PANTALLAZOS_Y_ENTREGA_SPRINT5.docx"
OUT_BACKLOG = ROOT / "04_BACKLOG_PRODUCTO_ACTUALIZADO_MILA.docx"

INK = RGBColor(0x12, 0x1A, 0x24)
SEA = RGBColor(0x0F, 0x76, 0x6E)
MUTED = RGBColor(0x5B, 0x6B, 0x7C)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LINE = "D7DEE7"
TODAY = date.today().strftime("%d de %B de %Y").replace(
    "January", "enero"
).replace("February", "febrero").replace("March", "marzo").replace(
    "April", "abril"
).replace("May", "mayo").replace("June", "junio").replace(
    "July", "julio"
).replace("August", "agosto").replace("September", "septiembre").replace(
    "October", "octubre"
).replace("November", "noviembre").replace("December", "diciembre")


def shade(cell, hex_color: str) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def borders(cell, color: str = LINE) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "6")
        el.set(qn("w:color"), color)
        tcBorders.append(el)
    tcPr.append(tcBorders)


def set_cell_margins(cell, twips: int = 60) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement("w:tcMar")
    for m in ("top", "left", "bottom", "right"):
        node = OxmlElement(f"w:{m}")
        node.set(qn("w:w"), str(twips))
        node.set(qn("w:type"), "dxa")
        tcMar.append(node)
    tcPr.append(tcMar)


def style_run(run, *, size=11, bold=False, color=INK, font="Calibri", italic=False):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:ascii"), font)
    rFonts.set(qn("w:hAnsi"), font)


def add_page_number(paragraph) -> None:
    run = paragraph.add_run()
    style_run(run, size=9, color=MUTED)
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1)
    run._r.append(instr)
    run._r.append(fld2)


def setup_doc(doc: Document, footer_left: str) -> None:
    for section in doc.sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.2)
        section.right_margin = Cm(2.2)
        section.different_first_page_header_footer = True

        # First page footer empty
        section.first_page_footer.is_linked_to_previous = False
        section.first_page_footer.paragraphs[0].text = ""

        footer = section.footer
        footer.is_linked_to_previous = False
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r1 = fp.add_run(footer_left + "    ·    p. ")
        style_run(r1, size=9, color=MUTED)
        add_page_number(fp)


def para(
    doc,
    text,
    *,
    size=11,
    bold=False,
    color=INK,
    after=8,
    before=0,
    center=False,
    justify=False,
    font="Calibri",
    italic=False,
):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.line_spacing = 1.15
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif justify:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    style_run(run, size=size, bold=bold, color=color, font=font, italic=italic)
    return p


def rule(doc) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(10)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "12")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), "0F766E")
    pBdr.append(bottom)
    pPr.append(pBdr)


def section_title(doc, number: str, title: str) -> None:
    t = doc.add_table(rows=1, cols=1)
    cell = t.rows[0].cells[0]
    shade(cell, "121A24")
    set_cell_margins(cell, 80)
    cell.text = ""
    p = cell.paragraphs[0]
    r = p.add_run(f"{number}  {title}")
    style_run(r, size=13, bold=True, color=WHITE, font="Georgia")
    doc.add_paragraph().paragraph_format.space_after = Pt(6)


def subsection(doc, text: str) -> None:
    para(doc, text, size=12, bold=True, color=SEA, before=10, after=6, font="Georgia")


def cover(
    doc,
    *,
    eyebrow: str,
    title: str,
    subtitle: str,
    meta_lines: list[str],
) -> None:
    for _ in range(2):
        doc.add_paragraph()
    para(doc, "ASIGNATURA", size=10, bold=True, color=SEA, center=True, after=2)
    para(doc, "Diseño de Software II (TS5C)", size=12, color=MUTED, center=True, after=18)
    rule(doc)
    para(doc, eyebrow, size=11, bold=True, color=SEA, center=True, after=8)
    para(doc, "MILA", size=36, bold=True, color=INK, center=True, font="Georgia", after=4)
    para(
        doc,
        "Mesa Inteligente de Logística y Atención",
        size=14,
        color=MUTED,
        center=True,
        after=14,
    )
    para(doc, title, size=18, bold=True, color=INK, center=True, font="Georgia", after=6)
    para(doc, subtitle, size=11, color=MUTED, center=True, italic=True, after=20)
    rule(doc)
    for line in meta_lines:
        para(doc, line, size=11, color=INK, center=True, after=4)
    para(doc, f"Fecha de corte: {TODAY}", size=10, color=MUTED, center=True, before=16, after=4)
    doc.add_page_break()


def table(doc, headers: list[str], rows: list[list[str]], status_col: int | None = None) -> None:
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.autofit = True
    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        shade(cell, "0F766E")
        set_cell_margins(cell, 55)
        borders(cell, "0F766E")
        cell.text = ""
        r = cell.paragraphs[0].add_run(h)
        style_run(r, size=9, bold=True, color=WHITE)
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = t.rows[ri + 1].cells[ci]
            fill = "FFFFFF" if ri % 2 else "F4F7F8"
            if status_col is not None and ci == status_col:
                v = str(val)
                if v.startswith("Hecho"):
                    fill = "E8F8F2"
                elif "curso" in v.lower() or v.startswith("Parcial"):
                    fill = "FFF8E8"
                elif v.startswith("Pendiente"):
                    fill = "FDECEC"
            shade(cell, fill)
            set_cell_margins(cell, 50)
            borders(cell)
            cell.text = ""
            r = cell.paragraphs[0].add_run(str(val))
            style_run(r, size=9, color=INK, bold=(ci == 0))
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(8)


def bullet(doc, text: str) -> None:
    p = doc.add_paragraph(style=None)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.left_indent = Cm(0.4)
    r = p.add_run(f"•  {text}")
    style_run(r, size=10.5, color=INK)


def build_guide() -> None:
    doc = Document()
    setup_doc(doc, "MILA · Guía de pantallazos y entrega · Sprint 5")
    cover(
        doc,
        eyebrow="DOCUMENTO DE ENTREGA ACADÉMICA",
        title="Guía de pantallazos y alcance de la entrega",
        subtitle="Relación entre evidencias visuales e historias de usuario PB-012 a PB-016",
        meta_lines=[
            "Equipo 1",
            "Product Owner: Michael Andrés Perdomo Murcia",
            "Sprint 5 — Escalamiento y asignación de técnico",
        ],
    )

    section_title(doc, "1.", "Objeto del documento")
    para(
        doc,
        "Este documento explica, con criterio académico, qué entrega el Sprint 5 de MILA, cómo se interpretan los pantallazos como evidencia de aceptación y qué demuestra cada conjunto de capturas. Complementa el anexo visual 02_EVIDENCIAS_PANTALLAZOS_MILA.docx y la presentación de historias de usuario.",
        justify=True,
        after=10,
    )

    section_title(doc, "2.", "Qué entrega el Sprint 5")
    para(
        doc,
        "El objetivo del sprint es cerrar el ciclo operativo de la mesa de ayuda hasta la asignación de un técnico de campo: el cliente registra el caso, el sistema apoya el diagnóstico remoto, el especialista gestiona estados y escalamiento, y el técnico recibe el caso en su bandeja.",
        justify=True,
        after=8,
    )
    table(
        doc,
        ["ID", "Épica", "Historia (resumen)", "Evidencia principal"],
        [
            ["PB-012", "Estados", "Cambiar el estado del caso según el flujo", "Detalle especialista"],
            ["PB-013", "Escalamiento", "Escalar a visita con motivo registrado", "Acción de escalar"],
            ["PB-014", "Técnicos", "Registrar técnicos, zonas y capacidad", "Consola de técnicos"],
            ["PB-015", "Asignación", "Recomendar técnicos por zona/skills/carga", "Recomendaciones en detalle"],
            ["PB-016", "Asignación", "Asignar técnico a solicitud escalada", "Bandeja del técnico"],
        ],
    )
    para(
        doc,
        "La demo incluye, además, capacidades de sprints previos necesarias para sustentación: autenticación por rol, alta de solicitudes, prediagnóstico con agente IA, línea de tiempo y modelo de datos (PostgreSQL/Prisma; DDL MySQL académico).",
        justify=True,
        size=10.5,
        color=MUTED,
        after=10,
    )

    section_title(doc, "3.", "Paquete de entrega")
    table(
        doc,
        ["Entregable", "Descripción"],
        [
            ["01 Documentación de BD", "Creación, diccionario de datos y DER"],
            ["PowerPoint HU", "Requerimientos e historias PB-012…PB-016"],
            ["02 Evidencias pantallazos", "Anexo visual del flujo extremo a extremo"],
            ["03 Esta guía", "Explicación académica pantallazos ↔ HU"],
            ["04 Backlog actualizado", "Estado real del Product Backlog"],
            ["Carpeta imagenes/", "Capturas individuales numeradas"],
        ],
    )
    para(doc, "Aplicación de referencia: https://suport-mila.apps.grok.bot", size=10, color=MUTED, after=10)

    section_title(doc, "4.", "Relación pantallazos ↔ historias de usuario")
    para(
        doc,
        "Los pantallazos constituyen evidencia de aceptación. Se organizan por actor (cliente → especialista → técnico) y mantienen el hilo del mismo caso de demostración.",
        justify=True,
        after=8,
    )
    table(
        doc,
        ["Conjunto", "Capturas", "HU / criterio que evidencia"],
        [
            ["A. Acceso y portal cliente", "01–03", "Precondición de demo: login por rol y portal cliente"],
            ["B. Alta de caso + IA", "04–08b", "Registro y prediagnóstico remoto previo al alta"],
            ["C. Especialista", "09–11c", "PB-012 estados; PB-013 escalar; PB-015/016 asignar"],
            ["D. Técnico", "12–14", "PB-016: recepción del caso en bandeja de campo"],
            ["E. Datos", "der_mila.png", "Soporte estructural Ticket / Assignment / Escalation"],
        ],
    )
    subsection(doc, "Caso demo")
    para(
        doc,
        "MILA-2026-00002 · «Impresora no imprime en sede Oriente» · Zona ORIENTE · Servicio Hardware / Equipos · Técnico: Omar Técnico Oriente 1 · Estado tras asignación: ASIGNADA.",
        justify=True,
        size=10.5,
        after=10,
    )

    section_title(doc, "5.", "Detalle por conjunto de pantallazos")
    blocks = [
        (
            "5.1 Conjunto A — Acceso y portal cliente",
            [
                ["01_landing.png", "Inicio MILA: marca, propuesta de valor y acceso por rol."],
                ["02_login_cliente.png", "Autenticación única (sin registro público)."],
                ["03_cliente_home.png", "Portal cliente con acción «Registrar caso»."],
            ],
        ),
        (
            "5.2 Conjunto B — Registro y prediagnóstico",
            [
                ["04_…servicio.png", "Paso 1 del wizard: tipo de servicio."],
                ["05_…zona.png", "Paso 2: sede/zona (ORIENTE)."],
                ["06_…detalle.png", "Paso 3: título, descripción y prioridad."],
                ["07 / 07b", "Paso 4: diagnóstico remoto e intentos previos al alta."],
                ["08 / 08b", "Caso creado (MILA-2026-00002) y listado «Mis casos»."],
            ],
        ),
        (
            "5.3 Conjunto C — Especialista",
            [
                ["09_login_especialista.png", "Acceso del coordinador de zona."],
                ["10_bandeja_especialista.png", "Bandeja operativa de casos."],
                ["11_detalle_caso.png", "Detalle, IA, timeline y estados (PB-012)."],
                ["11_…asignar / 11c", "Recomendación y asignación confirmada (PB-015/016)."],
            ],
        ),
        (
            "5.4 Conjunto D — Técnico",
            [
                ["12_login_tecnico.png", "Ingreso del técnico de campo."],
                ["13_bandeja_tecnico_caso.png", "Caso visible en «Asignados a mí» (evidencia PB-016)."],
                ["14_tecnico_detalle_caso.png", "Detalle operativo para el técnico."],
            ],
        ),
    ]
    for title, rows in blocks:
        subsection(doc, title)
        table(doc, ["Archivo", "Qué demuestra"], rows)

    section_title(doc, "6.", "Lectura sugerida en sustentación")
    for i, line in enumerate(
        [
            "Mostrar 01–03: producto y roles.",
            "Recorrer 04–08: creación del caso tras prediagnóstico.",
            "Exponer 10–11c: operación especialista (PB-012…016).",
            "Cerrar con 13–14: el técnico ya tiene el caso.",
            "Si preguntan datos: DER + documento 01 de base de datos.",
        ],
        1,
    ):
        bullet(doc, f"{i}. {line}")
    para(
        doc,
        "Criterio de éxito: hilo continuo del mismo caso desde el portal cliente hasta la bandeja del técnico, sin saltos de identidad ni de zona.",
        bold=True,
        size=10.5,
        before=10,
        after=12,
        justify=True,
    )

    section_title(doc, "7.", "Cierre")
    para(
        doc,
        "La evidencia fotográfica del Sprint 5 no sustituye al backlog ni a la documentación de datos: la complementa. Juntas permiten verificar alcance, trazabilidad y aceptación de PB-012 a PB-016.",
        justify=True,
        after=8,
    )
    para(doc, "— Fin del documento —", size=9, color=MUTED, center=True, before=16)
    doc.save(OUT_GUIDE)


def build_backlog() -> None:
    STATUS = {
        "PB-001": ("Hecho*", "Login por rol; registro público deshabilitado (cuentas provisionadas)."),
        "PB-002": ("Hecho", "Roles CLIENTE/TECNICO/COORDINADOR/ADMIN con control en API y UI."),
        "PB-003": ("Hecho", "Wizard cliente: servicio → zona → detalle → diagnóstico → alta."),
        "PB-004": ("Hecho", "Adjuntos de imagen con descarga controlada."),
        "PB-005": ("Hecho", "Número MILA-AAAA-##### y timestamps."),
        "PB-006": ("Hecho", "Mis casos + detalle con estado y timeline."),
        "PB-007": ("Hecho", "Análisis IA al crear caso (local u OpenAI)."),
        "PB-008": ("Hecho", "Resumen, ambigüedades, recomendaciones y prioridad sugerida."),
        "PB-009": ("Hecho", "Prediagnóstico remoto en wizard (hasta 4 intentos)."),
        "PB-010": ("Hecho", "Revisión ACEPTADO/MODIFICADO/RECHAZADO."),
        "PB-011": ("Hecho", "Persistencia AiAnalysis + eventos de timeline."),
        "PB-012": ("Hecho — Sprint 5", "Cambio de estado tipado en especialista."),
        "PB-013": ("Hecho — Sprint 5", "Escalamiento con motivo y registro Escalation."),
        "PB-014": ("Hecho — Sprint 5", "Perfiles técnicos / zonas / capacidad."),
        "PB-015": ("Hecho — Sprint 5", "Recomendaciones con score zona/skills/carga."),
        "PB-016": ("Hecho — Sprint 5", "Asignación, notificación y bandeja del técnico."),
        "PB-017": ("Hecho — Sprint 6", "Visitas con capacidad y conflictos de agenda."),
        "PB-018": ("Hecho — Sprint 6", "Consulta de antecedentes/visitas/IA por técnico."),
        "PB-019": ("Hecho — Sprint 6", "Cierre con actividades, diagnóstico y solución."),
        "PB-020": ("Hecho — Sprint 6", "Outcomes RESUELTO/PENDIENTE/NUEVA_VISITA/ESCALADO."),
        "PB-021": ("Hecho — Sprint 6", "Evidencias fotográficas en el cierre (hasta 4 imágenes)."),
        "PB-022": ("Parcial — Sprint 7", "Timeline en detalle; falta vista global avanzada."),
        "PB-023": ("Parcial — Sprint 7", "Webhook n8n + AutomationLog."),
        "PB-024": ("Parcial — Sprint 7", "IA en app; orquestación n8n opcional."),
        "PB-025": ("Parcial — Sprint 7", "Notificaciones in-app; faltan canales externos."),
        "PB-026": ("Parcial — Sprint 7", "Logs n8n/IA en consola de operación."),
        "PB-027": ("Pendiente — Sprint 7", "Reportes por periodo/estado/zona."),
        "PB-028": ("Pendiente — Sprint 7", "Métricas de tiempos de atención."),
        "PB-029": ("Hecho", "bcrypt, cookie httpOnly, CSRF, rate limits, secretos fuera del repo."),
        "PB-030": ("Parcial", "Pruebas de flujo/demo; suite formal pendiente."),
        "PB-031": ("Parcial", "Documentación n8n y plantilla de workflow."),
        "PB-032": ("En curso", "Despliegue público permanente; estabilizar secretos/semilla y cierre académico."),
        "PB-033": ("Hecho", "Next.js + Prisma/PostgreSQL + n8n + agente IA."),
        "PB-034": ("Hecho", "Schema Prisma + DDL MySQL; Visit/Closure en Sprint 6."),
    }
    ITEMS = [
        ("PB-001", "Usuarios y acceso", "Registro / inicio de sesión por rol", "Obligatorio", "5", "Sprint 2"),
        ("PB-002", "Usuarios y acceso", "Gestión de roles y permisos", "Obligatorio", "5", "Sprint 2"),
        ("PB-029", "Seguridad", "Protección de credenciales y datos sensibles", "Obligatorio", "5", "Sprint 2"),
        ("PB-033", "Arquitectura", "Arquitectura base y entorno", "Obligatorio", "5", "Sprint 2"),
        ("PB-034", "Base de datos", "Modelo de datos inicial", "Obligatorio", "8", "Sprint 2"),
        ("PB-003", "Solicitudes", "Registrar solicitud con datos del incidente", "Obligatorio", "8", "Sprint 3"),
        ("PB-004", "Solicitudes", "Adjuntar evidencias", "Deseable", "5", "Sprint 3"),
        ("PB-005", "Solicitudes", "Generar identificador y marca temporal", "Obligatorio", "3", "Sprint 3"),
        ("PB-006", "Solicitudes", "Consultar mis solicitudes y estado", "Obligatorio", "5", "Sprint 3"),
        ("PB-031", "Documentación", "Documentar instalación y operación", "Deseable", "5", "Sprint 3"),
        ("PB-032", "Cierre / Deploy", "Versión integrada y demostración", "Obligatorio", "8", "Sprint 3/7"),
        ("PB-007", "Agente IA", "Enviar solicitud a análisis IA", "Obligatorio", "5", "Sprint 4"),
        ("PB-008", "Agente IA", "Identificar problema, ambigüedades y causas", "Obligatorio", "8", "Sprint 4"),
        ("PB-009", "Agente IA", "Mostrar recomendaciones de diagnóstico remoto", "Obligatorio", "5", "Sprint 4"),
        ("PB-010", "Agente IA", "Revisar/aceptar/modificar/rechazar recomendaciones", "Obligatorio", "5", "Sprint 4"),
        ("PB-011", "Agente IA", "Registrar análisis para trazabilidad", "Obligatorio", "5", "Sprint 4"),
        ("PB-012", "Estados", "Cambiar estado del caso", "Obligatorio", "5", "Sprint 5"),
        ("PB-013", "Escalamiento", "Escalar caso con motivo", "Obligatorio", "5", "Sprint 5"),
        ("PB-014", "Técnicos", "Registrar técnicos, zonas y capacidad", "Obligatorio", "8", "Sprint 5"),
        ("PB-015", "Asignación", "Recomendaciones de técnicos", "Obligatorio", "8", "Sprint 5"),
        ("PB-016", "Asignación", "Asignar técnico a solicitud escalada", "Obligatorio", "5", "Sprint 5"),
        ("PB-017", "Visitas", "Programar visita sin conflictos", "Obligatorio", "8", "Sprint 6"),
        ("PB-018", "Visitas", "Consultar antecedentes antes de desplazarse", "Obligatorio", "5", "Sprint 6"),
        ("PB-019", "Cierre", "Registrar actividades, diagnóstico y solución", "Obligatorio", "8", "Sprint 6"),
        ("PB-020", "Cierre", "Registrar resultado del servicio", "Obligatorio", "5", "Sprint 6"),
        ("PB-021", "Cierre", "Adjuntar evidencias y formato de cierre", "Deseable", "5", "Sprint 6"),
        ("PB-022", "Trazabilidad", "Consultar línea de tiempo del caso", "Obligatorio", "5", "Sprint 7"),
        ("PB-023", "n8n", "Activar flujo n8n al registrar solicitud", "Obligatorio", "5", "Sprint 7"),
        ("PB-024", "n8n", "Enviar caso a IA y actualizar resultado", "Obligatorio", "8", "Sprint 7"),
        ("PB-025", "Notificaciones", "Notificar actores según eventos", "Obligatorio", "5", "Sprint 7"),
        ("PB-026", "Observabilidad", "Consultar errores de automatización", "Deseable", "5", "Sprint 7"),
        ("PB-027", "Reportes", "Consultar solicitudes por filtros", "Obligatorio", "8", "Sprint 7"),
        ("PB-028", "Reportes", "Consultar tiempos de atención", "Deseable", "5", "Sprint 7"),
        ("PB-030", "QA", "Pruebas funcionales e integración", "Obligatorio", "8", "Sprint 7"),
    ]

    doc = Document()
    setup_doc(doc, "MILA · Product Backlog actualizado")
    cover(
        doc,
        eyebrow="PRODUCT BACKLOG — CORTE DE ESTADO",
        title="Backlog de producto actualizado",
        subtitle="Sprint 5 y Sprint 6 entregados · proyección Sprint 7",
        meta_lines=[
            "Equipo 1",
            "Product Owner: Michael Andrés Perdomo Murcia",
            "Fuente: Product Backlog 13 semanas (actualizado con estado real de MILA)",
        ],
    )

    section_title(doc, "1.", "Resumen ejecutivo")
    para(
        doc,
        "Este corte actualiza el estado del Product Backlog para entrega académica. Sustituye etiquetas genéricas («Pendiente» / «En desarrollo») por el estado observado en la implementación de MILA al momento del corte.",
        justify=True,
        after=8,
    )
    table(
        doc,
        ["Bloque", "IDs", "Estado global", "Lectura"],
        [
            ["Fundamentos (S2)", "001, 002, 029, 033, 034", "Hecho*", "Auth por rol y modelo base"],
            ["Solicitudes (S3)", "003–006", "Hecho", "Alta, adjuntos y consulta"],
            ["Agente IA (S4)", "007–011", "Hecho", "Incluye revisión humana"],
            ["Escalamiento (S5)", "012–016", "Hecho — entregado", "Ciclo hasta técnico asignado"],
            ["Visitas / cierre (S6)", "017–021", "Hecho — por aceptar", "Incluye evidencias de cierre (021)"],
            ["Trazab. / n8n / reportes (S7)", "022–028, 030", "Parcial / Pendiente", "Timeline, emit n8n, avisos in-app"],
        ],
        status_col=2,
    )
    para(
        doc,
        "*PB-001: la aceptación se cubre con autenticación por rol; el registro libre se omitió por seguridad operativa (cuentas provisionadas).",
        size=9.5,
        color=MUTED,
        italic=True,
        after=10,
    )

    section_title(doc, "2.", "Sprint 5 — entregado")
    para(
        doc,
        "Objetivo cumplido: el técnico de campo recibe el caso. Evidencia académica en docs/entrega-sprint5/ (pantallazos, guía 03 y PPT de HU).",
        justify=True,
        after=8,
    )
    table(
        doc,
        ["ID", "Historia", "Pts", "Estado", "Ubicación / evidencia"],
        [
            ["PB-012", "Cambiar estado del caso", "5", "Hecho — Sprint 5", "Consola especialista"],
            ["PB-013", "Escalar con motivo", "5", "Hecho — Sprint 5", "Escalation + timeline"],
            ["PB-014", "Registrar técnicos / zonas", "8", "Hecho — Sprint 5", "/especialista/tecnicos"],
            ["PB-015", "Recomendaciones de técnicos", "8", "Hecho — Sprint 5", "Score zona/skills/carga"],
            ["PB-016", "Asignar técnico", "5", "Hecho — Sprint 5", "Bandeja del técnico"],
        ],
        status_col=3,
    )

    section_title(doc, "3.", "Sprint 6 — entregado (por aceptar)")
    para(
        doc,
        "Embarcado: visitas con control de agenda, atención en campo, cierre tipado con evidencias fotográficas, revisión de IA y notificaciones in-app (porción inicial). Pendiente: aceptación formal del Product Owner en la Sprint Review.",
        justify=True,
        after=8,
    )
    table(
        doc,
        ["ID", "Historia", "Pts", "Estado", "Avance"],
        [
            ["PB-017", "Programar visita sin conflictos", "8", "Hecho — Sprint 6", "API /visits + UI"],
            ["PB-018", "Consultar antecedentes", "5", "Hecho — Sprint 6", "Detalle técnico"],
            ["PB-019", "Registrar actividades y solución", "8", "Hecho — Sprint 6", "Closure + /close"],
            ["PB-020", "Registrar resultado del servicio", "5", "Hecho — Sprint 6", "ClosureOutcome"],
            ["PB-021", "Evidencias / formato de cierre", "5", "Hecho — Sprint 6", "Attachment.closureId"],
        ],
        status_col=3,
    )

    section_title(doc, "4.", "Backlog completo actualizado")
    rows = []
    for pid, epic, story, prio, pts, sprint in ITEMS:
        st, note = STATUS[pid]
        rows.append([pid, epic, story, f"{prio} · {pts} · {sprint}", st, note])
    table(
        doc,
        ["ID", "Épica", "Historia / trabajo", "Prioridad", "Estado", "Notas"],
        rows,
        status_col=4,
    )

    section_title(doc, "5.", "Leyenda de estados")
    bullet(doc, "Hecho: funcionalidad usable y alineada al criterio principal de aceptación.")
    bullet(doc, "En curso: modelo/API/UI parcial; falta cerrar el criterio completo.")
    bullet(doc, "Parcial: existe una porción útil, pero no el alcance íntegro del ítem.")
    bullet(doc, "Pendiente: no iniciado o reservado para sprints posteriores.")

    section_title(doc, "6.", "Entregables vinculados")
    bullet(doc, "01 Documentación de base de datos")
    bullet(doc, "PowerPoint de requerimientos e HU Sprint 5")
    bullet(doc, "02 Evidencias de pantallazos")
    bullet(doc, "03 Guía de pantallazos y entrega")
    bullet(doc, "04 Este backlog actualizado")
    para(
        doc,
        "Fuente histórica: Product Backlog 13 semanas. Este documento es el corte de estado para sustentación.",
        size=9.5,
        color=MUTED,
        before=10,
        after=8,
        italic=True,
    )
    para(doc, "— Fin del documento —", size=9, color=MUTED, center=True, before=12)
    doc.save(OUT_BACKLOG)


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    build_guide()
    build_backlog()
    for src in (OUT_GUIDE, OUT_BACKLOG):
        dest = ART / src.name
        dest.write_bytes(src.read_bytes())
        print("ok", src.name, src.stat().st_size, "->", dest)


if __name__ == "__main__":
    main()
