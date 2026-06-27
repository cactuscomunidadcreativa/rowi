/**
 * 🎭 Núcleo del AI Practice Partner — ensamblado de prompts y perfil EQ.
 *
 * Reutiliza los seams vivos (become.ts para el foco SEI, generateText
 * multi-proveedor, el AgentConfig "practice" para cultura/conocimiento). No
 * habla con la DB de sesiones: eso vive en la ruta. Aquí solo lógica pura +
 * lecturas de perfil, para que sea testeable y reusable por la puntuación.
 */

import { prisma } from "@/core/prisma";
import type { SeiKey } from "@/lib/vital-signs/catalog";
import type { CompetencyProfile } from "@/lib/today/become";
import { pickFocusSei } from "@/lib/today/become";

const SEI_KEYS: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

/** Perfil de competencias del usuario: SEI formal → mini-SEI → null. */
export async function getCompetencyProfile(userId: string): Promise<CompetencyProfile | null> {
  const snap = await prisma.eqSnapshot.findFirst({
    where: { userId },
    orderBy: { at: "desc" },
    select: { EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true },
  });
  if (snap && SEI_KEYS.some((k) => typeof snap[k] === "number")) {
    return snap as CompetencyProfile;
  }
  const mini = await prisma.miniSeiSnapshot.findFirst({
    where: { userId },
    orderBy: { takenAt: "desc" },
    select: { competencyProfile: true },
  });
  if (mini?.competencyProfile && typeof mini.competencyProfile === "object") {
    return mini.competencyProfile as CompetencyProfile;
  }
  return null;
}

/** Resuelve el foco SEI de la sesión: el del escenario si lo trae, si no el del perfil. */
export async function resolveFocusSei(
  userId: string,
  scenarioFocus: string | null | undefined,
): Promise<SeiKey> {
  if (scenarioFocus && SEI_KEYS.includes(scenarioFocus as SeiKey)) {
    return scenarioFocus as SeiKey;
  }
  const profile = await getCompetencyProfile(userId);
  return pickFocusSei(profile);
}

export interface ScenarioForPrompt {
  title: string;
  brief: string;
  locale: string;
  focusSei?: string | null;
}

/** Etiqueta de idioma para instruir al modelo a responder en ese idioma. */
const LANG_LABEL: Record<string, string> = {
  es: "español",
  en: "English",
  pt: "português",
  it: "italiano",
  zh: "中文 (Chinese)",
};

/**
 * System prompt del partner. Se le antepone (en la ruta) el bloque de cultura +
 * conocimiento del AgentConfig "practice" vía buildAgentPromptContext.
 */
export function buildPartnerSystemPrompt(
  scenario: ScenarioForPrompt,
  focusSei: SeiKey,
  culturePrefix?: string,
): string {
  const lang = LANG_LABEL[scenario.locale] ?? LANG_LABEL.es;
  const base = [
    "Eres un compañero de práctica (roleplay) dentro de Rowi, la plataforma de",
    "inteligencia emocional Six Seconds. Interpretas el personaje del escenario,",
    "NO eres un coach que explica: ENCARNAS la situación para que la persona",
    "practique una conversación real.",
    "",
    `# Escenario: ${scenario.title}`,
    scenario.brief,
    "",
    "# Reglas",
    `- Responde SIEMPRE en ${lang}.`,
    "- Mantente en personaje. Una intervención por turno, natural y breve (2-5 frases).",
    "- Reacciona de forma realista a lo que dice la persona; sube o baja la tensión",
    "  según su habilidad, sin volverte imposible ni demasiado fácil.",
    `- El foco de práctica es la competencia SEI "${focusSei}"; crea oportunidades`,
    "  naturales para que la persona la ejercite, sin nombrarla ni dar lecciones.",
    "- Nunca rompas el personaje ni menciones que eres una IA o un modelo.",
  ].join("\n");
  return culturePrefix ? `${culturePrefix}\n\n---\n${base}` : base;
}

export interface TurnForPrompt {
  role: "USER" | "PARTNER";
  content: string;
}

/**
 * Construye el prompt del usuario para el siguiente turno del partner a partir
 * del historial. `generateText` toma system + un prompt; serializamos el
 * historial como diálogo para mantener el contexto multi-turno.
 */
export function buildTurnPrompt(history: TurnForPrompt[], latestUserMessage: string): string {
  const lines: string[] = [];
  for (const t of history) {
    lines.push(`${t.role === "USER" ? "Persona" : "Tú"}: ${t.content}`);
  }
  lines.push(`Persona: ${latestUserMessage}`);
  lines.push("Tú:");
  return lines.join("\n");
}

/** Tope de tokens del turno del partner (cost-control). */
export const PRACTICE_TURN_MAX_TOKENS = 400;
/** Tope de tokens de la puntuación final (cost-control). */
export const PRACTICE_SCORE_MAX_TOKENS = 700;
/** Máximo de turnos de usuario antes de forzar el cierre. */
export const PRACTICE_MAX_USER_TURNS = 12;
