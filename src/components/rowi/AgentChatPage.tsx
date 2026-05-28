"use client";

/**
 * Reusable full-page chat surface for a single Rowi agent (intent).
 * Posts to /api/rowi with the given intent; server resolves the AgentConfig,
 * applies the token cap and persists history. Used by /ventas, /asesor and the
 * research chat — keep agent-specific copy in the page, not here.
 */

import * as React from "react";
import { Send, Loader2, Sparkles, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Message = { id: string; role: "user" | "assistant"; text: string };

const uid = () => Math.random().toString(36).slice(2, 9);

interface AgentChatPageProps {
  intent: string;
  title: string;
  subtitle: string;
  /** Suggested opening prompts shown on the empty state. */
  starters?: string[];
  /** Short method/how-it-works steps shown on the empty state. */
  intro?: string[];
  Icon?: LucideIcon;
}

export default function AgentChatPage({ intent, title, subtitle, starters = [], intro = [], Icon = Sparkles }: AgentChatPageProps) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    const ask = text.trim();
    if (!ask || typing) return;
    setMessages((m) => [...m, { id: uid(), role: "user", text: ask }]);
    setInput("");
    setTyping(true);
    try {
      const res = await fetch("/api/rowi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, ask, locale: lang }),
      });
      const json = await res.json();
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: json?.text || t("rowi.agentChat.error", "No pude generar una respuesta. Intenta de nuevo.") },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", text: t("rowi.agentChat.error", "No pude generar una respuesta. Intenta de nuevo.") },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--rowi-border)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-md">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-[var(--rowi-foreground)] tracking-tight">{title}</h1>
          <p className="text-xs text-[var(--rowi-muted)]">{subtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-5">
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("rowi.agentChat.empty", "Cuéntame sobre tu cliente y empezamos.")}
            </p>
            {intro.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {intro.map((step, i) => (
                  <span
                    key={step}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[var(--rowi-muted)]/10 text-[var(--rowi-muted)]"
                  >
                    <span className="font-semibold text-[var(--rowi-foreground)]">{i + 1}</span>
                    {step}
                  </span>
                ))}
              </div>
            )}
            {starters.length > 0 && (
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm px-4 py-2.5 rounded-xl border border-[var(--rowi-border)] hover:bg-[var(--rowi-muted)]/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white"
                  : "bg-[var(--rowi-card)] border border-[var(--rowi-border)] text-[var(--rowi-foreground)]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-muted)]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-6 py-4 border-t border-[var(--rowi-border)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder={t("rowi.agentChat.placeholder", "Escribe tu mensaje…")}
          className="flex-1 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-g2)] transition-all"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || typing}
          className="p-2.5 rounded-full bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          aria-label={t("rowi.agentChat.send", "Enviar")}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
