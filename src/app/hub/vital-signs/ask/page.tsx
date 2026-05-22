"use client";

/**
 * Página del agente Rowi Vital. Recibe query params:
 *   ?scope=team|org|family|world
 *   &subjectId=<id>
 *
 * UI de chat simple: mensajes del usuario + respuestas del modelo,
 * prompts sugeridos según el scope. La API se encarga de cargar el
 * contexto del agregado y construir el system prompt.
 */
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ArrowLeft, Send, Loader2, Sparkles, MessageCircleQuestion } from "lucide-react";

type Scope = "team" | "org" | "family" | "world";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED: Record<Scope, { es: string[]; en: string[] }> = {
  team: {
    es: [
      "¿Cómo puedo aportar más a este equipo?",
      "¿Cuál es el driver más débil del equipo y qué hago al respecto?",
      "¿Qué rol Rowi me toca jugar aquí?",
    ],
    en: [
      "How can I contribute more to this team?",
      "What's the team's weakest driver and what do I do about it?",
      "What Rowi role should I play here?",
    ],
  },
  org: {
    es: [
      "¿Qué quiero aportar a esta organización?",
      "¿Cómo se compara mi perfil con la orientación dominante de la org?",
      "¿Cuál es el capital emocional disponible y dónde está más fuerte?",
    ],
    en: [
      "What do I want to contribute to this organization?",
      "How does my profile compare with the org's dominant orientation?",
      "What's the available emotional capital and where is it strongest?",
    ],
  },
  family: {
    es: [
      "¿Cómo puedo cuidar mejor a mi familia?",
      "¿Qué patrón se repite en nuestro sistema familiar?",
      "¿Dónde puedo aportar más calma o claridad?",
    ],
    en: [
      "How can I take better care of my family?",
      "What pattern repeats in our family system?",
      "Where can I bring more calm or clarity?",
    ],
  },
  world: {
    es: [
      "¿Qué Rowi puedo aportar al mundo?",
      "¿Cómo se ve la humanidad Rowi hoy?",
      "¿Dónde está la mayor oportunidad colectiva?",
    ],
    en: [
      "What Rowi can I bring to the world?",
      "How is Rowi humanity looking today?",
      "Where's the biggest collective opportunity?",
    ],
  },
};

function AskInner() {
  const { lang } = useI18n();
  const isEN = lang === "en";
  const params = useSearchParams();
  const scope = (params.get("scope") as Scope) ?? "world";
  const subjectId = params.get("subjectId") ?? "rowiverse";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: trimmed };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/vital-signs/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          subjectId,
          messages: nextHistory,
          lang: isEN ? "en" : "es",
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error ?? (isEN ? "Could not get reply" : "No pudimos obtener respuesta"));
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }, [scope, subjectId, isEN, sending, messages]);

  const suggestions = SUGGESTED[scope][isEN ? "en" : "es"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--rowi-bg)] to-[var(--rowi-card-elev)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/hub/vital-signs"
            className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEN ? "Back to Vital Signs" : "Volver a Vital Signs"}
          </Link>
          <span className="rowi-chip">
            {scope === "world"
              ? "Rowiverse"
              : scope === "org"
                ? isEN ? "Organization" : "Organización"
                : scope === "team"
                  ? isEN ? "Team" : "Equipo"
                  : isEN ? "Family" : "Familia"}
          </span>
        </div>

        <div className="rowi-card bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border-[var(--rowi-primary)]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">Rowi Vital</h1>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {isEN
                  ? "Coaching assistant grounded in the Six Seconds model. Ask about this context."
                  : "Asistente de coaching basado en el modelo Six Seconds. Preguntá sobre este contexto."}
              </p>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="rowi-card">
            <div className="text-xs uppercase tracking-wider text-[var(--rowi-muted)] mb-3">
              {isEN ? "Suggested questions" : "Preguntas sugeridas"}
            </div>
            <div className="space-y-2">
              {suggestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => send(q)}
                  className="flex items-start gap-2 w-full text-left p-3 rounded-lg bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)]/40 transition-colors text-sm"
                >
                  <MessageCircleQuestion className="w-4 h-4 text-[var(--rowi-primary)] mt-0.5 flex-shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={scrollRef} className="space-y-3 max-h-[60vh] overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white"
                    : "bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] text-[var(--rowi-foreground)]"
                }`}
              >
                {m.content || (
                  <span className="inline-flex items-center gap-1 text-[var(--rowi-muted)]">
                    <Loader2 className="w-3 h-3 animate-spin" /> ...
                  </span>
                )}
              </div>
            </div>
          ))}
          {sending && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5 text-sm bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] inline-flex items-center gap-2 text-[var(--rowi-muted)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isEN ? "Thinking..." : "Pensando..."}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-rose-500">{error}</div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 sticky bottom-0 bg-[var(--rowi-bg)] py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEN ? "Ask anything about this context..." : "Pregunta lo que quieras sobre este contexto..."}
            maxLength={500}
            disabled={sending}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] text-[var(--rowi-foreground)] focus:outline-none focus:border-[var(--rowi-primary)]/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rowi-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isEN ? "Send" : "Enviar"}
          </button>
        </form>

        <div className="text-[10px] text-[var(--rowi-muted-weak)] text-center">
          {isEN
            ? "Replies are generated by AI based on the aggregated profile of this context. Not professional advice."
            : "Las respuestas las genera un modelo de IA basándose en el perfil agregado de este contexto. No es asesoramiento profesional."}
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskInner />
    </Suspense>
  );
}
