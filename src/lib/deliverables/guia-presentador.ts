/**
 * 📄 Entregable: GUÍA DEL PRESENTADOR (módulo Hiring).
 *
 * Clona el modelo validado (ROWI_GUIA_DEL_PRESENTADOR): el manual que prepara
 * al consultor para PRESENTAR el Reporte Full de Hiring sin tecnicismos y sin
 * caer en veredicto. No es para el cliente: es la chuleta del presentador.
 *
 * Secciones:
 *  1. Qué es este reporte + los 3 números que hay que dominar (Escala SEI,
 *     Afinidad, Percentil) + el principio que abre y cierra.
 *  2. Guion sugerido, página por página (qué decir en cada sección).
 *  3. Cada concepto en 30 segundos (glosario para "¿y eso qué significa?").
 *  4. Preguntas difíciles y respuestas sugeridas.
 *  5. Ética al presentar (NO se hace / SÍ se hace) + caso sensible + chuleta
 *     de números clave (tabla con todas las personas).
 *
 * Se construye sobre el MISMO HiringReportData que el Reporte Full: los números
 * (nombres, EQ, afinidad, percentil, LVS) salen de ahí; el método (guion,
 * glosario, ética) es doctrina Rowi estable con datos interpolados.
 *
 * Server-side (pdfkit, vía deliverables/pdf-kit). Parametrizado por idioma.
 */
import { RowiPdf, C, type Lang } from "./pdf-kit";
import type { HiringReportData, HiringCandidate } from "./reporte-full-hiring";

type LStrings = (typeof L)[Lang];

