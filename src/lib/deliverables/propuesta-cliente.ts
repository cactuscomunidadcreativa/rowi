/**
 * 📊 Entregable: PROPUESTA / PITCH AL CLIENTE (módulo Consulting, PPTX).
 *
 * Clona el modelo validado (Propuesta_Bancolombia_OFICIAL): el deck comercial
 * que el consultor presenta al cliente. AGREGADO únicamente — nunca data
 * individual (esa va en la Guía Confidencial). Sigue la regla de las dos
 * canastas: este deck es la canasta CLIENTE.
 *
 * 9 slides: portada · qué escuchamos · lente 1 (clima vs capacidades) · lente 2
 * (fortalezas vs oportunidad) · el enfoque Atraer·Activar·Reflexionar · rutas de
 * implementación (3 opciones) · modelos de inversión · resultados esperados ·
 * próximos pasos.
 *
 * Server-side: pptxgenjs con import dinámico y salida nodebuffer (corre en
 * Vercel; el endpoint devuelve el .pptx). Texto HÍBRIDO: el método (enfoque,
 * rutas, inversión, próximos pasos) es doctrina Rowi estable; los hallazgos y
 * las cifras los pasa el caller (computados del informe / editados por el
 * consultor).
 */
import type { Lang } from "./pdf-kit";

// ── Marca (formato pptxgenjs, sin '#') ──
const VIOLET = "7C3AED";
const VIOLET_DARK = "5B21B6";
const PINK = "D797CF";
const CORAL = "C2410C";
const FG = "1F2937";
const MUTED = "6B7280";
const BOX_BG = "F3EEFE";
const WHITE = "FFFFFF";
const FONT = "Arial"; // universal: PPTX no embebe fuentes de forma fiable
const SLIDE_W = 10;
const SLIDE_H = 5.625;

type Pptx = InstanceType<typeof import("pptxgenjs").default>;
type Slide = ReturnType<Pptx["addSlide"]>;

// ── Entrada ──
export interface InvestmentModel { title: string; desc: string }
export interface PathOption { label: string; who: string; components: string; why: string; recommended?: boolean }
export interface StatRow { label: string; value: string }
export interface ResultItem { title: string; desc: string }

export interface PropuestaData {
  client: string; // "Bancolombia"
  preparedByLine?: string; // "Be to Grow · EQ Latam · Six Seconds Network"
  deckTitle?: string; // título grande de portada (override del default por idioma)
  subtitle?: string; // subtítulo de portada
  /** Qué escuchamos: párrafo de apertura + qué pusimos en la mesa (bullets) */
  whatWeHeard: { lead: string; question: string; onTable: { title: string; desc: string }[] };
  /** Lente 1: dos columnas de estadísticas (clima vs capacidades) + nota */
  lens1: { climateTitle: string; climate: StatRow[]; capsTitle: string; caps: StatRow[]; note?: string };
  /** Lente 2: fortalezas vs oportunidad de desarrollo + nota */
  lens2: { strengths: string[]; opportunities: string[]; note?: string };
  /** Rutas de implementación (3 opciones). Si falta → plantilla determinista. */
  paths?: PathOption[];
  /** Modelos de inversión (4). Si falta → plantilla determinista. */
  investment?: InvestmentModel[];
  investmentNote?: string; // referencia de mercado
  /** Resultados esperados (5). Si falta → plantilla determinista. */
  results?: ResultItem[];
}

