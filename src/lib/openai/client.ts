/**
 * =========================================================
 * 🤖 OpenAI Client — Cliente centralizado de OpenAI
 * =========================================================
 *
 * Este módulo proporciona un cliente de OpenAI configurado
 * que obtiene la API key de forma segura:
 * 1. Primero intenta obtener de la base de datos (SystemConfig)
 * 2. Si no existe, usa la variable de entorno como fallback
 *
 * USO:
 * ```ts
 * import { getOpenAIClient } from "@/lib/openai/client";
 *
 * const openai = await getOpenAIClient();
 * const response = await openai.chat.completions.create({...});
 * ```
 */

import OpenAI from "openai";
import { getSystemConfig } from "@/lib/config/systemConfig";

// Cache del cliente para evitar crear múltiples instancias
let cachedClient: OpenAI | null = null;
let cachedApiKey: string | null = null;

/**
 * Obtiene un cliente de OpenAI configurado con la API key del sistema
 */
export async function getOpenAIClient(): Promise<OpenAI> {
  // Obtener API key desde BD o env
  const apiKey = await getSystemConfig("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY no está configurada. Ve a Admin > Configuración para configurarla."
    );
  }

  // Si la key cambió, crear nuevo cliente
  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  // Crear nuevo cliente
  cachedClient = new OpenAI({ apiKey });
  cachedApiKey = apiKey;

  return cachedClient;
}

/**
 * Obtiene la API key directamente (para casos donde no se puede usar async)
 * NOTA: Preferir usar getOpenAIClient() cuando sea posible
 */
export function getOpenAIApiKeySync(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada en variables de entorno");
  }
  return apiKey;
}

/**
 * Verifica si OpenAI está configurado
 */
export async function isOpenAIConfigured(): Promise<boolean> {
  const apiKey = await getSystemConfig("OPENAI_API_KEY");
  return !!apiKey;
}

/**
 * Invalida el cache del cliente (útil cuando se actualiza la API key)
 */
export function invalidateOpenAIClientCache(): void {
  cachedClient = null;
  cachedApiKey = null;
}
