import { buildMessagesAffinity } from "../prompts/modules/affinity";
import { registerUsage } from "../client/registerUsage";
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig";
import { getOpenAIClient } from "@/lib/openai/client";

export const AffinityAgent = {
  id: "affinity",
  name: "Rowi Affinity Coach",
  color: "#d797cf",
  model: "gpt-4o-mini",

async run({
  locale = "es",
  a = "Tú",
  bNames = ["la otra persona"],
  project = "relationship",
  context = "mejorar conexión y entendimiento",
  ask = "",
  profiles = {},
  memoryContext = [],
  tenantId = "six-seconds-global",
}: {
  locale?: "es" | "en" | "pt" | "it";
  a?: string;
  bNames?: string[];
  project?: string;
  context?: string;
  ask?: string;
  profiles?: Record<string, any>;
  memoryContext?: any[];
  tenantId?: string;
}) {
      try {
      /* 🔐 Obtener cliente de OpenAI */
      const ai = await getOpenAIClient();

      /* 🏢 0. Cargar cultura corporativa del tenant */
      const agentConfig = await getAgentConfig("affinity", tenantId);

      /* 🌍 Idioma */
      const langName =
        locale === "en" ? "English" :
        locale === "pt" ? "Português" :
        locale === "it" ? "Italiano" : "Español";

      /* =========================================================
         🧩 1. Perfil Insight Block — resumen de A y del grupo B
      ========================================================= */
      const insights: string[] = [];

      // Perfil propio (A)
      if (profiles.A) {
        const A = profiles.A;
        insights.push(`Tu estilo cerebral es **${A.brainStyle || "no definido"}**, con talentos destacados en ${
          Object.keys(A.talents || {}).slice(0,3).join(", ") || "adaptabilidad y comunicación"
        }.`);
      }

      // Perfiles de otras personas / grupo
      const letters = Object.keys(profiles).filter(k => k !== "A");
      if (letters.length > 0) {
        letters.forEach((k, idx) => {
          const p = profiles[k];
          if (!p) return;
          insights.push(
            `${p.name || bNames[idx] || "Integrante"} muestra un estilo **${p.brainStyle || "no identificado"}**, ` +
            `con talentos en ${Object.keys(p.talents || {}).slice(0,3).join(", ") || "colaboración y empatía"}.`
          );
        });
      }

      /* =========================================================
         💓 2. Emotional Tone Block — detectar emoción del usuario
      ========================================================= */
      let emotionTone = "neutral";
      if (/frustrad|cansad|molest/i.test(ask)) emotionTone = "frustrated";
      else if (/feliz|entusiasm|content/i.test(ask)) emotionTone = "positive";
      else if (/confund|dud|no entiendo/i.test(ask)) emotionTone = "uncertain";
      else if (/preocupad|ansios/i.test(ask)) emotionTone = "anxious";

      const toneLine =
        emotionTone === "frustrated"
          ? "Percibo algo de frustración; responderé con claridad y calma."
          : emotionTone === "positive"
          ? "Noto motivación; mantendré el tono propositivo y enfocado."
          : emotionTone === "uncertain"
          ? "Detecto duda; te daré una guía sencilla y directa."
          : emotionTone === "anxious"
          ? "Siento ansiedad en tu mensaje; te ayudaré a estructurar pasos concretos."
          : "Mantendré un tono empático y estratégico.";

      /* =========================================================
         💬 3. Tactical Response Block — construcción del prompt
      ========================================================= */
      const memorySummary = memoryContext?.length
        ? `Último tema: ${memoryContext[memoryContext.length-1]?.content?.slice(0,100)}...`
        : "";

      const userMessage = [
        `Contexto: ${context}.`,
        memorySummary,
        toneLine,
        insights.join(" "),
        "",
        ask?.trim() || "Ayúdame a encontrar la mejor forma de conectar con ellos.",
        "",
        "Responde con máximo 2 párrafos y 3 bullets claros. Usa ejemplos naturales según el estilo cerebral y talentos del grupo."
      ].join("\n");

      /* =========================================================
         🚀 Llamado a OpenAI
         ⚠️ El prompt base se mantiene aquí para seguir editándolo
      ========================================================= */
      const basePrompt = `Eres Rowi, un coach táctico de afinidad interpersonal del modelo Six Seconds.
Responde solo en ${langName}, con lenguaje cálido, humano y breve.
Si hay varios nombres, habla del grupo en conjunto.
No repitas estructuras genéricas; entrega una visión concreta y accionable.`;

      // Agregar cultura corporativa SIN modificar el prompt base
      const systemPrompt = buildCultureEnrichedPrompt(basePrompt, agentConfig, langName);

      const completion = await ai.chat.completions.create({
        model: agentConfig?.model || this.model,
        temperature: 0.6,
        max_tokens: 380,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          },
        ],
      });

      const text = completion.choices?.[0]?.message?.content?.trim() || "";

      /* =========================================================
         📊 3. Registro del uso IA (tokens y costo)
      ========================================================= */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002; // gpt-4o-mini cost aprox

      await registerUsage({
        tenantId,
        feature: "AFFINITY",
        model: this.model,
        tokensInput,
        tokensOutput,
        costUsd,
      });      
      
      return (
        text ||
        {
          es: "💭 No tengo una táctica clara aún, pero podrías comenzar escuchando y observando su tono antes de responder.",
          en: "💭 No clear tactic yet — start by observing tone and timing before reacting.",
          pt: "💭 Ainda sem uma tática clara; comece observando o tom e o momento certo.",
          it: "💭 Nessuna tattica chiara; inizia osservando il tono e il tempismo.",
        }[locale]
      );
    } catch (e: any) {
      console.error("[AffinityAgent] error:", e);
      return (
        e?.message ||
        {
          es: "Error procesando la afinidad.",
          en: "Error processing affinity.",
          pt: "Erro ao processar afinidade.",
          it: "Errore durante l'elaborazione dell'affinità.",
        }[locale]
      );
    }
  },
};