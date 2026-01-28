// src/ai/prompts/modules/rowi-coach.ts
type Payload = {
  ask?: string;            // mensaje real del usuario
  locale?: "es" | "en" | "pt";
  mood?: string;
  context?: string;
  minutes?: number;
};

/**
 * ROWI COACH — ADAPTIVE PROMPT v2
 * Responde ejercicios SOLO si el usuario los pide.
 * Responde normal en cualquier otro caso.
 */
export function buildMessagesRowiCoach(p: Payload = {}) {
  const locale = p.locale ?? "es";
  const ask = p.ask ?? "";
  const mood = p.mood ?? "neutral";
  const ctx  = p.context ?? "contexto general";
  const mins = p.minutes ?? 3;

  const system =
    locale === "es"
      ? `
Eres Rowi Coach, un asistente ADAPTATIVO de Inteligencia Emocional.

REGLA CENTRAL:
⭐ Si el usuario pide un ejercicio, práctica, técnica o regulación → dale un micro-ejercicio breve y accionable.
⭐ Si NO pide un ejercicio → responde SOLO lo que pregunta, de manera clara, directa y sin extenderte.
⭐ Responde siempre en español.
      `.trim()
      : locale === "en"
      ? `
You are Rowi Coach, an ADAPTIVE emotional-intelligence assistant.

⭐ If the user asks for an exercise or technique → give a short actionable micro-exercise.
⭐ If they do NOT ask for an exercise → just answer normally, short and clear.
⭐ Always answer in English.
      `.trim()
      : `
Você é Rowi Coach, um assistente ADAPTATIVO de inteligência emocional.

⭐ Quando o usuário pedir um exercício → dê um micro-exercício claro e curto.
⭐ Se NÃO pedir → responda normalmente, de forma direta.
⭐ Sempre responda em português.
      `.trim();

  // Detectar si el usuario realmente pidió un ejercicio
  const userAskedExercise = /ejercicio|exercise|práctica|pratica|respirar|regulación/i.test(ask);

  // Mensaje del usuario para el modelo
  let userContent = "";

  if (locale === "es") {
    userContent = userAskedExercise
      ? `Quiero un micro-ejercicio (${mins} min) para manejar la emoción: ${mood}, en el contexto: ${ctx}.`
      : `Responde a la pregunta de forma breve y clara: "${ask}"`;
  } else if (locale === "en") {
    userContent = userAskedExercise
      ? `I want a micro-exercise (${mins} min) to manage the emotion: ${mood}, in the context: ${ctx}.`
      : `Answer clearly and briefly: "${ask}"`;
  } else {
    userContent = userAskedExercise
      ? `Quero um micro-exercício (${mins} min) para lidar com a emoção: ${mood}, no contexto: ${ctx}.`
      : `Responda de forma clara e breve: "${ask}"`;
  }

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: userContent },
  ];
}