// ── i18n ──
const L = {
  es: {
    eyebrowIntro: "Guía · intro", eyebrowGuion: "Guía · guion", eyebrowEthics: "Guía · preguntas y ética",
    title: "Guía del presentador",
    subIntro: "Cómo explicar el Reporte Full + Hipótesis LVS, sin tecnicismos",
    subGuion: "Qué decir en cada sección del reporte",
    sub30: "Para responder “¿y eso qué significa?” sin dudar",
    subQ: "Las que casi seguro te van a hacer",
    subEthics: "Lo que no se hace, lo que sí, y los datos clave a mano",
    footer: "Rowi · Guía del presentador",
    whatTitle: "Qué es este reporte, en una frase",
    whatBody: (n: number, leader: string) => `${n} personas hicieron el SEI (la evaluación de inteligencia emocional de Six Seconds). Rowi cruzó esos resultados con cuatro lentes: cómo conecta cada una con ${leader} (afinidad), quién aporta y quién necesita acompañamiento (lente relacional), cómo se comparan con el mundo (benchmark) y cómo se verían como líderes (hipótesis LVS).`,
    threeTitle: "Los 3 números que hay que dominar antes de presentar",
    n1Lead: "Escala SEI (70-130, norma 100)",
    n1: (hi: string, hiV: number, lo: string, loV: number) => `Todos los puntajes SEI y LVS viven aquí. 100 es la norma mundial; 110+ es alto; debajo de 90 es zona de desarrollo. Ejemplo: el EQ de ${hi} (${hiV}) está claramente sobre la norma; el de ${lo} (${loV}) está en zona de desarrollo.`,
    n2Lead: "Afinidad (0-135, bandas)",
    n2: (a: string, l: string, v: number) => `Mide la sintonía de la dupla — el par de personas — no el talento individual. Bandas: 108+ alta sintonía (violeta), 92-107 media (ámbar), menos de 92 baja (gris). Ejemplo: ${a}-${l} = ${v}, sintonía media sólida.`,
    n3Lead: "Percentil (0-100)",
    n3: (p: number) => `Posición frente al mundo: p${p} significa que supera al ${p}% de las evaluaciones del benchmark. No es una nota escolar: p55 no es “malo”, es exactamente el promedio mundial.`,
    principleLead: "El principio que abre y cierra toda presentación",
    principle: "Esto es un lente de relación y desarrollo, no un veredicto. La inteligencia emocional no decide a quién contratar. Cada brecha se cierra con un puente: di esta frase al inicio y repítela al final.",
    guionTitle: "Guion sugerido, página por página",
    guionIntro: "No hace falta presentar las 12 páginas: el camino corto es 1 → 5 → 11 → 12 (resumen, puentes, LVS, roles). Las fichas individuales son material de consulta, no de proyección.",
    glossTitle: "Cada concepto en 30 segundos",
    gloss: [
      ["Afinidad y sus 3 dimensiones", "Crecimiento: qué tan altas y parecidas son las 8 competencias de las dos personas. Colaboración: compatibilidad de estilos de cerebro más la sinergia de talentos. Entendimiento: qué tan parecidas son sus vidas (logro, balance, salud, comunidad). El motor las pondera distinto según el contexto."],
      ["Los 6 contextos", "La misma dupla funciona distinto ejecutando un proyecto que en una conversación difícil. Por eso damos 6 números y no 1: liderazgo, ejecución, innovación, decisión, conversación y relación."],
      ["Lente relacional (+N / sync / -N)", "Compara la capacidad ponderada de cada persona con la del líder en cada contexto. +N = aporta por encima de ella; sync = operan en par; -N = el líder lleva la delantera. No mide valor humano: mide quién empuja a quién en ese terreno."],
      ["Top performer", "El 10% del benchmark con mejor éxito global autorreportado (efectividad, relaciones, calidad de vida y bienestar). Importante: es éxito percibido por la propia persona, no desempeño laboral medido por terceros."],
      ["LVS y los 5 drivers", "Vital Signs mide el clima que un líder genera en su entorno: Confianza, Motivación, Cambio, Equipo y Ejecución. La vista LVS (“cómo lideras”) resume Motivación + Cambio + Ejecución."],
      ["Inferido vs normado", "Inferido = calculado desde el SEI con el motor de Rowi: una proyección, una hipótesis. Normado = medido con el instrumento oficial y comparado contra su norma. Todo el LVS de este reporte es inferido; el LVS real requiere su propia evaluación con evaluadores del entorno."],
    ],
    qTitle: "Preguntas difíciles y respuestas sugeridas",
    ethicsNoTitle: "Lo que NO se hace",
    ethicsNo: [
      "Proyectar el ranking o comparar personas en público — las fichas individuales se conversan 1 a 1.",
      "Usar la IE como filtro de contratación o etiquetar a alguien. El reporte lo prohíbe explícitamente.",
      "Presentar el LVS inferido como medición real, o citar números sin decir la banda y la escala.",
      "Compartir el PDF completo con los candidatos: cada quien recibe su propia lectura, no la de los demás.",
    ],
    ethicsYesTitle: "Lo que SÍ se hace",
    ethicsYes: [
      "Abrir y cerrar con el principio: lente de relación y desarrollo, no veredicto.",
      "Hablar en lenguaje de puentes y roles: qué aporta cada quien y qué necesita para crecer.",
      "Ofrecer a cada persona un debrief individual de su SEI con alguien certificado.",
      "Si el equipo se forma: repetir afinidad y (si se quiere el dato real) aplicar LVS oficial a los 6-12 meses.",
    ],
    sensitiveLead: (lo: string) => `Cómo comunicar el resultado de ${lo} (el caso sensible)`,
    sensitive: (lo: string) => `Nunca como etiqueta, siempre como punto de partida con plan: su perfil hoy pide estructura y acompañamiento; estas son sus metas cortas y este es su mentor. Sus fortalezas reales van primero en la conversación.`,
    cheatTitle: "Chuleta de números clave",
    cheatCols: ["Persona", "Afinidad", "Percentil EQ", "LVS inferido", "Rol"],
    band: { low: "baja", mid: "media", high: "alta" },
    anchorWord: "ancla",
    benchNote: (n: number, nTop: number, thr: number) => `Benchmark: ${n.toLocaleString("es")} evaluaciones SEI (State of the Heart 2018-2024) · top performers = top 10% en éxito global (n=${nTop.toLocaleString("es")}, umbral ${thr}) · los tres sellos del top performer: Metas nobles, Motivación intrínseca y Optimismo (+14 cada uno).`,
    roleByPos: ["Mano derecha", "Par de criterio", "Clima de equipo", "Mentoría"],
    leaderRole: "Visionaria", anchorRole: "Ancla",
  },
  en: {
    eyebrowIntro: "Guide · intro", eyebrowGuion: "Guide · script", eyebrowEthics: "Guide · questions & ethics",
    title: "Presenter's guide",
    subIntro: "How to explain the Full Report + LVS Hypothesis, without jargon",
    subGuion: "What to say in each section of the report",
    sub30: "To answer “so what does that mean?” without hesitating",
    subQ: "The ones they'll almost certainly ask",
    subEthics: "What you don't do, what you do, and the key numbers at hand",
    footer: "Rowi · Presenter's guide",
    whatTitle: "What this report is, in one sentence",
    whatBody: (n: number, leader: string) => `${n} people took the SEI (Six Seconds' emotional intelligence assessment). Rowi crossed those results with four lenses: how each one connects with ${leader} (affinity), who adds and who needs support (relational lens), how they compare to the world (benchmark), and how they'd look as leaders (LVS hypothesis).`,
    threeTitle: "The 3 numbers to master before presenting",
    n1Lead: "SEI scale (70-130, norm 100)",
    n1: (hi: string, hiV: number, lo: string, loV: number) => `All SEI and LVS scores live here. 100 is the world norm; 110+ is high; below 90 is a development zone. Example: ${hi}'s EQ (${hiV}) is clearly above the norm; ${lo}'s (${loV}) is in the development zone.`,
    n2Lead: "Affinity (0-135, bands)",
    n2: (a: string, l: string, v: number) => `Measures the duo's attunement — the pair of people — not individual talent. Bands: 108+ high attunement (violet), 92-107 mid (amber), below 92 low (gray). Example: ${a}-${l} = ${v}, solid mid attunement.`,
    n3Lead: "Percentile (0-100)",
    n3: (p: number) => `Position against the world: p${p} means they're above ${p}% of the benchmark assessments. It's not a school grade: p55 isn't “bad”, it's exactly the world average.`,
    principleLead: "The principle that opens and closes every presentation",
    principle: "This is a relationship-and-development lens, not a verdict. Emotional intelligence does not decide who gets hired. Every gap is closed with a bridge: say this sentence at the start and repeat it at the end.",
    guionTitle: "Suggested script, page by page",
    guionIntro: "You don't have to present all 12 pages: the short path is 1 → 5 → 11 → 12 (summary, bridges, LVS, roles). Individual profiles are reference material, not for projection.",
    glossTitle: "Each concept in 30 seconds",
    gloss: [
      ["Affinity and its 3 dimensions", "Growth: how high and how alike the 8 competencies of the two people are. Collaboration: brain-style compatibility plus talent synergy. Understanding: how alike their lives are (achievement, balance, health, community). The engine weights them differently by context."],
      ["The 6 contexts", "The same duo works differently executing a project than in a hard conversation. That's why we give 6 numbers, not 1: leadership, execution, innovation, decision, conversation and relationship."],
      ["Relational lens (+N / sync / -N)", "Compares each person's weighted capability with the leader's in each context. +N = adds above them; sync = run as peers; -N = the leader leads. It doesn't measure human worth: it measures who pushes whom on that terrain."],
      ["Top performer", "The 10% of the benchmark with the highest self-reported overall success (effectiveness, relationships, quality of life and wellbeing). Important: it's success perceived by the person themselves, not job performance measured by others."],
      ["LVS and the 5 drivers", "Vital Signs measures the climate a leader generates around them: Trust, Motivation, Change, Teamwork and Execution. The LVS view (“how you lead”) sums Motivation + Change + Execution."],
      ["Inferred vs normed", "Inferred = computed from the SEI with Rowi's engine: a projection, a hypothesis. Normed = measured with the official instrument and compared against its norm. All the LVS in this report is inferred; real LVS requires its own assessment with raters from the environment."],
    ],
    qTitle: "Hard questions and suggested answers",
    ethicsNoTitle: "What you do NOT do",
    ethicsNo: [
      "Project the ranking or compare people in public — individual profiles are discussed 1 to 1.",
      "Use EQ as a hiring filter or label anyone. The report explicitly forbids it.",
      "Present inferred LVS as a real measure, or cite numbers without saying the band and the scale.",
      "Share the full PDF with candidates: each gets their own reading, not the others'.",
    ],
    ethicsYesTitle: "What you DO",
    ethicsYes: [
      "Open and close with the principle: a relationship-and-development lens, not a verdict.",
      "Speak in bridges and roles: what each one adds and what they need to grow.",
      "Offer each person an individual SEI debrief with someone certified.",
      "If the team forms: repeat affinity and (if you want the real data) apply official LVS at 6-12 months.",
    ],
    sensitiveLead: (lo: string) => `How to communicate ${lo}'s result (the sensitive case)`,
    sensitive: (lo: string) => `Never as a label, always as a starting point with a plan: their profile today asks for structure and support; these are their short-term goals and this is their mentor. Their real strengths come first in the conversation.`,
    cheatTitle: "Key numbers cheat sheet",
    cheatCols: ["Person", "Affinity", "EQ percentile", "Inferred LVS", "Role"],
    band: { low: "low", mid: "medium", high: "high" },
    anchorWord: "anchor",
    benchNote: (n: number, nTop: number, thr: number) => `Benchmark: ${n.toLocaleString("en")} SEI assessments (State of the Heart 2018-2024) · top performers = top 10% in overall success (n=${nTop.toLocaleString("en")}, threshold ${thr}) · the top performer's three hallmarks: Noble goals, Intrinsic motivation and Optimism (+14 each).`,
    roleByPos: ["Right hand", "Criteria peer", "Team climate", "Mentorship"],
    leaderRole: "Visionary", anchorRole: "Anchor",
  },
  pt: {
    eyebrowIntro: "Guia · intro", eyebrowGuion: "Guia · roteiro", eyebrowEthics: "Guia · perguntas e ética",
    title: "Guia do apresentador",
    subIntro: "Como explicar o Relatório Completo + Hipótese LVS, sem tecnicismos",
    subGuion: "O que dizer em cada seção do relatório",
    sub30: "Para responder “e isso o que significa?” sem hesitar",
    subQ: "As que quase certamente vão te fazer",
    subEthics: "O que não se faz, o que se faz, e os dados-chave à mão",
    footer: "Rowi · Guia do apresentador",
    whatTitle: "O que é este relatório, em uma frase",
    whatBody: (n: number, leader: string) => `${n} pessoas fizeram o SEI (a avaliação de inteligência emocional da Six Seconds). A Rowi cruzou esses resultados com quatro lentes: como cada uma conecta com ${leader} (afinidade), quem agrega e quem precisa de acompanhamento (lente relacional), como se comparam ao mundo (benchmark) e como se veriam como líderes (hipótese LVS).`,
    threeTitle: "Os 3 números a dominar antes de apresentar",
    n1Lead: "Escala SEI (70-130, norma 100)",
    n1: (hi: string, hiV: number, lo: string, loV: number) => `Todos os escores SEI e LVS vivem aqui. 100 é a norma mundial; 110+ é alto; abaixo de 90 é zona de desenvolvimento. Exemplo: o EQ de ${hi} (${hiV}) está claramente acima da norma; o de ${lo} (${loV}) está em zona de desenvolvimento.`,
    n2Lead: "Afinidade (0-135, bandas)",
    n2: (a: string, l: string, v: number) => `Mede a sintonia da dupla — o par de pessoas — não o talento individual. Bandas: 108+ alta sintonia (violeta), 92-107 média (âmbar), abaixo de 92 baixa (cinza). Exemplo: ${a}-${l} = ${v}, sintonia média sólida.`,
    n3Lead: "Percentil (0-100)",
    n3: (p: number) => `Posição diante do mundo: p${p} significa que supera ${p}% das avaliações do benchmark. Não é uma nota escolar: p55 não é “ruim”, é exatamente a média mundial.`,
    principleLead: "O princípio que abre e fecha toda apresentação",
    principle: "Isto é uma lente de relação e desenvolvimento, não um veredito. A inteligência emocional não decide quem contratar. Cada lacuna se fecha com uma ponte: diga esta frase no início e repita no final.",
    guionTitle: "Roteiro sugerido, página por página",
    guionIntro: "Não é preciso apresentar as 12 páginas: o caminho curto é 1 → 5 → 11 → 12 (resumo, pontes, LVS, papéis). As fichas individuais são material de consulta, não de projeção.",
    glossTitle: "Cada conceito em 30 segundos",
    gloss: [
      ["Afinidade e suas 3 dimensões", "Crescimento: quão altas e parecidas são as 8 competências das duas pessoas. Colaboração: compatibilidade de estilos de cérebro mais a sinergia de talentos. Entendimento: quão parecidas são suas vidas (realização, equilíbrio, saúde, comunidade). O motor as pondera diferente conforme o contexto."],
      ["Os 6 contextos", "A mesma dupla funciona diferente executando um projeto e numa conversa difícil. Por isso damos 6 números e não 1: liderança, execução, inovação, decisão, conversa e relacionamento."],
      ["Lente relacional (+N / sync / -N)", "Compara a capacidade ponderada de cada pessoa com a do líder em cada contexto. +N = agrega acima dele; sync = operam em par; -N = o líder lidera. Não mede valor humano: mede quem empurra quem naquele terreno."],
      ["Top performer", "Os 10% do benchmark com maior sucesso global autorreportado (efetividade, relações, qualidade de vida e bem-estar). Importante: é sucesso percebido pela própria pessoa, não desempenho medido por terceiros."],
      ["LVS e os 5 drivers", "Vital Signs mede o clima que um líder gera no entorno: Confiança, Motivação, Mudança, Equipe e Execução. A vista LVS (“como você lidera”) resume Motivação + Mudança + Execução."],
      ["Inferido vs normatizado", "Inferido = calculado a partir do SEI com o motor da Rowi: uma projeção, uma hipótese. Normatizado = medido com o instrumento oficial e comparado com sua norma. Todo o LVS deste relatório é inferido; o LVS real requer sua própria avaliação com avaliadores do entorno."],
    ],
    qTitle: "Perguntas difíceis e respostas sugeridas",
    ethicsNoTitle: "O que NÃO se faz",
    ethicsNo: [
      "Projetar o ranking ou comparar pessoas em público — as fichas individuais se conversam 1 a 1.",
      "Usar a IE como filtro de contratação ou rotular alguém. O relatório proíbe explicitamente.",
      "Apresentar o LVS inferido como medição real, ou citar números sem dizer a banda e a escala.",
      "Compartilhar o PDF completo com os candidatos: cada um recebe sua própria leitura, não a dos demais.",
    ],
    ethicsYesTitle: "O que SE faz",
    ethicsYes: [
      "Abrir e fechar com o princípio: lente de relação e desenvolvimento, não veredito.",
      "Falar em linguagem de pontes e papéis: o que cada um agrega e o que precisa para crescer.",
      "Oferecer a cada pessoa um debrief individual do seu SEI com alguém certificado.",
      "Se a equipe se formar: repetir afinidade e (se quiser o dado real) aplicar LVS oficial aos 6-12 meses.",
    ],
    sensitiveLead: (lo: string) => `Como comunicar o resultado de ${lo} (o caso sensível)`,
    sensitive: (lo: string) => `Nunca como rótulo, sempre como ponto de partida com plano: seu perfil hoje pede estrutura e acompanhamento; estas são suas metas curtas e este é seu mentor. Suas forças reais vêm primeiro na conversa.`,
    cheatTitle: "Cola de números-chave",
    cheatCols: ["Pessoa", "Afinidade", "Percentil EQ", "LVS inferido", "Papel"],
    band: { low: "baixa", mid: "média", high: "alta" },
    anchorWord: "âncora",
    benchNote: (n: number, nTop: number, thr: number) => `Benchmark: ${n.toLocaleString("pt")} avaliações SEI (State of the Heart 2018-2024) · top performers = top 10% em sucesso global (n=${nTop.toLocaleString("pt")}, corte ${thr}) · os três selos do top performer: Metas nobres, Motivação intrínseca e Otimismo (+14 cada).`,
    roleByPos: ["Braço direito", "Par de critério", "Clima de equipe", "Mentoria"],
    leaderRole: "Visionária", anchorRole: "Âncora",
  },
};

