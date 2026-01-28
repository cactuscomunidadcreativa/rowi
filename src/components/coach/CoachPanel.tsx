"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  profile?: any;             // Perfil completo del /api/eq/me
  insights?: string[];       // Tips iniciales
  title?: string;
};

export default function CoachPanel({
  profile,
  insights,
  title = "EQ Rowi Coach",
}: Props) {

  const defaultList = insights?.length
    ? insights
    : [
        "Practica una micro-pausa de 60 segundos antes de decidir (ACT).",
        "Diseña 2–3 minutos diarios para regular emociones (NE).",
        "Reconoce micro-logros para sostener el optimismo (OP).",
      ];

  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  /** ====== PROMPT AUTOMÁTICO ====== **/
  function buildAutoPrompt() {
    if (!profile) return "Genera una guía emocional breve.";

    const { eq, outcomes, success, mood, brain, user } = profile;

    return `
Eres Rowi Coach, mentor emocional del usuario.

Usuario:
- Nombre: ${user?.name}
- Estilo cerebral: ${brain?.style}
- Estado emocional reciente: ${mood?.recentText} (${mood?.recentEmoji})

Perfil SEI:
- EQ Total: ${eq?.total}
- K/C/G: Know ${eq?.pursuits?.know}, Choose ${eq?.pursuits?.choose}, Give ${eq?.pursuits?.give}

Competencias:
${Object.entries(eq?.competencias || {})
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Factores de Éxito:
${(success || [])
  .map((s: any) => `- ${s.key}: ${s.score}`)
  .join("\n")}

Outcomes:
- Effectiveness: ${outcomes?.effectiveness?.score}
- Relationships: ${outcomes?.relationships?.score}
- Wellbeing: ${outcomes?.wellbeing?.score}
- Quality of Life: ${outcomes?.qualityOfLife?.score}

Talentos:
${Object.entries(eq?.talents?.focus || {})
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Genera:
• 3 fortalezas principales  
• 3 áreas de oportunidad  
• 3 acciones prácticas diarias  
• Mantén un tono cálido y humano  
`;
  }

  /** ====== CONSULTAR A ROWI ====== **/
  async function ask(prompt: string) {
    setThinking(true);
    setResponse(null);

    try {
      const r = await fetch("/api/rowi/eq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ask: prompt, profile, locale: "es" }),
      });

      const data = await r.json();
      setResponse(data.text || "No pude obtener una respuesta ahora.");
    } catch (e) {
      setResponse("Error al procesar la consulta.");
    }

    setThinking(false);
  }

  return (
    <div className="rounded-xl border p-4 shadow-sm space-y-4">

      {/* Título */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-medium">{title}</h3>
      </div>

      {/* Tips iniciales */}
      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
        {defaultList.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>

      {/* Área de consulta */}
      <div className="space-y-2 pt-3 border-t border-gray-700/30">
        <Textarea
          placeholder="Haz una pregunta o cuéntame cómo te sientes…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[80px] text-sm"
        />

        <div className="flex gap-2">
          <Button
            disabled={thinking || question.length < 2}
            onClick={() => ask(question)}
            className="flex gap-1 items-center"
          >
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Preguntar
          </Button>

          <Button
            variant="outline"
            disabled={thinking}
            onClick={() => ask(buildAutoPrompt())}
            className="flex gap-1 items-center"
          >
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Análisis automático
          </Button>
        </div>
      </div>

      {/* Respuesta */}
      {thinking && (
        <div className="text-gray-400 text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rowi está analizando tu perfil emocional…
        </div>
      )}

      {response && (
        <div className="p-4 rounded-md bg-gray-800/40 border border-gray-700/40 text-sm leading-relaxed whitespace-pre-line">
          {response}
        </div>
      )}
    </div>
  );
}