// apps/rowi/src/lib/google/translate.ts

/**
 * 🌍 translateText()
 * Traducción automática GRATUITA usando la API pública de Google Translate.
 * No requiere credenciales ni costos.
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return "";

  try {
    // Google Translate endpoint público
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    // La respuesta de Google es un array tipo: [[[ "Texto traducido", "Texto original", ... ]]]
    const translated = data?.[0]?.[0]?.[0];
    return translated || text;
  } catch (err) {
    console.error("⚠️ Error en translateText:", err);
    return text;
  }
}