export interface GuiaPresentadorData {
  report: HiringReportData;
  /** Percentil y LVS del líder para la chuleta. Si faltan, se intentan extraer
   * de report.leaderMeta (heurística). Pasarlos explícitos es más robusto. */
  leaderPercentile?: number;
  leaderLvsLabel?: string; // "104 (media)"
  /** Guion página-por-página (qué decir). Si falta → plantilla determinista. */
  guion?: { chip: string; text: string }[];
  /** Preguntas difíciles. Si falta → plantilla determinista por idioma. */
  questions?: { q: string; a: string }[];
}

export async function buildGuiaPresentador(data: GuiaPresentadorData, lang: Lang = "es", owl?: Buffer): Promise<Buffer> {
  const t = L[lang];
  const r = data.report;
  const pdf = new RowiPdf({ lang, footerLeft: `${t.footer} · ${r.process} — ${lang === "es" ? "lente de relación, no veredicto" : lang === "pt" ? "lente de relação, não veredito" : "a relationship lens, not a verdict"}`, owl });

  const sorted = [...r.candidates].sort((a, b) => b.affinityAvg - a.affinityAvg);
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];

  // ════ 1 · INTRO + 3 NÚMEROS ════
  pdf.header({ eyebrow: t.eyebrowIntro, title: t.title, subtitle: t.subIntro });
  pdf.h2(t.whatTitle);
  pdf.para(t.whatBody(r.candidates.length, r.leaderName), { size: 9, color: C.muted });
  pdf.h2(t.threeTitle);
  pdf.callout(t.n1(hi.name.split(" ")[0], hi.eq, lo.name.split(" ")[0], lo.eq), { lead: t.n1Lead });
  pdf.callout(t.n2(hi.name.split(" ")[0], r.leaderName.split(" ")[0], hi.affinityAvg), { lead: t.n2Lead });
  pdf.callout(t.n3(hi.eqPercentile), { lead: t.n3Lead });
  pdf.callout(t.principle, { lead: t.principleLead, bg: C.coralBg, leadColor: C.amberTxt });

  // ════ 2 · GUION PÁGINA POR PÁGINA ════
  pdf.section({ eyebrow: t.eyebrowGuion, title: t.guionTitle, need: 220,
    headerOnNewPage: { title: t.title, subtitle: t.subGuion } });
  pdf.para(t.guionIntro, { size: 9, color: C.muted });
  const guion = data.guion ?? defaultGuion(r, t, lang);
  for (const g of guion) pdf.chipRow(g.chip, g.text);

  // ════ 3 · CADA CONCEPTO EN 30 SEGUNDOS ════
  pdf.section({ eyebrow: t.eyebrowGuion, title: t.glossTitle, need: 200,
    headerOnNewPage: { title: t.title, subtitle: t.sub30 } });
  for (const [lead, body] of t.gloss) pdf.callout(body, { lead });

  // ════ 4 · PREGUNTAS DIFÍCILES ════
  pdf.section({ eyebrow: t.eyebrowEthics, title: t.qTitle, need: 200,
    headerOnNewPage: { title: t.title, subtitle: t.subQ } });
  const questions = data.questions ?? defaultQuestions(r, hi, lo, t, lang);
  for (const qa of questions) {
    pdf.para(qa.q, { size: 9.5, bold: true, color: C.violetDark });
    pdf.para(qa.a, { size: 9 });
    pdf.gap(2);
  }

  // ════ 5 · ÉTICA + CHULETA ════
  pdf.section({ eyebrow: t.eyebrowEthics, title: t.ethicsNoTitle, need: 240,
    headerOnNewPage: { title: t.title, subtitle: t.subEthics } });
  pdf.bullets(t.ethicsNo as unknown as string[]);
  pdf.h2(t.ethicsYesTitle);
  pdf.bullets(t.ethicsYes as unknown as string[]);
  pdf.callout(t.sensitive(lo.name.split(" ")[0]), { lead: t.sensitiveLead(lo.name.split(" ")[0]), bg: C.amberBg, leadColor: C.amberTxt });

  pdf.h2(t.cheatTitle);
  cheatTable(pdf, r, sorted, t, data.leaderPercentile, data.leaderLvsLabel);
  pdf.note(t.benchNote(r.benchmark.nTotal, r.benchmark.nTop, r.benchmark.threshold));

  return pdf.finish();
}