// ── i18n (doctrina del deck) ──
const L = {
  es: {
    eyebrowStart: "Punto de partida", eyebrowLens1: "Lente 1 · SEI + TVS", eyebrowLens2: "Lente 2 · El equipo",
    eyebrowApproach: "El enfoque", eyebrowPaths: "Rutas de implementación", eyebrowInvest: "Inversión",
    eyebrowResults: "Resultados esperados", eyebrowNext: "Próximos pasos",
    coverKicker: "Be to Grow · EQ Latam · Six Seconds Network",
    coverType: "Propuesta de desarrollo",
    coverTitle: "Inteligencia Emocional para el Desempeño",
    coverSub: "Del clima al desempeño sostenible · una ruta basada en datos para el equipo",
    preparedFor: (c: string) => `Preparado para ${c}`,
    whatHeard: "Lo que escuchamos", onTable: "Lo que pusimos en la mesa",
    lens1Title: "El clima descansa sobre capacidades con espacio para crecer",
    lens1Sub: "En la superficie, el clima es alto. Debajo, las capacidades de IE individuales están en o apenas sobre la norma — el motor que sostiene ese clima tiene espacio para desarrollarse.",
    lens2Title: "La fortaleza es clara; la oportunidad también",
    lens2Strengths: "Fortalezas para capitalizar", lens2Opps: "Oportunidad de desarrollo",
    approachTitle: "Cómo mejoramos: Atraer · Activar · Reflexionar",
    phases: [
      { key: "Atraer", sub: "Atraer · claridad y compromiso", bg: VIOLET },
      { key: "Activar", sub: "Activar · construir capacidad", bg: CORAL },
      { key: "Reflexionar", sub: "Reflexionar · consolidar y medir", bg: VIOLET_DARK },
    ],
    phaseBullets: [
      ["Debrief de TVS con el líder", "Sesión de hallazgos con el equipo", "Brain Brief Profiles: un lenguaje común"],
      ["Talleres: autorregulación y experimentación", "Coaching para líderes", "Práctica con herramientas de IE"],
      ["Plan de acción del equipo", "Re-medición de TVS a los 3-6 meses", "Sesión de lecciones aprendidas y siguiente ciclo"],
    ],
    approachNote: "Cada fase trabaja una emoción: de la frustración al entusiasmo, del miedo al coraje, del juicio a la curiosidad.",
    pathsTitle: "Tres formas de empezar",
    pathsCols: ["", "Opción 1 · Piloto", "Opción 2 · Completa (recomendada)", "Opción 3 · Expansión"],
    pathsWho: "Para quién", pathsComp: "Componentes", pathsWhy: "Por qué",
    pathsRec: "Recomendación: empezar con la Opción 2 en el equipo ya medido, con la re-medición de TVS como hito de impacto.",
    investTitle: "Modelos de inversión",
    investIntro: "Definimos las cifras una vez acordados alcance, número de participantes y duración. Modelos posibles:",
    resultsTitle: "Qué cambia con este proceso",
    resultsNote: "No prometemos resultados garantizados; sí prometemos un proceso medible y basado en evidencia.",
    nextTitle: "Empecemos",
    nextSteps: [
      { title: "Elegir la ruta", desc: "Confirmar Opción 1, 2 o 3 como punto de partida." },
      { title: "Acordar alcance y cifras", desc: "Participantes, duración, formato y modelo de inversión." },
      { title: "Agendar el Atraer", desc: "Debrief de TVS y sesión de hallazgos con el equipo." },
    ],
    footerTail: "Propuesta de Desarrollo de Inteligencia Emocional",
    // defaults deterministas
    defPaths: [
      { label: "Opción 1 · Piloto", who: "Grupo pequeño / un equipo", components: "Debrief de TVS + sesión de kickoff", why: "Reduce el riesgo, muestra valor rápido" },
      { label: "Opción 2 · Completa (recomendada)", who: "La audiencia objetivo completa", components: "Evaluación + debriefs + talleres + coaching + re-medición", why: "Cambia conductas y deja impacto medible", recommended: true },
      { label: "Opción 3 · Expansión", who: "Varios equipos / la organización", components: "OVS + programa por cohortes + champions + certificación interna", why: "Instala capacidad interna y sostenibilidad" },
    ],
    defInvest: [
      { title: "Por participante", desc: "Ideal para cohortes con evaluación + debrief individual." },
      { title: "Por fase", desc: "Atraer / Activar / Reflexionar facturado por etapa." },
      { title: "Por paquete", desc: "Programa cerrado con entregables y precio fijo." },
      { title: "Licencia + facilitación", desc: "Evaluaciones licenciadas + honorarios de facilitación." },
    ],
    defInvestNote: "Referencia de mercado (no es una tarifa): un piloto de 3 fases con evaluaciones, talleres y coaching se ha estructurado alrededor de US$30-32K. Adaptado al país, alcance y margen objetivo.",
    defResults: [
      { title: "Un lenguaje común de IE", desc: "El equipo nombra y trabaja sus emociones con un marco compartido." },
      { title: "Mayor autorregulación colectiva", desc: "Conversaciones más productivas bajo presión." },
      { title: "Cambio y agilidad desbloqueados", desc: "Más apertura a experimentar, menos dispersión interna." },
      { title: "Bienestar sostenible", desc: "El motor que sostiene el alto desempeño recibe cuidado." },
      { title: "Impacto medible", desc: "Una re-medición de TVS que muestra el progreso en números." },
    ],
  },
  en: {
    eyebrowStart: "Starting point", eyebrowLens1: "Lens 1 · SEI + TVS", eyebrowLens2: "Lens 2 · The team",
    eyebrowApproach: "The approach", eyebrowPaths: "Implementation paths", eyebrowInvest: "Investment",
    eyebrowResults: "Expected results", eyebrowNext: "Next steps",
    coverKicker: "Be to Grow · EQ Latam · Six Seconds Network",
    coverType: "Development proposal",
    coverTitle: "Emotional Intelligence for Performance",
    coverSub: "From climate to sustainable performance · a data-based path for the team",
    preparedFor: (c: string) => `Prepared for ${c}`,
    whatHeard: "What we heard", onTable: "What we put on the table",
    lens1Title: "The climate rests on capabilities with room to grow",
    lens1Sub: "On the surface, the climate is high. Underneath, individual EQ capabilities sit at or barely above the norm — the engine sustaining that climate has room to develop.",
    lens2Title: "The strength is clear; so is the opportunity",
    lens2Strengths: "Strengths to capitalize on", lens2Opps: "Development opportunity",
    approachTitle: "How we improve: Engage · Activate · Reflect",
    phases: [
      { key: "Engage", sub: "Engage · clarity and commitment", bg: VIOLET },
      { key: "Activate", sub: "Activate · build capability", bg: CORAL },
      { key: "Reflect", sub: "Reflect · consolidate and measure", bg: VIOLET_DARK },
    ],
    phaseBullets: [
      ["TVS debrief with the leader", "Findings session with the team", "Brain Brief Profiles: a common language"],
      ["Workshops: self-regulation and experimentation", "Coaching for leaders", "Practice with EQ tools"],
      ["Team action plan", "TVS re-measurement at 3-6 months", "Lessons-learned session and next cycle"],
    ],
    approachNote: "Each phase works one emotion: from frustration to enthusiasm, from fear to courage, from judgment to curiosity.",
    pathsTitle: "Three ways to start",
    pathsCols: ["", "Option 1 · Pilot", "Option 2 · Full (recommended)", "Option 3 · Expansion"],
    pathsWho: "Who it's for", pathsComp: "Components", pathsWhy: "Why",
    pathsRec: "Recommendation: start with Option 2 on the already-measured team, with TVS re-measurement as the impact milestone.",
    investTitle: "Investment models",
    investIntro: "We define the figures once scope, number of participants and duration are agreed. Possible models:",
    resultsTitle: "What changes with this process",
    resultsNote: "We do not promise guaranteed results; we do promise a measurable, evidence-based process.",
    nextTitle: "Let's begin",
    nextSteps: [
      { title: "Choose the path", desc: "Confirm Option 1, 2 or 3 as the starting point." },
      { title: "Agree scope and figures", desc: "Participants, duration, format and investment model." },
      { title: "Schedule the Engage", desc: "TVS debrief and findings session with the team." },
    ],
    footerTail: "Emotional Intelligence Development Proposal",
    defPaths: [
      { label: "Option 1 · Pilot", who: "Small group / one team", components: "TVS debrief + kickoff session", why: "Reduces risk, shows value fast" },
      { label: "Option 2 · Full (recommended)", who: "The full target audience", components: "Assessment + debriefs + workshops + coaching + re-measurement", why: "Changes behaviors and leaves measurable impact", recommended: true },
      { label: "Option 3 · Expansion", who: "Several teams / the organization", components: "OVS + cohort-based program + champions + internal certification", why: "Installs internal capability and sustainability" },
    ],
    defInvest: [
      { title: "Per participant", desc: "Ideal for cohorts with assessment + individual debrief." },
      { title: "Per phase", desc: "Engage / Activate / Reflect billed per stage." },
      { title: "Per package", desc: "Closed program with deliverables and a fixed price." },
      { title: "License + facilitation", desc: "Licensed assessments + facilitation fees." },
    ],
    defInvestNote: "Market reference (not a rate): a 3-phase pilot with assessments, workshops and coaching has been structured around US$30-32K. Adapted to country, scope and target margin.",
    defResults: [
      { title: "A common EQ language", desc: "The team names and works its emotions with a shared framework." },
      { title: "Greater collective self-regulation", desc: "More productive conversations under pressure." },
      { title: "Change and agility unlocked", desc: "More openness to experiment, less internal spread." },
      { title: "Sustainable wellbeing", desc: "The engine that sustains high performance gets cared for." },
      { title: "Measurable impact", desc: "A TVS re-measurement that shows progress in numbers." },
    ],
  },
  pt: {
    eyebrowStart: "Ponto de partida", eyebrowLens1: "Lente 1 · SEI + TVS", eyebrowLens2: "Lente 2 · A equipe",
    eyebrowApproach: "A abordagem", eyebrowPaths: "Rotas de implementação", eyebrowInvest: "Investimento",
    eyebrowResults: "Resultados esperados", eyebrowNext: "Próximos passos",
    coverKicker: "Be to Grow · EQ Latam · Six Seconds Network",
    coverType: "Proposta de desenvolvimento",
    coverTitle: "Inteligência Emocional para o Desempenho",
    coverSub: "Do clima ao desempenho sustentável · uma rota baseada em dados para a equipe",
    preparedFor: (c: string) => `Preparado para ${c}`,
    whatHeard: "O que ouvimos", onTable: "O que colocamos na mesa",
    lens1Title: "O clima repousa sobre capacidades com espaço para crescer",
    lens1Sub: "Na superfície, o clima é alto. Por baixo, as capacidades de IE individuais estão na norma ou logo acima — o motor que sustenta esse clima tem espaço para se desenvolver.",
    lens2Title: "A força é clara; a oportunidade também",
    lens2Strengths: "Forças para capitalizar", lens2Opps: "Oportunidade de desenvolvimento",
    approachTitle: "Como melhoramos: Atrair · Ativar · Refletir",
    phases: [
      { key: "Atrair", sub: "Atrair · clareza e compromisso", bg: VIOLET },
      { key: "Ativar", sub: "Ativar · construir capacidade", bg: CORAL },
      { key: "Refletir", sub: "Refletir · consolidar e medir", bg: VIOLET_DARK },
    ],
    phaseBullets: [
      ["Debrief de TVS com o líder", "Sessão de achados com a equipe", "Brain Brief Profiles: uma linguagem comum"],
      ["Workshops: autorregulação e experimentação", "Coaching para líderes", "Prática com ferramentas de IE"],
      ["Plano de ação da equipe", "Re-medição de TVS aos 3-6 meses", "Sessão de lições aprendidas e próximo ciclo"],
    ],
    approachNote: "Cada fase trabalha uma emoção: da frustração ao entusiasmo, do medo à coragem, do julgamento à curiosidade.",
    pathsTitle: "Três formas de começar",
    pathsCols: ["", "Opção 1 · Piloto", "Opção 2 · Completa (recomendada)", "Opção 3 · Expansão"],
    pathsWho: "Para quem", pathsComp: "Componentes", pathsWhy: "Por quê",
    pathsRec: "Recomendação: começar com a Opção 2 na equipe já medida, com a re-medição de TVS como marco de impacto.",
    investTitle: "Modelos de investimento",
    investIntro: "Definimos as cifras uma vez acordados escopo, número de participantes e duração. Modelos possíveis:",
    resultsTitle: "O que muda com este processo",
    resultsNote: "Não prometemos resultados garantidos; prometemos um processo mensurável e baseado em evidências.",
    nextTitle: "Vamos começar",
    nextSteps: [
      { title: "Escolher a rota", desc: "Confirmar Opção 1, 2 ou 3 como ponto de partida." },
      { title: "Acordar escopo e cifras", desc: "Participantes, duração, formato e modelo de investimento." },
      { title: "Agendar o Atrair", desc: "Debrief de TVS e sessão de achados com a equipe." },
    ],
    footerTail: "Proposta de Desenvolvimento de Inteligência Emocional",
    defPaths: [
      { label: "Opção 1 · Piloto", who: "Grupo pequeno / uma equipe", components: "Debrief de TVS + sessão de kickoff", why: "Reduz o risco, mostra valor rápido" },
      { label: "Opção 2 · Completa (recomendada)", who: "A audiência-alvo completa", components: "Avaliação + debriefs + workshops + coaching + re-medição", why: "Muda comportamentos e deixa impacto mensurável", recommended: true },
      { label: "Opção 3 · Expansão", who: "Várias equipes / a organização", components: "OVS + programa por cohortes + champions + certificação interna", why: "Instala capacidade interna e sustentabilidade" },
    ],
    defInvest: [
      { title: "Por participante", desc: "Ideal para cohortes com avaliação + debrief individual." },
      { title: "Por fase", desc: "Atrair / Ativar / Refletir faturado por etapa." },
      { title: "Por pacote", desc: "Programa fechado com entregáveis e preço fixo." },
      { title: "Licença + facilitação", desc: "Avaliações licenciadas + honorários de facilitação." },
    ],
    defInvestNote: "Referência de mercado (não é uma tarifa): um piloto de 3 fases com avaliações, workshops e coaching foi estruturado em torno de US$30-32K. Adaptado ao país, escopo e margem alvo.",
    defResults: [
      { title: "Uma linguagem comum de IE", desc: "A equipe nomeia e trabalha suas emoções com um marco compartilhado." },
      { title: "Maior autorregulação coletiva", desc: "Conversas mais produtivas sob pressão." },
      { title: "Mudança e agilidade desbloqueadas", desc: "Mais abertura para experimentar, menos dispersão interna." },
      { title: "Bem-estar sustentável", desc: "O motor que sustenta o alto desempenho recebe cuidado." },
      { title: "Impacto mensurável", desc: "Uma re-medição de TVS que mostra o progresso em números." },
    ],
  },
};

