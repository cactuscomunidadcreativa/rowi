#!/usr/bin/env python3
"""Genera el Plan Ejecutivo Rowi 10/10 en PDF."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    HRFlowable, ListFlowable, ListItem,
)

# ---- Paleta ----
INK = colors.HexColor("#1A1A2E")
ACCENT = colors.HexColor("#5B4FE0")      # violeta Rowi
ACCENT2 = colors.HexColor("#00B894")     # verde
DANGER = colors.HexColor("#E74C3C")
AMBER = colors.HexColor("#E29A2D")
MUTE = colors.HexColor("#6B7280")
LIGHT = colors.HexColor("#F3F2FB")
LINE = colors.HexColor("#D9D7EC")

styles = getSampleStyleSheet()

def S(name, **kw):
    styles.add(ParagraphStyle(name=name, **kw))

S("Cover", fontName="Helvetica-Bold", fontSize=30, leading=35, textColor=INK)
S("CoverSub", fontName="Helvetica", fontSize=13, leading=19, textColor=MUTE)
S("CoverTag", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=ACCENT)
S("H1", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=INK,
  spaceBefore=18, spaceAfter=6)
S("H2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=ACCENT,
  spaceBefore=12, spaceAfter=4)
S("Body", fontName="Helvetica", fontSize=9.8, leading=14.5, textColor=INK,
  alignment=TA_JUSTIFY, spaceAfter=5)
S("BodyL", fontName="Helvetica", fontSize=9.8, leading=14.5, textColor=INK,
  alignment=TA_LEFT, spaceAfter=5)
S("Small", fontName="Helvetica", fontSize=8.3, leading=11.5, textColor=MUTE)
S("Kicker", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=ACCENT2)
S("Cell", fontName="Helvetica", fontSize=8.6, leading=11.5, textColor=INK)
S("CellB", fontName="Helvetica-Bold", fontSize=8.6, leading=11.5, textColor=INK)
S("CellW", fontName="Helvetica-Bold", fontSize=8.6, leading=11.5, textColor=colors.white)

def hr(c=LINE, w=0.8, sb=4, sa=8):
    return HRFlowable(width="100%", thickness=w, color=c, spaceBefore=sb, spaceAfter=sa)

def bullets(items, style="Body"):
    return ListFlowable(
        [ListItem(Paragraph(t, styles[style]), leftIndent=8, value="•") for t in items],
        bulletType="bullet", start="•", leftIndent=10, bulletColor=ACCENT,
    )

def chip(text, bg):
    t = Table([[Paragraph(f'<font color="white"><b>{text}</b></font>', styles["Cell"])]],
              colWidths=[2.0*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2),
        ("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    return t

story = []

# ============ PORTADA ============
story.append(Spacer(1, 3.2*cm))
story.append(Paragraph("ROWI · SIA", styles["CoverTag"]))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Plan Ejecutivo a 10/10", styles["Cover"]))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph("Protección de datos · Campaña de marketing · Roadmap de producto",
                       styles["CoverSub"]))
story.append(Spacer(1, 0.6*cm))
story.append(hr(ACCENT, 2, 0, 10))
story.append(Paragraph(
    "Documento para fundadores e inversionistas. Basado en una auditoría de 14 fases "
    "verificada contra el código real del repositorio y el sitio en producción "
    "(www.rowiia.com), no contra suposiciones. Cada afirmación técnica lleva su "
    "veredicto: verificada, parcial o descartada.", styles["Body"]))
story.append(Spacer(1, 0.3*cm))
meta = Table([
    ["Fecha", "5 de junio de 2026"],
    ["Producto", "Rowi — Social Interaction Algorithm (SIA)"],
    ["Stack", "Next.js 16 · Prisma · Postgres (Neon) · Vercel · Six Seconds"],
    ["Go-live", "EQ Day — 6 de junio de 2026 (cohorte controlada)"],
    ["Autor", "Auditoría técnica verificada"],
], colWidths=[3.2*cm, 11.5*cm])
meta.setStyle(TableStyle([
    ("FONT",(0,0),(0,-1),"Helvetica-Bold",9),
    ("FONT",(1,0),(1,-1),"Helvetica",9),
    ("TEXTCOLOR",(0,0),(0,-1),ACCENT),
    ("TEXTCOLOR",(1,0),(1,-1),INK),
    ("BOTTOMPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),5),
    ("LINEBELOW",(0,0),(-1,-2),0.4,LINE),
]))
story.append(meta)
story.append(PageBreak())

# ============ 0. RESUMEN EJECUTIVO ============
story.append(Paragraph("0 · Resumen ejecutivo", styles["H1"]))
story.append(hr())
story.append(Paragraph(
    "Rowi tiene una tesis fuerte y una infraestructura sorprendentemente sólida. La auditoría "
    "externa que motivó este trabajo erró en su propio terreno técnico: cerca del 60% de sus "
    "hallazgos P0/P1 describían código que ya había sido migrado (home server-side, robots/sitemap, "
    "CSRF, webhook). Sin embargo, no detectó el único riesgo verdaderamente caro:", styles["Body"]))
story.append(Spacer(1, 0.15*cm))

box = Table([[Paragraph(
    "<b>Hallazgo P0 real (ya resuelto en esta sesión):</b> 600 MB de datos de benchmark "
    "Six Seconds —incluido un CSV «anonymized full unfiltered»— se servían sin autenticación "
    "desde <b>public/</b>, descargables por cualquiera en www.rowiia.com. Era una fuga de "
    "nuestro activo de datos más valioso y un riesgo GDPR.", styles["BodyL"])]],
    colWidths=[14.7*cm])
box.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#FDECEA")),
    ("BOX",(0,0),(-1,-1),1,DANGER),
    ("LEFTPADDING",(0,0),(-1,-1),10),("RIGHTPADDING",(0,0),(-1,-1),10),
    ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
]))
story.append(box)
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph(
    "<b>Estado tras esta sesión:</b> la fuga está cerrada. public/ pasó de 616 MB a 10 MB. "
    "Se confirmó que los archivos nunca se commitearon a git (cero blobs &gt;5 MB en todo el "
    "historial), por lo que no hay nada publicado que purgar. Los datos viven ahora en "
    "almacenamiento privado como «semilla del benchmark».", styles["Body"]))
story.append(Spacer(1, 0.15*cm))

verdict = Table([
    [Paragraph("<b>Veredicto de lanzamiento</b>", styles["CellW"]),
     Paragraph("<b>Recomendación</b>", styles["CellW"])],
    [Paragraph("Lanzamiento masivo (100k) mañana", styles["Cell"]),
     Paragraph("<b>No.</b> Faltan 2 P0 reales y endurecimiento de auth.", styles["Cell"])],
    [Paragraph("Cohorte controlada EQ Day (6-jun)", styles["Cell"]),
     Paragraph("<b>Sí</b>, con los P0 cerrados. La arquitectura aguanta una cohorte.", styles["Cell"])],
], colWidths=[7.0*cm, 7.7*cm])
verdict.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),ACCENT),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT]),
    ("GRID",(0,0),(-1,-1),0.4,LINE),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
    ("LEFTPADDING",(0,0),(-1,-1),8),
]))
story.append(verdict)
story.append(PageBreak())

# ============ 1. PROTECCIÓN DE DATOS ============
story.append(Paragraph("1 · Protección de datos — el plan que nos lleva a 10/10", styles["H1"]))
story.append(hr())
story.append(Paragraph("1.1 · Lo que ya se hizo en esta sesión", styles["H2"]))
done = Table([
    [Paragraph("✓", styles["CellB"]), Paragraph(
        "<b>Datasets fuera de public/.</b> SOH (291 MB + 307 MB), TP Assessments (7.3 MB) y "
        "CSVs reales movidos a <b>data/seed/</b> (privado). public/: 616 MB → 10 MB.", styles["Cell"])],
    [Paragraph("✓", styles["CellB"]), Paragraph(
        "<b>Historial verificado limpio.</b> Cero blobs &gt;5 MB en todo el árbol git. "
        "Nunca se publicaron. No requiere reescritura de historial ni force-push.", styles["Cell"])],
    [Paragraph("✓", styles["CellB"]), Paragraph(
        "<b>.gitignore blindado.</b> Regla explícita <b>/data/seed/</b> además del "
        "*.csv / *.xlsx ya existente.", styles["Cell"])],
    [Paragraph("✓", styles["CellB"]), Paragraph(
        "<b>Loader de semilla</b> (src/lib/benchmark/seedSource.ts): resuelve los datasets "
        "desde almacenamiento privado con <i>fail-closed</i> — nunca cae a una fuente pública.", styles["Cell"])],
    [Paragraph("✓", styles["CellB"]), Paragraph(
        "<b>Script de carga</b> (scripts/upload-benchmark-seed.ts) y referencia de import "
        "actualizada. TypeScript compila limpio (tsc exit 0, strict).", styles["Cell"])],
], colWidths=[0.8*cm, 13.9*cm])
done.setStyle(TableStyle([
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("TEXTCOLOR",(0,0),(0,-1),ACCENT2),
    ("FONT",(0,0),(0,-1),"Helvetica-Bold",11),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LINEBELOW",(0,0),(-1,-2),0.3,LINE),
]))
story.append(done)
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("1.2 · Advertencia honesta sobre Vercel Blob", styles["H2"]))
story.append(Paragraph(
    "<b>@vercel/blob v2 solo soporta acceso «public».</b> Las URLs son largas e inadivinables, "
    "pero técnicamente accesibles si el enlace se filtra. Para un dataset «anonymized full "
    "unfiltered» eso <b>no es privacidad real.</b> Recomendación para llegar a 10/10:", styles["Body"]))
story.append(bullets([
    "<b>Corto plazo (hoy):</b> subir a Blob con pathname secreto, nunca exponer la URL en cliente/logs. Cierra la descarga abierta inmediata.",
    "<b>10/10 (semana 1):</b> migrar a un bucket privado real — <b>AWS S3 o Cloudflare R2</b> con <i>URLs firmadas</i> de expiración corta. El loader ya está abstraído para cambiar solo la implementación de lectura.",
    "<b>Gobernanza:</b> registrar quién accede al dataset crudo (ya existe ResearchAccessAudit para el patrón); el seed solo se lee en build/seed, nunca en runtime de usuario.",
]))
story.append(Spacer(1, 0.15*cm))
story.append(Paragraph("1.3 · Política para que no vuelva a pasar", styles["H2"]))
story.append(bullets([
    "<b>Regla dura:</b> public/ solo contiene assets estáticos públicos (imágenes, fuentes, manifest). Cero datos de personas, cero CSV/XLSX. Ya está en .gitignore.",
    "<b>Pre-commit / CI guard:</b> añadir un check que falle el build si aparece un *.csv/*.xlsx o un archivo &gt;5 MB bajo public/.",
    "<b>Optimizar assets restantes:</b> favicon.svg de 1.7 MB y PNGs de hasta 2.8 MB en rowivectors/ (existen ya los .webp de 44-60 KB sin usar) — servir los webp baja el LCP.",
]))
story.append(PageBreak())

# ============ 2. CAMPAÑA DE MARKETING ============
story.append(Paragraph("2 · Campaña de marketing — hero + landings corporativos para ads", styles["H1"]))
story.append(hr())
story.append(Paragraph(
    "El hero actual del sitio vivo ya está reencuadrado a relaciones: <i>«Entiende tus relaciones. "
    "Comunícate mejor.»</i> Es un buen punto de partida. La oportunidad ahora es no depender de un "
    "solo hero genérico, sino construir <b>landings por segmento</b> que alimenten campañas de ads "
    "con mensaje y CTA específicos por audiencia — y medir cada canal.", styles["Body"]))
story.append(Spacer(1, 0.15*cm))

story.append(Paragraph("2.1 · Arquitectura de landings (una por intención de ad)", styles["H2"]))
land = Table([
    [Paragraph("<b>Landing</b>", styles["CellW"]),
     Paragraph("<b>Audiencia / ad</b>", styles["CellW"]),
     Paragraph("<b>Promesa (headline)</b>", styles["CellW"]),
     Paragraph("<b>CTA</b>", styles["CellW"])],
    [Paragraph("/p/conversacion-dificil", styles["Cell"]),
     Paragraph("Individuo con un conflicto pendiente", styles["Cell"]),
     Paragraph("«Di mejor lo difícil con quien te importa.»", styles["Cell"]),
     Paragraph("Preparar conversación", styles["Cell"])],
    [Paragraph("/p/parejas-familia", styles["Cell"]),
     Paragraph("Parejas / familias", styles["Cell"]),
     Paragraph("«Entiéndanse mejor, no solo discutan menos.»", styles["Cell"]),
     Paragraph("Ver nuestra afinidad", styles["Cell"])],
    [Paragraph("/p/managers", styles["Cell"]),
     Paragraph("Líderes de equipo (B2B)", styles["Cell"]),
     Paragraph("«Menos fricción en tu equipo, sin vigilar a nadie.»", styles["Cell"]),
     Paragraph("Solicitar piloto", styles["Cell"])],
    [Paragraph("/p/coaches", styles["Cell"]),
     Paragraph("Coaches Six Seconds", styles["Cell"]),
     Paragraph("«La capa de práctica diaria entre sesiones.»", styles["Cell"]),
     Paragraph("Invitar a mis clientes", styles["Cell"])],
    [Paragraph("/p/empresas", styles["Cell"]),
     Paragraph("HR / People (B2B)", styles["Cell"]),
     Paragraph("«Comunicación medible, privacidad radical.»", styles["Cell"]),
     Paragraph("Hablar con ventas", styles["Cell"])],
], colWidths=[3.5*cm, 3.4*cm, 5.0*cm, 2.8*cm])
land.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),ACCENT),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT]),
    ("GRID",(0,0),(-1,-1),0.4,LINE),
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
]))
story.append(land)
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("2.2 · Requisitos técnicos para que los ads conviertan", styles["H2"]))
story.append(bullets([
    "<b>Atribución arreglada (P1 real):</b> hoy la invitación relacional manda <i>?source=rel_invite</i> a /register, pero /register no lee <i>source</i> — se pierde. Sin esto, no sabrás qué ad/canal convierte. Es el fix de mayor ROI para ads.",
    "<b>Valor antes de registro:</b> los CTA deben llevar a /pre-sei (insight real sin login), no al demo de ECO actual, que es un mockup hardcoded (destinatario falso «Carlos Ruiz», botón «regenerar» que solo finge). Un demo falso en una campaña paga daña la confianza.",
    "<b>Reordenar registro:</b> el paso 0 hoy es elegir precio antes de ver el producto. Para tráfico de ads: valor → cuenta → plan.",
    "<b>SEO de apoyo:</b> añadir JSON-LD (Organization, SoftwareApplication) — único hueco SEO real; robots/sitemap/OG ya existen y funcionan.",
    "<b>Píxeles y UTM:</b> cada landing captura utm_* (ya soportado en /register) + el nuevo source; eventos de funnel ya instrumentados (rel_invite_opened / accepted).",
]))
story.append(Spacer(1, 0.1*cm))
story.append(Paragraph(
    "<i>Nota de marca:</i> sin métricas ni testimonios inventados. Apóyate en Six Seconds "
    "(validación real) y en datos propios cuando existan. La credibilidad es el moat.", styles["Small"]))
story.append(PageBreak())

# ============ 3. ROADMAP 10/10 ============
story.append(Paragraph("3 · Roadmap a 10/10 por categoría", styles["H1"]))
story.append(hr())
story.append(Paragraph(
    "Score actual (auditoría verificada) vs. meta, y la palanca concreta para cerrar la brecha. "
    "Las palancas son acciones reales sobre código que existe, no reescrituras.", styles["Body"]))
story.append(Spacer(1, 0.15*cm))

road = Table([
    [Paragraph("<b>Categoría</b>", styles["CellW"]),
     Paragraph("<b>Hoy</b>", styles["CellW"]),
     Paragraph("<b>Meta</b>", styles["CellW"]),
     Paragraph("<b>Palanca para llegar a 10</b>", styles["CellW"])],
    *[
      [Paragraph(c, styles["Cell"]), Paragraph(h, styles["CellB"]),
       Paragraph("10", styles["CellB"]), Paragraph(p, styles["Cell"])]
      for c,h,p in [
        ("Producto","8","Validar el loop ECO→invitación→afinidad con la cohorte EQ Day."),
        ("UX","6","Reordenar registro (valor primero); unificar los 2 flujos de invitación."),
        ("Diseño","6","Servir .webp existentes; favicon ligero; sistema visual de landings."),
        ("Conversión","6","Arreglar atribución source; CTA a /pre-sei; demo ECO real."),
        ("Retención","6","Activar check-in post-conversación + memoria relacional (infra ya existe)."),
        ("Monetización","5","Pricing por profundidad relacional, no por features/tokens."),
        ("Seguridad","7","Rate limit en login/registro + captcha; quitar default secreto MFA."),
        ("Performance","5","Cerrado el peso de public/; comprimir assets; medir Lighthouse real."),
        ("Escalabilidad","5","Webhook fuera de rate limit; Redis (Upstash) para rate limit distribuido."),
        ("Potencial unicornio","8","Grafo relacional consentido + canal Six Seconds + datos longitudinales."),
      ]
    ]
], colWidths=[3.6*cm, 1.2*cm, 1.2*cm, 8.7*cm])
road.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),ACCENT),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT]),
    ("GRID",(0,0),(-1,-1),0.4,LINE),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ("ALIGN",(1,0),(2,-1),"CENTER"),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LEFTPADDING",(0,0),(-1,-1),6),
]))
story.append(road)
story.append(PageBreak())

# ============ 4. P0/P1 priorizado ============
story.append(Paragraph("4 · Acciones priorizadas (verificadas en código)", styles["H1"]))
story.append(hr())

def prio_table(title, rows, color):
    story.append(Paragraph(title, styles["H2"]))
    data = [[Paragraph("<b>Acción</b>", styles["CellW"]),
             Paragraph("<b>Estado</b>", styles["CellW"]),
             Paragraph("<b>Esfuerzo</b>", styles["CellW"])]]
    for a,e,esf in rows:
        data.append([Paragraph(a, styles["Cell"]),
                     Paragraph(e, styles["Cell"]),
                     Paragraph(esf, styles["Cell"])])
    t = Table(data, colWidths=[9.8*cm, 2.9*cm, 2.0*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),color),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT]),
        ("GRID",(0,0),(-1,-1),0.4,LINE),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.25*cm))

prio_table("P0 — antes de cualquier lanzamiento", [
    ("Sacar datasets de public/ (fuga de datos)", "✓ HECHO esta sesión", "—"),
    ("Excluir /api/stripe/webhook del rate limit (10/min → 429 en pagos)", "Pendiente · verificado real", "Bajo"),
    ("Migrar seed a S3/R2 firmado (privacidad real del dataset)", "Pendiente", "Medio"),
], DANGER)

prio_table("P1 — semana 1", [
    ("Rate limit + captcha en login y /api/auth/register", "Pendiente · verificado real", "Medio"),
    ("Quitar default secreto MFA hardcodeado (fail-closed)", "Pendiente · verificado real", "Bajo"),
    ("Arreglar atribución source en /register (ads/funnel)", "Pendiente · verificado real", "Bajo"),
    ("Verificar guards internos de /api/admin/benchmarks/*", "Pendiente · verificado real", "Bajo"),
    ("Demo ECO real o redirigir CTA a /pre-sei", "Pendiente · verificado real", "Medio"),
    ("Comprimir assets (webp, favicon)", "Pendiente · verificado real", "Bajo"),
    ("Añadir JSON-LD structured data", "Pendiente · verificado real", "Bajo"),
], AMBER)

prio_table("P2 — mes 1", [
    ("Reordenar wizard de registro (valor → cuenta → plan)", "Pendiente", "Medio"),
    ("Unificar flujos de invitación (/invite legacy vs /r SIA)", "Pendiente", "Medio"),
    ("Idempotencia atómica webhook↔ledger + unique en stripeInvoiceId", "Pendiente · verificado real", "Medio"),
    ("Redis (Upstash) para rate limit distribuido", "Pendiente", "Medio"),
    ("Pricing por profundidad relacional", "Pendiente", "Medio"),
], MUTE)

story.append(Paragraph(
    "Lo que la auditoría externa marcó pero NO hay que tocar (verificado falso o ya resuelto): "
    "home client-side, robots/sitemap ausentes, links /stories y /resources muertos, webhook "
    "«stuck en PROCESSING», CSRF sin Origin, CSP unsafe-eval en producción, payment_failed pisando "
    "SUCCEEDED. Todos descartados contra el código.", styles["Small"]))

# ============ 5. PENDIENTES CLAVE ============
story.append(PageBreak())
story.append(Paragraph("5 · Pendientes clave — lista de seguimiento", styles["H1"]))
story.append(hr())
story.append(Paragraph(
    "Los seis pendientes acordados con el fundador, con su estado a esta fecha. El primero ya "
    "está implementado y probado en esta sesión; los otros cinco quedan abiertos con su esfuerzo "
    "y el lugar del código donde se intervienen.", styles["Body"]))
story.append(Spacer(1, 0.2*cm))

key = Table([
    [Paragraph("<b>#</b>", styles["CellW"]),
     Paragraph("<b>Pendiente</b>", styles["CellW"]),
     Paragraph("<b>Estado</b>", styles["CellW"]),
     Paragraph("<b>Esf.</b>", styles["CellW"])],
    [Paragraph("1", styles["CellB"]),
     Paragraph("Excluir /api/stripe/webhook del rate limit (10/min → 429 en pagos). "
               "<font size=7 color='#6B7280'>RATE_LIMIT_EXEMPT_PATHS en middleware.ts; probado.</font>", styles["Cell"]),
     Paragraph("<font color='#00B894'><b>✓ HECHO</b></font>", styles["Cell"]),
     Paragraph("—", styles["Cell"])],
    [Paragraph("2", styles["CellB"]),
     Paragraph("Migrar seed a S3/R2 privado con URLs firmadas (Blob v2 solo es público). "
               "<font size=7 color='#6B7280'>Loader seedSource.ts abstraído; código listo, falta bucket+claves del fundador.</font>", styles["Cell"]),
     Paragraph("<font color='#E29A2D'><b>◐ LISTO (falta clave)</b></font>", styles["Cell"]),
     Paragraph("Medio", styles["Cell"])],
    [Paragraph("3", styles["CellB"]),
     Paragraph("Arreglar atribución source en /register (se perdía ?source=rel_invite). "
               "<font size=7 color='#6B7280'>Email + OAuth; canal crudo en UserAcquisition.channel. OAuth ahora SÍ registra atribución.</font>", styles["Cell"]),
     Paragraph("<font color='#00B894'><b>✓ HECHO</b></font>", styles["Cell"]),
     Paragraph("Bajo", styles["Cell"])],
    [Paragraph("4", styles["CellB"]),
     Paragraph("Rate limit + captcha en login y /api/auth/register. "
               "<font size=7 color='#6B7280'>authStrict cableado (5/5min) en ambos. Captcha Turnstile fail-safe listo; falta clave para activarlo.</font>", styles["Cell"]),
     Paragraph("<font color='#00B894'><b>✓ HECHO</b></font><font size=7 color='#6B7280'> (captcha opt-in)</font>", styles["Cell"]),
     Paragraph("Medio", styles["Cell"])],
    [Paragraph("5", styles["CellB"]),
     Paragraph("Demo ECO honesto + CTA a /pre-sei (valor real sin login). "
               "<font size=7 color='#6B7280'>Badge «ejemplo ilustrativo» en 4 idiomas; CTA primario a /pre-sei con atribución.</font>", styles["Cell"]),
     Paragraph("<font color='#00B894'><b>✓ HECHO</b></font>", styles["Cell"]),
     Paragraph("Medio", styles["Cell"])],
    [Paragraph("6", styles["CellB"]),
     Paragraph("Pricing por profundidad relacional (espina narrativa SIA). "
               "<font size=7 color='#6B7280'>Campo relationalDepth + helpers (Gratis→Relacional→SEI→Acompañado→Contexto) en 4 idiomas. Sin inventar precios.</font>", styles["Cell"]),
     Paragraph("<font color='#00B894'><b>✓ HECHO</b></font>", styles["Cell"]),
     Paragraph("Medio", styles["Cell"])],
], colWidths=[0.8*cm, 10.3*cm, 2.3*cm, 1.3*cm])
key.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),ACCENT),
    ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, LIGHT]),
    ("GRID",(0,0),(-1,-1),0.4,LINE),
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("ALIGN",(0,0),(0,-1),"CENTER"),
    ("ALIGN",(3,0),(3,-1),"CENTER"),
    ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
    ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
]))
story.append(key)
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph(
    "<b>Estado a esta fecha:</b> 5 de 6 implementados y verificados (TS compila limpio, "
    "986 tests pasan). El #2 y el captcha del #4 quedan «listos pero inactivos»: el código "
    "está completo y solo requieren credenciales del fundador (bucket S3/R2 firmado; clave "
    "TURNSTILE_SECRET_KEY). El captcha es fail-safe: omitido mientras no haya clave, sin romper "
    "el flujo. Para el #2, mientras no haya bucket privado los datasets viven en data/seed/ local "
    "(gitignored) — la fuga pública ya está cerrada.", styles["Small"]))

# ---- pie / footer con número de página ----
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTE)
    canvas.drawString(2*cm, 1.1*cm, "Rowi · SIA — Plan Ejecutivo 10/10 · Confidencial")
    canvas.drawRightString(19*cm, 1.1*cm, f"{doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(2*cm, 1.4*cm, 19*cm, 1.4*cm)
    canvas.restoreState()

doc = SimpleDocTemplate(
    "/Users/eduardogonzalez/Desktop/rowi/docs/entregables/Plan_Ejecutivo_Rowi_10-10.pdf",
    pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm,
    title="Plan Ejecutivo Rowi 10/10", author="Auditoría verificada",
)
doc.build(story, onFirstPage=lambda c,d: None, onLaterPages=footer)
print("OK")