// ───────────────────────── plantillas deterministas ─────────────────────────
function defaultGuion(r: HiringReportData, t: LStrings, lang: Lang): { chip: string; text: string }[] {
  const hi = [...r.candidates].sort((a, b) => b.affinityAvg - a.affinityAvg)[0];
  const lo = [...r.candidates].sort((a, b) => a.affinityAvg - b.affinityAvg)[0];
  const p = (n: number) => `${lang === "es" || lang === "pt" ? "pág." : "p."} ${n}`;
  if (lang === "en") return [
    { chip: p(1), text: `Executive summary. Start here and stay 5 minutes: the table says it all. Suggested line: '${hi.name.split(" ")[0]} lifts ${r.leaderName.split(" ")[0]}, the others run as peers, ${lo.name.split(" ")[0]} needs mentorship'. Read the Rowi principle aloud.` },
    { chip: p(2), text: "Affinity by context. Explain that affinity changes with the situation: it doesn't measure how much a person is worth but how the duo operates in each context. The green dot marks the best in each row." },
    { chip: "p. 3-4", text: "Affinity profiles. Only if someone asks about a specific person. The strong number is 'shared talents'." },
    { chip: p(5), text: "The most actionable page. The matrix says who adds (+N), who runs as a peer (sync) and where the leader leads (-N). Read the bridges aloud: they're the work plan with each person." },
    { chip: p(6), text: "Benchmark. The world context: where each one sits against the benchmark assessments. The white mark at p90 on the bars separates the top performers." },
    { chip: p(7), text: "The top performer profile. What the best in the world have: Noble goals, Intrinsic motivation and Optimism (+14 each). Connect it to your people." },
    { chip: "p. 8-10", text: "Benchmark profiles. How to read the bars: gray mark = world average, green mark = top performers average. If the bar passes the green mark, that competency is already top level." },
    { chip: p(11), text: "LVS hypothesis. ALWAYS clarify before showing: it's inferred from the SEI, a hypothesis, not real LVS instrument." },
    { chip: p(12), text: "Close with roles: who sees ahead, who sustains and executes, who guards the criteria, who tends the climate, who has potential to structure. Finish by reading the honesty notes." },
  ];
  if (lang === "pt") return [
    { chip: p(1), text: `Resumo executivo. Comece aqui e fique 5 minutos: a tabela diz tudo. Frase sugerida: '${hi.name.split(" ")[0]} eleva ${r.leaderName.split(" ")[0]}, os demais operam em par, ${lo.name.split(" ")[0]} precisa de mentoria'. Leia o princípio Rowi em voz alta.` },
    { chip: p(2), text: "Afinidade por contexto. Explique que a afinidade muda conforme a situação: não mede quanto vale uma pessoa, mas como a dupla opera em cada contexto. O ponto verde marca o melhor de cada linha." },
    { chip: "pág. 3-4", text: "Fichas de afinidade. Só se alguém perguntar por uma pessoa específica. O dado forte é 'talentos compartilhados'." },
    { chip: p(5), text: "A página mais acionável. A matriz diz quem agrega (+N), quem opera em par (sync) e onde o líder lidera (-N). Leia as pontes em voz alta: são o plano de trabalho com cada pessoa." },
    { chip: p(6), text: "Benchmark. O contexto mundial: onde cada um está diante das avaliações do benchmark. A marca branca em p90 nas barras separa os top performers." },
    { chip: p(7), text: "O perfil do top performer. O que os melhores do mundo têm: Metas nobres, Motivação intrínseca e Otimismo (+14 cada). Conecte com as suas pessoas." },
    { chip: "pág. 8-10", text: "Fichas benchmark. Como ler as barras: marca cinza = média mundial, marca verde = média dos top performers. Se a barra passa a marca verde, essa competência já é nível top." },
    { chip: p(11), text: "Hipótese LVS. SEMPRE esclareça antes de mostrar: é inferido do SEI, uma hipótese, não instrumento LVS real." },
    { chip: p(12), text: "Feche com papéis: quem vê à frente, quem sustenta e executa, quem guarda o critério, quem cuida do clima, quem tem potencial para estruturar. Termine lendo as notas de honestidade." },
  ];
  return [
    { chip: p(1), text: `Resumen ejecutivo. Empieza aquí y quédate 5 minutos: la tabla lo dice todo. Frase sugerida: '${hi.name.split(" ")[0]} eleva a ${r.leaderName.split(" ")[0]}, los demás operan en par, ${lo.name.split(" ")[0]} necesita mentoría'. Lee el principio Rowi en voz alta.` },
    { chip: p(2), text: "Afinidad por contexto. Explica que la afinidad cambia según la situación: no mide cuánto vale una persona sino cómo opera la dupla en cada contexto. El punto verde marca el mejor de cada fila." },
    { chip: "pág. 3-4", text: "Fichas de afinidad. Solo si alguien pregunta por una persona específica. El dato fuerte es 'talentos compartidos'." },
    { chip: p(5), text: "La página más accionable del reporte. La matriz dice quién aporta (+N), quién opera en par (sync) y dónde el líder lleva la delantera (-N). Lee los puentes en voz alta: son el plan de trabajo con cada persona." },
    { chip: p(6), text: "Benchmark. El contexto mundial: dónde está cada quien frente a las evaluaciones del benchmark. La marca blanca de p90 en las barras separa a los top performers." },
    { chip: p(7), text: "El perfil del top performer. Qué tienen los mejores del mundo: Metas nobles, Motivación intrínseca y Optimismo (+14 cada una). Conéctalo con tu gente." },
    { chip: "pág. 8-10", text: "Fichas benchmark. Cómo leer las barras: marca gris = promedio mundial, marca verde = promedio de los top performers. Si la barra pasa la marca verde, esa competencia ya es de nivel top." },
    { chip: p(11), text: "Hipótesis LVS. Aclara SIEMPRE antes de mostrar: es inferido desde el SEI, una hipótesis, no instrumento LVS real." },
    { chip: p(12), text: "Cierre con roles: quién ve adelante, quién sostiene y ejecuta, quién guarda el criterio, quién cuida el clima, quién tiene potencial por estructurar. Termina leyendo las notas de honestidad." },
  ];
}