type LStrings = (typeof L)[Lang];

// ── helpers de slide ──
function footer(slide: Slide, t: LStrings, client: string, eyebrowLabel: string, n: number) {
  slide.addText(`${client} · ${t.footerTail}`, { x: 0.5, y: SLIDE_H - 0.35, w: 6, h: 0.25, fontFace: FONT, fontSize: 7, color: MUTED });
  slide.addText(`${eyebrowLabel} · ${n}`, { x: SLIDE_W - 3, y: SLIDE_H - 0.35, w: 2.5, h: 0.25, fontFace: FONT, fontSize: 7, color: MUTED, align: "right" });
}

function contentSlide(pptx: Pptx, t: LStrings, client: string, n: number, eyebrow: string, title: string, sub?: string): Slide {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText(eyebrow.toUpperCase(), { x: 0.5, y: 0.3, w: 9, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: VIOLET, charSpacing: 2 });
  slide.addText(title, { x: 0.5, y: 0.6, w: 9, h: 0.6, fontFace: FONT, fontSize: 22, bold: true, color: FG });
  if (sub) slide.addText(sub, { x: 0.5, y: 1.25, w: 9, h: 0.5, fontFace: FONT, fontSize: 11, color: MUTED });
  footer(slide, t, client, eyebrow, n);
  return slide;
}

