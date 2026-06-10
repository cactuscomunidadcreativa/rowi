/**
 * 🧩 Generador del PERFIL INTEGRAL formato Rowi (Rowi Consultor).
 *
 * Ensambla el "perfil Carolina": SEI (competencias + talentos + outcomes +
 * estilos) + Vital Signs (pulse points + drivers) + el mapa de PUNTOS CIEGOS
 * (cruce SEI↔VS) + una narrativa de diagnóstico generada por IA.
 *
 * La narrativa respeta la Guía Confidencial del Partner (Bancolombia):
 *   - El SEI/VS es un ESPEJO, no un veredicto.
 *   - Una emoción/lectura por vez; curiosidad antes que juicio.
 *   - NUNCA etiquetar (burnout, depresión, etc.) ni diagnosticar clínicamente.
 *   - SEI ≠ Clima: el cruce es brecha de autoconciencia, no predicción.
 *   - Empezar por la fortaleza alineada antes de explorar el punto ciego.
 */
import {
  buildBlindspotMap,
  summarizeBlindspots,
  type BlindspotRow,
  type BlindspotMapInput,
} from "@/lib/consultant/blindspot-map";
import { PULSE_POINTS, type PulsePointCode, type SeiKey } from "@/lib/vital-signs/catalog";

export interface IntegralProfileInput {
  subjectLabel: string; // "Carolina Navarro" o "Equipo Soraya (agregado)"
  scope: "individual" | "cohort";
  vsInstrument: "LVS" | "TVS" | "OVS";
  competencies: BlindspotMapInput["competencies"];
  talents: BlindspotMapInput["talents"];
  pulses: BlindspotMapInput["pulses"];
  /** Outcomes/sub-outcomes opcionales para mostrar (no entran al cruce). */
  outcomes?: Record<string, number>;
  locale?: "es" | "en";
}

export interface IntegralProfile {
  subjectLabel: string;
  scope: "individual" | "cohort";
  vsInstrument: "LVS" | "TVS" | "OVS";
  blindspotMap: BlindspotRow[];
  summary: ReturnType<typeof summarizeBlindspots>;
  /** narrativa IA del diagnóstico; null si la IA no está configurada */
  diagnosis: string | null;
}

function ppName(code: PulsePointCode, locale: "es" | "en"): string {
  const pp = PULSE_POINTS.find((p) => p.code === code);
  if (!pp) return code;
  return locale === "en" ? pp.enName : pp.esName;
}

const SEI_NAMES: Record<SeiKey, string> = {
  EL: "Alfabetización Emocional", RP: "Reconocer Patrones", ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones", IM: "Motivación Intrínseca", OP: "Optimismo",
  EMP: "Empatía", NG: "Metas Nobles",
};

/** Describe el mapa de puntos ciegos en prosa breve para el prompt (sin números crudos). */
function blindspotsForPrompt(rows: BlindspotRow[], locale: "es" | "en"): string {
  const s = summarizeBlindspots(rows);
  const lines: string[] = [];
  if (s.aligned.length) {
    lines.push(
      `ALINEADO (fortaleza real, se cree fuerte y su capacidad lo respalda): ` +
        s.aligned.map((r) => ppName(r.pulse, locale)).join(", "),
    );
  }
  if (s.blindspots.length) {
    lines.push(
      `PUNTO CIEGO (se cree fuerte pero su capacidad SEI/talento está por debajo de su media): ` +
        s.blindspots.map((r) => ppName(r.pulse, locale)).join(", "),
    );
  }
  if (s.hidden.length) {
    lines.push(
      `OCULTO (se subvalora teniendo capacidad real — fortaleza no reclamada): ` +
        s.hidden.map((r) => ppName(r.pulse, locale)).join(", "),
    );
  }
  return lines.join("\n");
}