function defaultQuestions(r: HiringReportData, hi: HiringCandidate, lo: HiringCandidate, t: LStrings, lang: Lang): { q: string; a: string }[] {
  const hiN = hi.name.split(" ")[0], loN = lo.name.split(" ")[0];
  if (lang === "en") return [
    { q: `“So we hire ${hiN} and drop ${loN}?”`, a: `No. The report measures relationship and emotional starting point, not technical fitness or experience. What it does say is how to support each one if they join: give ${hiN} real weight from day one; give ${loN} structure, short goals and mentorship. The hiring decision uses other criteria.` },
    { q: `“How reliable is the LVS if it's inferred?”`, a: `It's a directional hypothesis, useful to converse, not to measure. Rowi's internal validation shows the engine tends to underestimate the real level. If they want the firm number, apply the official LVS instrument with raters from the environment.` },
    { q: `“Can each candidate see their result?”`, a: `Yes, and it's recommended — as individual development feedback, in private. What's never done is showing one person's profile to another, or projecting the ranking in a group.` },
    { q: `“Does ${loN}'s low EQ disqualify them?”`, a: `No: p${lo.eqPercentile} is a starting point, not a ceiling. Emotional intelligence is trainable — developing it is exactly what the Six Seconds methodology does. The mentorship plan is the path, and in 6-12 months it can be measured again.` },
  ];
  if (lang === "pt") return [
    { q: `“Então contratamos ${hiN} e descartamos ${loN}?”`, a: `Não. O relatório mede relação e ponto de partida emocional, não idoneidade técnica nem experiência. O que ele diz é como acompanhar cada um se entrar: a ${hiN}, dar peso real desde o primeiro dia; a ${loN}, estrutura, metas curtas e mentoria. A decisão de contratar usa outros critérios.` },
    { q: `“Quão confiável é o LVS se é inferido?”`, a: `É uma hipótese direcional, útil para conversar, não para medir. A validação interna da Rowi mostra que o motor tende a subestimar o nível real. Se quiserem o dado firme, aplica-se o instrumento LVS oficial com avaliadores do entorno.` },
    { q: `“Cada candidato pode ver seu resultado?”`, a: `Sim, e é recomendável — como feedback de desenvolvimento individual, em privado. O que nunca se faz é mostrar a ficha de uma pessoa a outra, nem projetar o ranking em grupo.` },
    { q: `“O EQ baixo de ${loN} o desqualifica?”`, a: `Não: p${lo.eqPercentile} é ponto de partida, não teto. A inteligência emocional é treinável — desenvolvê-la é exatamente o que faz a metodologia Six Seconds. O plano de mentoria é o caminho, e em 6-12 meses pode-se medir de novo.` },
  ];
  return [
    { q: `“¿Entonces contratamos a ${hiN} y descartamos a ${loN}?”`, a: `No. El reporte mide relación y punto de partida emocional, no idoneidad técnica ni experiencia. Lo que dice es cómo acompañar a cada quien si entra: a ${hiN} darle peso real desde el día uno; a ${loN}, estructura, metas cortas y mentoría. La decisión de contratar usa otros criterios.` },
    { q: `“¿Qué tan confiable es el LVS si es inferido?”`, a: `Es una hipótesis direccional, útil para conversar, no para medir. La validación interna de Rowi muestra que el motor tiende a subestimar el nivel real. Si quieren el dato firme, se aplica el instrumento LVS oficial con evaluadores del entorno.` },
    { q: `“¿Cada candidato puede ver su resultado?”`, a: `Sí, y es recomendable — como feedback de desarrollo individual, en privado. Lo que nunca se hace es mostrar la ficha de una persona a otra, ni proyectar el ranking en grupo.` },
    { q: `“¿El EQ bajo de ${loN} lo descalifica?”`, a: `No: p${lo.eqPercentile} es punto de partida, no techo. La inteligencia emocional es entrenable — desarrollarla es exactamente lo que hace la metodología Six Seconds. El plan de mentoría es el camino, y en 6-12 meses se puede volver a medir.` },
  ];
}