function bulletBox(slide: Slide, x: number, y: number, w: number, h: number, title: string, items: string[], accent: string) {
  slide.addShape("rect", { x, y, w, h, fill: { color: BOX_BG } });
  slide.addShape("rect", { x, y, w: 0.06, h, fill: { color: accent } });
  slide.addText(title, { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: accent });
  slide.addText(items.map((it) => ({ text: it, options: { bullet: { code: "2022" }, fontSize: 11, color: FG, paraSpaceAfter: 6 } })), { x: x + 0.25, y: y + 0.7, w: w - 0.5, h: h - 0.9, fontFace: FONT, valign: "top" });
}

function statBox(slide: Slide, x: number, y: number, w: number, h: number, title: string, rows: StatRow[], valueColor: string) {
  slide.addShape("rect", { x, y, w, h, fill: { color: BOX_BG } });
  slide.addText(title.toUpperCase(), { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: VIOLET, charSpacing: 1 });
  const rowH = (h - 0.7) / Math.max(rows.length, 1);
  rows.forEach((r, i) => {
    const ry = y + 0.6 + i * rowH;
    slide.addText(r.label, { x: x + 0.25, y: ry, w: w - 1.4, h: rowH, fontFace: FONT, fontSize: 11, color: FG, valign: "middle" });
    slide.addText(r.value, { x: x + w - 1.3, y: ry, w: 1.1, h: rowH, fontFace: FONT, fontSize: 13, bold: true, color: valueColor, align: "right", valign: "middle" });
  });
}

