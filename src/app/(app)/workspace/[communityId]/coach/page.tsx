"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Send, Loader2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Message = { role: "user" | "assistant"; content: string };

export default function WorkspaceCoachPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setSending(true);
    try {
      const res = await fetch(`/api/workspaces/${communityId}/ai-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer || data.error || "Error" },
      ]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: err.message }]);
    } finally {
      setSending(false);
    }
  }

  const suggestions = [
    t("workspace.coach.suggest1", "Who are the top 3 candidates?"),
    t("workspace.coach.suggest2", "Analyze the dominant brain profile"),
    t("workspace.coach.suggest3", "What are the development gaps in this group?"),
    t("workspace.coach.suggest4", "Who would make a great leader?"),
  ];

  return (
    <div className="min-h-screen py-6 px-4 max-w-4xl mx-auto">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bot className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.modules.coach")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.coach.subtitle", "AI coach with real data from this workspace")}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col h-[calc(100vh-240px)] min-h-[400px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)]/20 to-[var(--rowi-g2)]/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-[var(--rowi-g2)]" />
              </div>
              <h2 className="font-semibold text-lg mb-1">
                {t("workspace.coach.welcome", "Ask Rowi about this workspace")}
              </h2>
              <p className="text-sm text-gray-500 mb-4 max-w-md">
                {t("workspace.coach.welcomeDesc", "I have access to the SEI data of all members. Ask me anything.")}
              </p>
              <div className="grid gap-2 w-full max-w-md">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="text-left px-3 py-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.role === "user"
                      ? "bg-gray-200 dark:bg-zinc-700"
                      : "bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)]"
                  }`}
                >
                  {m.role === "user" ? "👤" : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gray-100 dark:bg-zinc-800"
                      : "bg-gradient-to-br from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("workspace.coach.thinking", "Thinking...")}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={t("workspace.coach.placeholder", "Ask something about this workspace...")}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="p-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
