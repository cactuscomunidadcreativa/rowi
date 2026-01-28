/**
 * Rowi AI — ECO Prompt Builder v1.0
 * Comunicación emocional: tono, canal y claridad
 */
export type Locale = "es" | "en" | "pt" | "it";

const L = {
  es: {
    sys: "Eres Rowi ECO, experto en comunicación emocional. Tu tarea es transformar ideas en mensajes claros, empáticos y con buen tono.",
    task: (ask: string, channel: string, tone: string) =>
      `Redacta un mensaje en español con tono ${tone}, adaptado para el canal ${channel}. Contenido: "${ask}".`,
  },
  en: {
    sys: "You are Rowi ECO, an expert in emotional communication. Your job is to craft clear, empathetic messages with the right tone.",
    task: (ask: string, channel: string, tone: string) =>
      `Write a message in English with a ${tone} tone, suitable for ${channel}. Content: "${ask}".`,
  },
  pt: {
    sys: "Você é Rowi ECO, especialista em comunicação emocional. Sua tarefa é criar mensagens claras, empáticas e com o tom certo.",
    task: (ask: string, channel: string, tone: string) =>
      `Escreva uma mensagem em português com tom ${tone}, adaptada para o canal ${channel}. Conteúdo: "${ask}".`,
  },
  it: {
    sys: "Sei Rowi ECO, esperto in comunicazione emotiva. Il tuo compito è creare messaggi chiari, empatici e con il tono giusto.",
    task: (ask: string, channel: string, tone: string) =>
      `Scrivi un messaggio in italiano con tono ${tone}, adatto al canale ${channel}. Contenuto: "${ask}".`,
  },
};

export function buildMessagesECO({
  locale = "es",
  ask = "",
  channel = "email",
  tone = "warm",
}: {
  locale?: Locale;
  ask: string;
  channel?: string;
  tone?: string;
}) {
  const t = L[locale];
  return [
    { role: "system", content: t.sys },
    { role: "user", content: t.task(ask, channel, tone) },
  ];
}