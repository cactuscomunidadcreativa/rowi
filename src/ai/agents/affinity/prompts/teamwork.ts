// src/ai/agents/affinity/prompts/teamwork.ts

/**
 * 🧩 buildTeamworkPrompt
 * ----------------------------------------------------------
 * Genera el prompt principal para el agente de afinidad "Teamwork"
 * utilizado por Rowi para analizar la colaboración emocional en equipos.
 */
export function buildTeamworkPrompt({
  locale = "es",
  data = {},
  context = "team collaboration",
}: {
  locale?: string;
  data?: Record<string, any>;
  context?: string;
}) {
  const lang =
    locale === "en"
      ? "English"
      : locale === "pt"
      ? "Português"
      : locale === "it"
      ? "Italiano"
      : "Español";

  const summary =
    typeof data === "object"
      ? JSON.stringify(data, null, 2)
      : "Sin datos específicos de afinidad de equipo.";

  return `
Eres Rowi, un coach de inteligencia emocional especializado en trabajo en equipo.
Tu tarea es analizar la afinidad emocional y la colaboración entre los miembros del equipo.

Idioma: ${lang}.
Contexto: ${context}.

Datos del equipo:
${summary}

Proporciona una respuesta con:
1. Diagnóstico breve sobre clima y comunicación del equipo.
2. Sugerencias concretas para fortalecer la sinergia y empatía.
3. Una frase final inspiradora o una pregunta reflexiva.

Usa un tono cálido, estratégico y realista.
`;
}