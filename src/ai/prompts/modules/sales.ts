/**
 * Rowi AI — Sales Prompt Builder v1.0
 * Comunicación persuasiva emocional (ventas y objeciones)
 */
export type Locale = "es" | "en" | "pt" | "it";

const L = {
  es: {
    sys: "Eres Rowi Sales, experto en ventas con inteligencia emocional. Tu objetivo es entender la necesidad del cliente, conectar emocionalmente y ofrecer soluciones con empatía y claridad.",
    ask: (ask: string) =>
      `En español, analiza la situación y redacta una respuesta que conecte con el cliente, muestre empatía y motive a la acción: "${ask}".`,
  },
  en: {
    sys: "You are Rowi Sales, expert in emotional intelligence for sales. Your goal is to understand the client’s need, connect emotionally and offer solutions with empathy and clarity.",
    ask: (ask: string) =>
      `In English, analyze the situation and craft a persuasive, empathetic response: "${ask}".`,
  },
  pt: {
    sys: "Você é Rowi Sales, especialista em vendas com inteligência emocional. Entenda o cliente, crie conexão e ofereça soluções com empatia.",
    ask: (ask: string) =>
      `Em português, analise a situação e crie uma resposta empática e motivadora: "${ask}".`,
  },
  it: {
    sys: "Sei Rowi Sales, esperto in vendite con intelligenza emotiva. Comprendi il cliente e offri soluzioni con empatia e chiarezza.",
    ask: (ask: string) =>
      `In italiano, analizza la situazione e scrivi una risposta empatica e convincente: "${ask}".`,
  },
};

export function buildMessagesSales({ locale = "es", ask }: { locale?: Locale; ask: string }) {
  const t = L[locale];
  return [
    { role: "system", content: t.sys },
    { role: "user", content: t.ask(ask) },
  ];
}