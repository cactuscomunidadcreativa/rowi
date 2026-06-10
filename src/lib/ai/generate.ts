/**
 * =========================================================
 * 🤖 generateText — generación de texto multi-proveedor
 * =========================================================
 *
 * Una sola función para generar texto con OpenAI o Claude, eligiendo
 * el proveedor por tarea. El código de negocio no necesita conocer los
 * SDKs: pide texto y elige proveedor.
 *
 * - OpenAI (default): chat ligero, clasificación, inferencias rápidas.
 * - Anthropic (Claude): tareas pesadas — consultor, reportes,
 *   presentaciones, análisis largos.
 *
 * Respeta el cap de tokens (feedback_token_caps): max_tokens siempre
 * obligatorio. Si el proveedor elegido no está configurado, cae al otro
 * (degradación elegante) salvo que se pida estricto.
 *
 * USO:
 * ```ts
 * const text = await generateText({
 *   provider: "anthropic",      // o "openai"
 *   system: "Eres un consultor EQ de Six Seconds.",
 *   prompt: "Analiza estos hallazgos: ...",
 *   maxTokens: 4000,
 * });
 * ```
 */

import { getOpenAIClient } from "@/lib/openai/client";
import { getAnthropicClient, CLAUDE_MODELS } from "@/lib/anthropic/client";

export type AIProvider = "openai" | "anthropic";

export type GenerateTextParams = {
  /** Proveedor. Default "openai". */
  provider?: AIProvider;
  /** Instrucción de sistema (rol/persona). */
  system?: string;
  /** El prompt del usuario. */
  prompt: string;
  /** Tope de tokens de salida (obligatorio — control de costo). */
  maxTokens: number;
  /** Modelo explícito. Si se omite, default por proveedor. */
  model?: string;
  /** 0..1. Default 0.6. */
  temperature?: number;
  /** Si el proveedor pedido falla/no está configurado, ¿caer al otro? Default true. */
  allowFallback?: boolean;
};

export type GenerateTextResult = {
  text: string;
  provider: AIProvider;
  model: string;
};

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** Genera texto con OpenAI. */
async function viaOpenAI(p: GenerateTextParams): Promise<GenerateTextResult> {
  const openai = await getOpenAIClient();
  const model = p.model ?? DEFAULT_OPENAI_MODEL;
  const completion = await openai.chat.completions.create({
    model,
    temperature: p.temperature ?? 0.6,
    max_tokens: p.maxTokens,
    messages: [
      ...(p.system ? [{ role: "system" as const, content: p.system }] : []),
      { role: "user" as const, content: p.prompt },
    ],
  });
  return {
    text: completion.choices?.[0]?.message?.content?.trim() ?? "",
    provider: "openai",
    model,
  };
}

/** Genera texto con Claude (Anthropic). */
async function viaAnthropic(p: GenerateTextParams): Promise<GenerateTextResult> {
  const claude = await getAnthropicClient();
  const model = p.model ?? CLAUDE_MODELS.heavy;
  const msg = await claude.messages.create({
    model,
    max_tokens: p.maxTokens,
    ...(p.system ? { system: p.system } : {}),
    messages: [{ role: "user", content: p.prompt }],
  });
  // El contenido es un array de bloques; concatenar los de texto.
  const text = msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  return { text, provider: "anthropic", model };
}

/**
 * Genera texto con el proveedor elegido. Si falla y allowFallback,
 * intenta con el otro proveedor antes de propagar el error.
 */
export async function generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
  const provider = params.provider ?? "openai";
  const allowFallback = params.allowFallback !== false;

  try {
    return provider === "anthropic" ? await viaAnthropic(params) : await viaOpenAI(params);
  } catch (e) {
    if (!allowFallback) throw e;
    // Degradación: intenta con el otro proveedor (sin model explícito,
    // que sería del proveedor original).
    const fallbackParams = { ...params, model: undefined };
    try {
      return provider === "anthropic"
        ? await viaOpenAI(fallbackParams)
        : await viaAnthropic(fallbackParams);
    } catch {
      // Si ambos fallan, propaga el error original (más informativo).
      throw e;
    }
  }
}