function quoteNote(slide: Slide, text: string) {
  slide.addText(text, { x: 0.5, y: SLIDE_H - 0.95, w: 9, h: 0.5, fontFace: FONT, fontSize: 10, italic: true, color: VIOLET_DARK, valign: "top" });
}

function numberedList(slide: Slide, items: { title: string; desc: string }[], y0: number, dark: boolean) {
  const rowH = Math.min(0.78, (SLIDE_H - y0 - 0.6) / items.length);
  items.forEach((it, i) => {
    const y = y0 + i * rowH;
    slide.addShape("ellipse", { x: 0.5, y, w: 0.4, h: 0.4, fill: { color: dark ? "8B5CF6" : VIOLET } });
    slide.addText(String(i + 1), { x: 0.5, y, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle" });
    slide.addText(it.title, { x: 1.1, y: y - 0.02, w: 8, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: dark ? WHITE : FG });
    slide.addText(it.desc, { x: 1.1, y: y + 0.26, w: 8, h: 0.3, fontFace: FONT, fontSize: 10.5, color: dark ? "DDD6FE" : MUTED });
  });
}

export async function buildPropuestaCliente(data: PropuestaData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "ROWI_16x9", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "ROWI_16x9";
  const client = data.client;

  // ── 1 · PORTADA ──
  const cover = pptx.addSlide();
  cover.background = { color: VIOLET };
  // círculos de marca (decoración esquina derecha)
  cover.addShape("ellipse", { x: 7.0, y: -1.2, w: 4.2, h: 4.2, fill: { color: "8B5CF6" } });
  cover.addShape("ellipse", { x: 8.2, y: 2.4, w: 2.6, h: 2.6, fill: { color: PINK, transparency: 35 } });
  cover.addText(t.coverKicker.toUpperCase(), { x: 0.5, y: 0.85, w: 6.5, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: "DDD6FE", charSpacing: 2 });
  cover.addText(t.coverType, { x: 0.5, y: 1.5, w: 7, h: 0.4, fontFace: FONT, fontSize: 16, italic: true, color: "DDD6FE" });
  cover.addText(data.deckTitle ?? t.coverTitle, { x: 0.5, y: 2.1, w: 7.2, h: 1.0, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
  cover.addText(data.subtitle ?? t.coverSub, { x: 0.5, y: 3.5, w: 6.8, h: 0.5, fontFace: FONT, fontSize: 12, color: "E9D5FF" });
  if (owl) {
    try { cover.addImage({ data: `image/png;base64,${owl.toString("base64")}`, x: 8.25, y: 3.55, w: 1.05, h: 1.05 }); } catch { /* búho opcional */ }
  }
  cover.addText(t.preparedFor(client), { x: 0.5, y: SLIDE_H - 0.7, w: 6, h: 0.3, fontFace: FONT, fontSize: 10, color: "C4B5FD" });

  // ── 2 · LO QUE ESCUCHAMOS ──
  {
    const s = contentSlide(pptx, t, client, 2, t.eyebrowStart, t.whatHeard);
    s.addText(data.whatWeHeard.lead, { x: 0.5, y: 1.5, w: 5.2, h: 1.1, fontFace: FONT, fontSize: 12.5, bold: true, color: FG, valign: "top" });
    s.addText(data.whatWeHeard.question, { x: 0.5, y: 2.7, w: 5.2, h: 1.6, fontFace: FONT, fontSize: 12, color: VIOLET_DARK, valign: "top" });
    // box derecho
    s.addShape("rect", { x: 6.1, y: 1.5, w: 3.4, h: 3.2, fill: { color: BOX_BG } });
    s.addText(t.onTable, { x: 6.35, y: 1.7, w: 2.9, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: VIOLET });
    const rich = data.whatWeHeard.onTable.flatMap((o) => [
      { text: o.title, options: { fontSize: 11, bold: true, color: VIOLET_DARK, paraSpaceBefore: 8 } },
      { text: o.desc, options: { fontSize: 10, color: FG, paraSpaceAfter: 4 } },
    ]);
    s.addText(rich, { x: 6.35, y: 2.15, w: 2.9, h: 2.4, fontFace: FONT, valign: "top" });
  }

  // ── 3 · LENTE 1 ──
  {
    const s = contentSlide(pptx, t, client, 3, t.eyebrowLens1, t.lens1Title, t.lens1Sub);
    statBox(s, 0.5, 1.95, 4.3, 2.5, data.lens1.climateTitle, data.lens1.climate, VIOLET);
    statBox(s, 5.2, 1.95, 4.3, 2.5, data.lens1.capsTitle, data.lens1.caps, CORAL);
    if (data.lens1.note) quoteNote(s, data.lens1.note);
  }

  // ── 4 · LENTE 2 ──
  {
    const s = contentSlide(pptx, t, client, 4, t.eyebrowLens2, t.lens2Title);
    bulletBox(s, 0.5, 1.6, 4.3, 2.6, t.lens2Strengths, data.lens2.strengths, VIOLET);
    bulletBox(s, 5.2, 1.6, 4.3, 2.6, t.lens2Opps, data.lens2.opportunities, CORAL);
    if (data.lens2.note) quoteNote(s, data.lens2.note);
  }

  // ── 5 · EL ENFOQUE (Atraer·Activar·Reflexionar) ──
  {
    const s = contentSlide(pptx, t, client, 5, t.eyebrowApproach, t.approachTitle);
    const cardW = 2.93, gap = 0.13, x0 = 0.5;
    t.phases.forEach((ph, i) => {
      const x = x0 + i * (cardW + gap);
      s.addShape("rect", { x, y: 1.6, w: cardW, h: 0.75, fill: { color: ph.bg } });
      s.addText(ph.key, { x: x + 0.2, y: 1.68, w: cardW - 0.4, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: WHITE });
      s.addText(ph.sub, { x: x + 0.2, y: 2.02, w: cardW - 0.4, h: 0.25, fontFace: FONT, fontSize: 9, italic: true, color: "E9D5FF" });
      s.addShape("rect", { x, y: 2.35, w: cardW, h: 2.05, fill: { color: BOX_BG } });
      s.addText(t.phaseBullets[i].map((b) => ({ text: b, options: { bullet: { code: "2022" }, fontSize: 10.5, color: FG, paraSpaceAfter: 6 } })), { x: x + 0.2, y: 2.55, w: cardW - 0.4, h: 1.7, fontFace: FONT, valign: "top" });
    });
    quoteNote(s, t.approachNote);
  }

  // ── 6 · RUTAS DE IMPLEMENTACIÓN ──
  {
    const s = contentSlide(pptx, t, client, 6, t.eyebrowPaths, t.pathsTitle);
    const paths = data.paths ?? (t.defPaths as PathOption[]);
    const header = [{ text: "", options: { fill: { color: "F3F4F6" } } }, ...paths.map((p) => ({
      text: p.label, options: { fill: { color: p.recommended ? VIOLET_DARK : VIOLET }, color: WHITE, bold: true, align: "center" as const, fontSize: 10 },
    }))];
    const mk = (head: string, pick: (p: PathOption) => string) => [
      { text: head, options: { fill: { color: "F3F4F6" }, color: VIOLET, bold: true, fontSize: 10 } },
      ...paths.map((p) => ({ text: pick(p), options: { color: FG, fontSize: 9.5, valign: "top" as const } })),
    ];
    s.addTable([header, mk(t.pathsWho, (p) => p.who), mk(t.pathsComp, (p) => p.components), mk(t.pathsWhy, (p) => p.why)], {
      x: 0.5, y: 1.6, w: 9, colW: [1.8, 2.4, 2.4, 2.4], rowH: [0.45, 0.55, 0.85, 0.6],
      fontFace: FONT, border: { type: "solid", color: "E5E7EB", pt: 1 }, valign: "middle",
    });
    quoteNote(s, t.pathsRec);
  }

  // ── 7 · MODELOS DE INVERSIÓN ──
  {
    const s = contentSlide(pptx, t, client, 7, t.eyebrowInvest, t.investTitle, t.investIntro);
    const inv = data.investment ?? (t.defInvest as InvestmentModel[]);
    const positions = [[0.5, 1.95], [5.2, 1.95], [0.5, 3.05], [5.2, 3.05]];
    inv.slice(0, 4).forEach((m, i) => {
      const [x, y] = positions[i];
      s.addShape("rect", { x, y, w: 4.3, h: 0.95, fill: { color: BOX_BG } });
      s.addShape("rect", { x, y, w: 0.06, h: 0.95, fill: { color: VIOLET } });
      s.addText(m.title, { x: x + 0.25, y: y + 0.13, w: 4, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: VIOLET_DARK });
      s.addText(m.desc, { x: x + 0.25, y: y + 0.45, w: 4, h: 0.4, fontFace: FONT, fontSize: 10, color: FG });
    });
    quoteNote(s, data.investmentNote ?? t.defInvestNote);
  }

  // ── 8 · RESULTADOS ESPERADOS ──
  {
    const s = contentSlide(pptx, t, client, 8, t.eyebrowResults, t.resultsTitle);
    numberedList(s, data.results ?? t.defResults, 1.55, false);
    quoteNote(s, t.resultsNote);
  }

  // ── 9 · PRÓXIMOS PASOS ──
  {
    const s = pptx.addSlide();
    s.background = { color: VIOLET };
    s.addShape("ellipse", { x: -1.5, y: 3.2, w: 4, h: 4, fill: { color: "8B5CF6" } });
    s.addText(t.eyebrowNext.toUpperCase(), { x: 0.5, y: 0.5, w: 9, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: "DDD6FE", charSpacing: 2 });
    s.addText(t.nextTitle, { x: 0.5, y: 0.95, w: 9, h: 0.7, fontFace: FONT, fontSize: 30, bold: true, color: WHITE });
    numberedList(s, t.nextSteps, 2.1, true);
    s.addText(t.coverKicker, { x: 0.5, y: SLIDE_H - 0.45, w: 6, h: 0.3, fontFace: FONT, fontSize: 9, color: "C4B5FD" });
  }

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}
