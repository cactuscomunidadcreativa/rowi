// src/ai/client.ts
/**
 * Cliente unificado de Rowi para IA + APIs internas seguras
 * - Permite llamadas a OpenAI
 * - Permite fetch con autenticación (cookies incluidas)
 */

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

type ChatOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

/* =========================================================
   🔒 FETCH CON AUTENTICACIÓN (INCLUYE COOKIES)
========================================================= */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: "include", // 🔥 envia cookies de sesión JWT
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok && res.status !== 404) {
    console.warn(`⚠️ fetchWithAuth error [${res.status}]: ${url}`);
  }

  return res;
}

/* =========================================================
   🧠 CLIENTE OPENAI (CHAT COMPLETIONS)
========================================================= */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("❌ OPENAI_API_KEY no está definido en .env.local");
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.max_tokens ?? 500,
      messages,
    }),
  });

  if (!res.ok) {
    const details = await safeJson(res);
    throw new Error(
      `OpenAI ${res.status}: ${JSON.stringify(details ?? (await res.text()))}`
    );
  }

  const data = (await res.json()) as any;
  const text =
    data?.choices?.[0]?.message?.content?.toString() ?? "(sin respuesta)";
  return text;
}

/* =========================================================
   🧩 HELPER: PARSE JSON SEGURO
========================================================= */
async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}