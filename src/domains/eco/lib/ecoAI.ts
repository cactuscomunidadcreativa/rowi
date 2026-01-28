// src/domains/eco/domains/eco/libAI.ts
export function isEcoLLMEnabled() {
  const flag = (process.env.NEXT_PUBLIC_ECO_LLM || process.env.ECO_LLM || "").toLowerCase();
  return (flag === "1" || flag === "true") && !!process.env.OPENAI_API_KEY;
}