function cheatTable(pdf: RowiPdf, r: HiringReportData, sorted: HiringCandidate[], t: LStrings, leaderPct?: number, leaderLvs?: string) {
  const rows = sorted.map((c, i) => [
    c.name.split(" ")[0],
    `${c.affinityAvg}/135`,
    `p${c.eqPercentile}`,
    `${c.lvs.score} (${t.band[c.lvs.band]})`,
    t.roleByPos[Math.min(i, t.roleByPos.length - 1)],
  ]);
  // fila del líder (ancla). Percentil/LVS explícitos o extraídos de leaderMeta.
  const pct = leaderPct !== undefined ? `p${leaderPct}` : leaderPercentileFromMeta(r);
  const lvs = leaderLvs ?? leaderLvsFromMeta(r);
  rows.push([
    `${r.leaderName.split(" ")[0]} (${t.anchorWord})`,
    "—", pct, lvs, t.leaderRole,
  ]);
  pdf.table(t.cheatCols, rows, [0.26, 0.18, 0.18, 0.2, 0.18], { fs: 8.5 });
}

/** Extrae percentil del líder de leaderMeta ("… percentil mundial 73 …"). */
function leaderPercentileFromMeta(r: HiringReportData): string {
  const m = r.leaderMeta.match(/percentil[^0-9]*(\d{1,3})/i) ?? r.leaderMeta.match(/percentile[^0-9]*(\d{1,3})/i);
  return m ? `p${m[1]}` : "—";
}
/** Extrae LVS del líder de leaderMeta ("… LVS inferido 104 (media) …"). */
function leaderLvsFromMeta(r: HiringReportData): string {
  const m = r.leaderMeta.match(/LVS[^0-9]*(\d{2,3})\s*\(([^)]+)\)/i);
  return m ? `${m[1]} (${m[2]})` : "—";
}