const SYSTEM_ES = `Eres un consultor de inteligencia emocional formado en la metodología Six Seconds.
Escribes el diagnóstico de un perfil integral SEI + Vital Signs como un ESPEJO para la persona, no como un veredicto.

REGLAS INVIOLABLES:
- El SEI/VS es un espejo, no una etiqueta. NUNCA uses términos clínicos (burnout, depresión, ansiedad, etc.).
- SEI ≠ Clima: el cruce es una lectura de AUTOCONCIENCIA (dónde se cree fuerte vs dónde su capacidad lo sostiene), NO una predicción ni una causa-efecto.
- Empieza reconociendo la fortaleza ALINEADA antes de explorar el punto ciego.
- Una lectura por vez. Curiosidad antes que juicio. Lenguaje cálido, en segunda persona ("tú").
- No inventes números. Usa solo lo que se te da. Si no hay datos de algo, no lo menciones.
- 3-5 párrafos breves. Cierra con una pregunta abierta de coaching, no con un consejo.`;

const SYSTEM_EN = `You are an emotional-intelligence consultant trained in the Six Seconds methodology.
You write the diagnosis of an integral SEI + Vital Signs profile as a MIRROR for the person, not a verdict.

INVIOLABLE RULES:
- The SEI/VS is a mirror, not a label. NEVER use clinical terms (burnout, depression, anxiety, etc.).
- SEI ≠ Climate: the cross-read is a SELF-AWARENESS reading (where they believe they're strong vs where their capacity supports it), NOT a prediction or cause-effect.
- Start by acknowledging the ALIGNED strength before exploring the blind spot.
- One reading at a time. Curiosity over judgment. Warm, second-person language ("you").
- Do not invent numbers. Use only what you're given. If data is missing, don't mention it.
- 3-5 short paragraphs. Close with an open coaching question, not advice.`;

/**
 * Genera el perfil integral. La narrativa IA es opcional (si no hay proveedor
 * configurado, diagnosis = null y el perfil estructurado igual se devuelve).
 */
export async function generateIntegralProfile(
  input: IntegralProfileInput,
  opts?: { withNarrative?: boolean },
): Promise<IntegralProfile> {
  const locale = input.locale ?? "es";
  const blindspotMap = buildBlindspotMap({
    competencies: input.competencies,
    talents: input.talents,
    pulses: input.pulses,
  });
  const summary = summarizeBlindspots(blindspotMap);

  let diagnosis: string | null = null;
  if (opts?.withNarrative !== false) {
    try {
      const topComps = (Object.entries(input.competencies) as [SeiKey, number][])
        .filter(([, v]) => typeof v === "number")
        .sort((a, b) => b[1] - a[1]);
      const compLine = topComps
        .map(([k, v]) => `${SEI_NAMES[k] ?? k}=${Math.round(v)}`)
        .join(", ");

      const prompt = `Sujeto: ${input.subjectLabel} (${input.scope === "cohort" ? "lectura de equipo/cohorte agregada" : "lectura individual"}).
Instrumento VS: ${input.vsInstrument}.

Competencias SEI (capacidad real): ${compLine}

Mapa de autoconciencia (cruce SEI↔VS):
${blindspotsForPrompt(blindspotMap, locale)}

Escribe el diagnóstico-espejo siguiendo tus reglas.`;

      // Import dinámico: solo carga el SDK de IA si de verdad se genera narrativa
      // (mantiene el módulo importable en tests/edge sin tocar el SDK).
      const { generateText } = await import("@/lib/ai/generate");
      const result = await generateText({
        provider: "anthropic",
        system: locale === "en" ? SYSTEM_EN : SYSTEM_ES,
        prompt,
        maxTokens: 900,
        temperature: 0.6,
        allowFallback: true,
      });
      diagnosis = result.text || null;
    } catch (e) {
      console.error("[profile-generator] narrative failed:", e);
      diagnosis = null;
    }
  }

  return {
    subjectLabel: input.subjectLabel,
    scope: input.scope,
    vsInstrument: input.vsInstrument,
    blindspotMap,
    summary,
    diagnosis,
  };
}
