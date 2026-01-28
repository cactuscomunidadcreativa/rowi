// src/ai/agents/super.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { EqAgent } from "./eq";
import { AffinityAgent } from "./affinity";
import { SalesAgent } from "./sales";
import { EcoAgent } from "./eco";
import { registerUsage } from "../client/registerUsage";
import { getTenantCulture, buildSuperAgentPrompt } from "./getAgentConfig";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const SuperAgent = {
  id: "super",
  name: "Super Rowi",
  model: "gpt-4o-mini",
  color: "#d797cf",

  /**
   * 🧠 Ejecuta Super Rowi — coordinador multimodal
   */
  async run({
    ask,
    locale = "es",
    tenantId = "rowi-master",
    a,
    attachments = [],
    audio,
  }: {
    ask: string;
    locale?: string;
    tenantId?: string;
    a?: string;
    attachments?: { name: string; type: string; path: string }[];
    audio?: string;
  }): Promise<{ text: string; audioUrl?: string }> {
    try {
      /* 🏢 0. Cargar cultura corporativa COMPLETA del tenant (todos los agentes) */
      const tenantCulture = await getTenantCulture(tenantId);

      /* =========================================================
         🌍 1. Definir idioma y entrada
      ========================================================= */
      const language =
        locale === "en"
          ? "English"
          : locale === "pt"
          ? "Português"
          : locale === "it"
          ? "Italiano"
          : "Español";

      let fullPrompt = ask;

      /* =========================================================
         🎙️ 2. Si viene audio, primero transcribirlo
      ========================================================= */
      if (audio) {
        const buffer = Buffer.from(audio, "base64");
        const tempFile = path.join("/tmp", `input-${Date.now()}.mp3`);
        fs.writeFileSync(tempFile, buffer);

        const transcript = await ai.audio.transcriptions.create({
          file: fs.createReadStream(tempFile),
          model: "gpt-4o-mini-transcribe",
        });

        fullPrompt = transcript.text || ask;
      }

      const lower = fullPrompt.toLowerCase();

      /* =========================================================
         🧭 3. Detectar intención general
      ========================================================= */
      const isSales =
        lower.includes("vender") ||
        lower.includes("certificación") ||
        lower.includes("cliente") ||
        lower.includes("ofrecer");

      const isAffinity =
        lower.includes("relación") ||
        lower.includes("afinidad") ||
        lower.includes("comunicarme") ||
        lower.includes("equipo");

      const isMessage =
        lower.includes("mensaje") ||
        lower.includes("escribir") ||
        lower.includes("linkedin") ||
        lower.includes("correo");

      const isEQ =
        lower.includes("estrés") ||
        lower.includes("emocion") ||
        lower.includes("sentir") ||
        lower.includes("ansiedad") ||
        lower.includes("autoconciencia");

      /* =========================================================
         🧩 4. Recolectar resultados parciales de subagentes
      ========================================================= */
      const parts: string[] = [];

      if (isEQ)
        parts.push(
          `🧠 *EQ Coach dice:* ${await EqAgent.run({
            locale,
            ask: fullPrompt,
            tenantId,
          })}`
        );

      if (isAffinity)
        parts.push(
          `🤝 *Affinity Coach dice:* ${await AffinityAgent.run({
            locale: locale as "es" | "en" | "pt" | "it",
            ask: fullPrompt,
            tenantId,
            a,
          })}`
        );

      if (isSales)
        parts.push(
          `💼 *Sales Coach dice:* ${await SalesAgent.run({
            locale,
            ask: fullPrompt,
            tenantId,
          })}`
        );

      if (isMessage)
        parts.push(
          `💬 *ECO Coach propone:* ${await EcoAgent.run({
            locale,
            ask: fullPrompt,
            tenantId,
          })}`
        );

      /* =========================================================
         📎 5. Análisis de archivos adjuntos
      ========================================================= */
      if (attachments?.length) {
        for (const att of attachments) {
          const summary = await this.analyzeAttachment(att, language);
          parts.push(`📎 *Archivo ${att.name}*: ${summary}`);
        }
      }

      // Fallback a EQ Coach
      if (parts.length === 0)
        parts.push(
          `🧭 *EQ Coach:* ${await EqAgent.run({ locale, ask: fullPrompt })}`
        );

      /* =========================================================
         💡 6. Preparar prompt final fusionado
      ========================================================= */
      const lengthScore =
        fullPrompt.length < 150 ? 0.3 : fullPrompt.length < 400 ? 0.6 : 1.0;
      const maxTokens = Math.round(600 + lengthScore * 600);

      /* 👤 Nombre del usuario (si está autenticado) */
      const userName = a ? `Usuario actual: ${a}.` : "Usuario anónimo.";

      const mergedPrompt = [
        `Eres Super Rowi, asistente integral de inteligencia emocional y comunicación.`,
        `Idioma: ${language}. Tono cálido, empático, humano y accionable.`,
        userName, // 👈 agregado aquí
        `Combina las perspectivas y da una respuesta fluida, breve pero completa.`,
        `=== Subagentes ===\n${parts.join("\n\n")}`,
        `=== Entrada del usuario ===\n${fullPrompt}`,
      ].join("\n\n");

      /* =========================================================
         🚀 7. Llamado final a OpenAI — Fusión inteligente
         ⚠️ SuperAgent carga la CULTURA COMPLETA del tenant
         incluyendo la lista de todos los agentes disponibles
      ========================================================= */
      const baseSystemPrompt = `Eres Super Rowi, el coordinador principal de inteligencia emocional.
Tu rol es orquestar a los agentes especializados y dar respuestas integradas.
Combina las perspectivas de cada agente en una respuesta fluida y accionable.`;

      const systemPrompt = buildSuperAgentPrompt(baseSystemPrompt, tenantCulture, language);

      const completion = await ai.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: mergedPrompt },
        ],
      });

      const text =
        completion.choices?.[0]?.message?.content?.trim() ||
        "No pude generar una respuesta ahora.";

      /* =========================================================
         📊 8. Registro del uso IA (tokens y costo)
      ========================================================= */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

      await registerUsage({
        tenantId,
        feature: "SUPER",
        model: this.model,
        tokensInput,
        tokensOutput,
        costUsd,
      });

      /* =========================================================
         🔊 9. Generar voz del resultado (solo si aplica)
      ========================================================= */
      let audioUrl: string | undefined;

      if (audio) {
        const speech = await ai.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: text,
        });

        const audioPath = path.join("/tmp", `rowi-${Date.now()}.mp3`);
        const buffer = Buffer.from(await speech.arrayBuffer());
        fs.writeFileSync(audioPath, buffer);

        audioUrl = `file://${audioPath}`;
      }

      /* 💬 Retornar texto + audio (solo si hay) */
      return { text, audioUrl };
    } catch (e: any) {
      console.error("[Super Rowi] Error:", e);
      return {
        text:
          e?.message ||
          "Hubo un problema al procesar tu solicitud. Inténtalo nuevamente.",
      };
    }
  },

  /**
   * 🔍 Analiza archivos adjuntos (texto, imagen, PDF)
   */
  async analyzeAttachment(
    att: { name: string; type: string; path: string },
    language: string
  ): Promise<string> {
    try {
      const prompt = [
        `Analiza este archivo (${att.name}).`,
        `Responde en ${language} con un resumen emocionalmente relevante y 1 idea práctica.`,
      ].join("\n");

      const completion = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `Eres Rowi Analyst. Responde solo en ${language}.`,
          },
          { role: "user", content: prompt },
        ],
      });

      /* 📊 Registro IA también para análisis de adjuntos */
      const tokensInput = completion.usage?.prompt_tokens || 0;
      const tokensOutput = completion.usage?.completion_tokens || 0;
      const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

      await registerUsage({
        tenantId: "rowi-master",
        feature: "SUPER_ANALYSIS",
        model: "gpt-4o-mini",
        tokensInput,
        tokensOutput,
        costUsd,
      });

      return (
        completion.choices?.[0]?.message?.content?.trim() || "Sin detalles."
      );
    } catch (e: any) {
      return `No se pudo analizar ${att.name}: ${e?.message}`;
    }
  },
};