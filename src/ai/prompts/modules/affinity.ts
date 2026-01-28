/**
 * Rowi AI — Affinity Prompt Builder v4.0
 * ------------------------------------------------------------
 * Genera estrategias de afinidad basadas en:
 *  - Competencias SEI
 *  - Talentos dominantes
 *  - Factores de éxito
 *  - Subfactores
 *  - Estilo cerebral (Brain Style)
 * 
 * Adapta tono, enfoque y tipo de acción según el perfil.
 * Soporta: es | en | pt | it
 */

export type Locale = "es" | "en" | "pt" | "it";

interface ProfileData {
  brainStyle?: string;
  competencies?: Record<string, number>;
  talents?: Record<string, number>;
  outcomes?: Record<string, number>;
  subfactors?: Record<string, number>;
  pursuits?: Record<string, number>;
}

export function buildMessagesAffinity({
  locale = "es",
  a = "Tú",
  b = ["la otra persona"],
  project = "relationship",
  context = "mejorar conexión emocional y comunicación",
  profileData,
  askJson = false,
}: {
  locale?: Locale;
  a?: string;
  b?: string[];
  project?: string;
  context?: string;
  profileData?: ProfileData;
  askJson?: boolean;
}) {
  // 🌎 Idioma
  const langName =
    locale === "en"
      ? "English"
      : locale === "pt"
      ? "Português"
      : locale === "it"
      ? "Italiano"
      : "Español";

  /* ============================================================
     🧠 INTERPRETACIÓN DEL PERFIL SEI
  ============================================================ */
  const cues: string[] = [];

  // --- Estilo cerebral ---
  if (profileData?.brainStyle) {
    const bs = profileData.brainStyle.toLowerCase();
    if (bs.includes("estratég")) cues.push("Prefiere planificación, estructura y decisiones basadas en datos y análisis.");
    else if (bs.includes("pragm")) cues.push("Valora la eficiencia, los resultados concretos y el lenguaje directo.");
    else if (bs.includes("empát")) cues.push("Responde mejor a la conexión emocional, el reconocimiento y la autenticidad.");
    else if (bs.includes("vision")) cues.push("Se inspira en conversaciones sobre propósito, visión y significado.");
    else cues.push(`Tiene un estilo cerebral ${profileData.brainStyle}, lo que influye en su forma de conectar y decidir.`);
  }

  // --- Competencias bajas o altas ---
  const lowComps = Object.entries(profileData?.competencies ?? {})
    .filter(([_, v]) => (v ?? 0) < 95)
    .map(([k]) => k);
  if (lowComps.length > 0)
    cues.push(`Presenta áreas de oportunidad en competencias como ${lowComps.join(", ")}.`);
  const strongComps = Object.entries(profileData?.competencies ?? {})
    .filter(([_, v]) => (v ?? 0) > 115)
    .map(([k]) => k);
  if (strongComps.length > 0)
    cues.push(`Destaca en competencias como ${strongComps.join(", ")}, lo que puedes aprovechar para generar afinidad.`);

  // --- Talentos dominantes ---
  const topTalents = Object.entries(profileData?.talents ?? {})
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .map(([k]) => k);
  if (topTalents.length > 0)
    cues.push(`Sus talentos más visibles incluyen ${topTalents.join(", ")}.`);

  // --- Factores de éxito ---
  const topOutcome = Object.entries(profileData?.outcomes ?? {})
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0];
  if (topOutcome)
    cues.push(`Su principal motivador parece ser el factor de éxito "${topOutcome}".`);

  // --- Subfactores clave ---
  const subfocus = Object.entries(profileData?.subfactors ?? {})
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 2)
    .map(([k]) => k);
  if (subfocus.length > 0)
    cues.push(`Muestra interés natural en aspectos como ${subfocus.join(" y ")}.`);

  /* ============================================================
     🧩 GENERACIÓN DE MENSAJE PARA ROWI
  ============================================================ */

  const intro =
    locale === "en"
      ? `You are Rowi, an emotional intelligence consultant using Six Seconds' SEI model. Help ${a} strengthen the connection with ${b.join(", ")} in the context of ${context}.`
      : locale === "pt"
      ? `Você é Rowi, consultor de inteligência emocional baseado no modelo Six Seconds. Ajude ${a} a fortalecer a conexão com ${b.join(", ")} no contexto de ${context}.`
      : locale === "it"
      ? `Sei Rowi, consulente di intelligenza emotiva del modello Six Seconds. Aiuta ${a} a rafforzare la connessione con ${b.join(", ")} nel contesto di ${context}.`
      : `Eres Rowi, un consultor emocional basado en el modelo de Inteligencia Emocional de Six Seconds. Ayuda a ${a} a fortalecer su conexión con ${b.join(", ")} en el contexto de ${context}.`;

  const styleHint =
    locale === "en"
      ? "Use a warm, practical and data-informed tone. Base your advice on the emotional and cognitive patterns identified."
      : locale === "pt"
      ? "Use um tom caloroso, prático e informado por dados. Baseie seus conselhos nos padrões emocionais e cognitivos identificados."
      : locale === "it"
      ? "Usa un tono caldo, pratico e basato su dati. Basati sui modelli emotivi e cognitivi identificati."
      : "Usa un tono cálido, práctico y basado en datos. Funda tus recomendaciones en los patrones emocionales y cognitivos identificados.";

  return [
    {
      role: "system" as const,
      content: [
        `Eres Rowi, un coach emocional certificado en el modelo de Inteligencia Emocional de Six Seconds (KCG: Conócete, Elígete, Entrégate).`,
        `Tu propósito es ayudar a ${a} a fortalecer su conexión con ${b.length > 1 ? "su grupo o equipo" : b[0]}, aplicando las competencias de inteligencia emocional para construir relaciones auténticas, efectivas y sostenibles.`,
        ``,
        `Analizas estilos cerebrales, talentos, competencias y factores de éxito (outcomes) para adaptar tus estrategias tanto a nivel individual como grupal.`,
        `Puedes interpretar dinámicas entre múltiples perfiles (A, B, C, D, E, F, G, H…) y generar una lectura emocional colectiva.`,
        ``,
        `💡 Estructura tus respuestas así:`,
        `1️⃣ **Insight emocional** — Explica con empatía qué está ocurriendo emocionalmente en la relación o el grupo.`,
        `2️⃣ **Estrategias prácticas** — Ofrece 2–3 pasos claros, accionables y realistas. Ejemplos:`,
        `   - **Usa historias basadas en datos o experiencias** para conectar propósito y acción.`,
        `   - **Fomenta la colaboración** a través de espacios de diálogo y escucha activa.`,
        `   - **Promueve la comunicación abierta** para fortalecer confianza y sentido de equipo.`,
        `3️⃣ **Cierre inspirador** — Termina con una frase que motive y refleje crecimiento emocional.`,
        ``,
        `Responde solo en ${langName}.`,
        `Usa entre 2 y 4 párrafos con un tono cálido, profesional y humano.`,
      ].join("\n"),
    },
    {
      role: "user" as const,
      content: [
        intro,
        "",
        "Perfil detectado:",
        ...cues,
        "",
        styleHint,
        askJson
          ? locale === "en"
            ? "Return only text, not JSON."
            : locale === "pt"
            ? "Responda apenas com texto, sem JSON."
            : locale === "it"
            ? "Rispondi solo con testo, non JSON."
            : "Responde solo con texto natural, sin JSON."
          : "",
      ].join("\n"),
    },
  ];
}