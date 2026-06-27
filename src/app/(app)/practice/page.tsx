"use client";

/**
 * /practice — AI Practice Partner (Track B).
 *
 * Conversación de roleplay multi-turno contra un escenario, puntuada y
 * gamificada. Tres vistas: elegir escenario → practicar (chat) → resultado.
 * Todas las cadenas pasan por t(). El motor IA es pluggable (server-side).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  Theater,
  Loader2,
  Send,
  Sparkles,
  ArrowLeft,
  Trophy,
  Flag,
} from "lucide-react";

interface ScenarioLite {
  id: string;
  title: string;
  summary: string | null;
  locale: string;
  focusSei: string | null;
  difficulty: number;
}

interface Turn {
  role: "USER" | "PARTNER";
  content: string;
}

interface CriterionScore {
  key: string;
  label: string;
  score: number;
  comment: string;
}

interface Feedback {
  overall: number;
  summary: string;
  criteria: CriterionScore[];
  strengths: string[];
  improvements: string[];
}

interface FinishReward {
  pointsAdded: number;
  evolution: {
    evolved: boolean;
    hatched: boolean;
    previousStage: string;
    newStage: string;
  } | null;
}

type View = "pick" | "chat" | "result";

function tzOffset(): number {
  return -new Date().getTimezoneOffset();
}

export default function PracticePage() {
  const { t, lang } = useI18n();
  const [view, setView] = useState<View>("pick");
  const [scenarios, setScenarios] = useState<ScenarioLite[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [reachedLimit, setReachedLimit] = useState(false);

  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reward, setReward] = useState<FinishReward | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchScenarios = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/practice?scenarios=1&locale=${lang}`);
      const json = await res.json();
      let list: ScenarioLite[] = Array.isArray(json.scenarios) ? json.scenarios : [];
      // Si no hay escenarios en el idioma actual, mostrar todos.
      if (list.length === 0) {
        const all = await fetch(`/api/practice?scenarios=1`).then((r) => r.json());
        list = Array.isArray(all.scenarios) ? all.scenarios : [];
      }
      setScenarios(list);
    } finally {
      setLoadingList(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function startSession(scenarioId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", scenarioId, tz: tzOffset() }),
      });
      const json = await res.json();
      if (!json.ok) return;
      setSessionId(json.session.id);
      setTurns(
        (json.session.turns ?? []).map((tn: Turn) => ({ role: tn.role, content: tn.content })),
      );
      setReachedLimit(false);
      setView("chat");
    } finally {
      setBusy(false);
    }
  }

  async function sendTurn() {
    const message = input.trim();
    if (!message || !sessionId || busy) return;
    setInput("");
    setTurns((prev) => [...prev, { role: "USER", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "turn", sessionId, message, tz: tzOffset() }),
      });
      const json = await res.json();
      if (json.ok) {
        setTurns((prev) => [...prev, { role: "PARTNER", content: json.partner.content }]);
        setReachedLimit(!!json.reachedLimit);
      }
    } finally {
      setBusy(false);
    }
  }

  async function finishSession() {
    if (!sessionId || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", sessionId, tz: tzOffset() }),
      });
      const json = await res.json();
      if (json.ok) {
        setScore(typeof json.score === "number" ? json.score : null);
        setFeedback(json.feedback ?? null);
        setReward(json.reward ?? null);
        setView("result");
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSessionId(null);
    setTurns([]);
    setInput("");
    setScore(null);
    setFeedback(null);
    setReward(null);
    setReachedLimit(false);
    setView("pick");
    fetchScenarios();
  }

  // ── Vista: elegir escenario ──────────────────────────────────────────────
  if (view === "pick") {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <header className="flex items-center gap-2">
          <Theater className="w-6 h-6 text-[var(--rowi-g2)]" />
          <div>
            <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
              {t("practice.title", "Practica una conversación")}
            </h1>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t(
                "practice.subtitle",
                "Elige un escenario y practica con tu compañero de IA. Al final recibes una evaluación.",
              )}
            </p>
          </div>
        </header>

        {loadingList ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
          </div>
        ) : scenarios.length === 0 ? (
          <p className="text-center text-sm text-[var(--rowi-muted)] py-10">
            {t("practice.noScenarios", "Aún no hay escenarios disponibles.")}
          </p>
        ) : (
          <div className="space-y-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => startSession(s.id)}
                disabled={busy}
                className="rowi-card w-full text-left hover:border-[var(--rowi-g2)]/60 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[var(--rowi-foreground)]">{s.title}</span>
                  {s.focusSei && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]">
                      {s.focusSei}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--rowi-muted-weak)]">
                    {t("practice.difficulty", "Dificultad")} {s.difficulty}
                  </span>
                </div>
                {s.summary && (
                  <p className="text-sm text-[var(--rowi-muted)] mt-1">{s.summary}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista: resultado ─────────────────────────────────────────────────────
  if (view === "result") {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="rowi-card text-center space-y-2">
          <Trophy className="w-10 h-10 mx-auto text-[var(--rowi-g2)]" />
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">
            {score ?? 0}/100
          </h1>
          {feedback?.summary && (
            <p className="text-sm text-[var(--rowi-muted)]">{feedback.summary}</p>
          )}
          {reward && reward.pointsAdded > 0 && (
            <p className="text-sm font-medium text-[var(--rowi-g2)] flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" /> +{reward.pointsAdded}{" "}
              {t("practice.points", "puntos")}
              {reward.evolution?.evolved &&
                ` · ${t("practice.evolved", "¡tu Rowi evolucionó!")}`}
            </p>
          )}
        </div>

        {feedback && feedback.criteria.length > 0 && (
          <div className="rowi-card space-y-3">
            <h2 className="font-semibold text-[var(--rowi-foreground)]">
              {t("practice.byCriterion", "Por criterio")}
            </h2>
            {feedback.criteria.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--rowi-foreground)]">{c.label}</span>
                  <span className="font-semibold text-[var(--rowi-g2)]">{c.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--rowi-card-elev)] mt-1 overflow-hidden">
                  <div
                    className="h-full bg-[var(--rowi-g2)]"
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                {c.comment && (
                  <p className="text-xs text-[var(--rowi-muted)] mt-1">{c.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {feedback && (feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedback.strengths.length > 0 && (
              <div className="rowi-card">
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                  {t("practice.strengths", "Fortalezas")}
                </h3>
                <ul className="text-sm text-[var(--rowi-muted)] list-disc list-inside space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.improvements.length > 0 && (
              <div className="rowi-card">
                <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
                  {t("practice.improvements", "A mejorar")}
                </h3>
                <ul className="text-sm text-[var(--rowi-muted)] list-disc list-inside space-y-1">
                  {feedback.improvements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={reset}
          className="rowi-btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t("practice.again", "Practicar otra vez")}
        </button>
      </div>
    );
  }

  // ── Vista: chat ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-[calc(100vh-6rem)]">
      <header className="flex items-center justify-between mb-3">
        <button
          onClick={reset}
          className="text-sm text-[var(--rowi-muted)] inline-flex items-center gap-1 hover:text-[var(--rowi-foreground)]"
        >
          <ArrowLeft className="w-4 h-4" /> {t("practice.exit", "Salir")}
        </button>
        <button
          onClick={finishSession}
          disabled={busy || turns.filter((tn) => tn.role === "USER").length === 0}
          className="text-sm inline-flex items-center gap-1 text-[var(--rowi-g2)] disabled:opacity-40"
        >
          <Flag className="w-4 h-4" /> {t("practice.finish", "Terminar y evaluar")}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {turns.map((tn, i) => (
          <div
            key={i}
            className={`flex ${tn.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                tn.role === "USER"
                  ? "bg-[var(--rowi-g2)] text-white"
                  : "bg-[var(--rowi-card-elev)] text-[var(--rowi-foreground)]"
              }`}
            >
              {tn.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2 bg-[var(--rowi-card-elev)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-muted)]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {reachedLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center my-2">
          {t("practice.limitReached", "Has llegado al final de la práctica. Pulsa Terminar para tu evaluación.")}
        </p>
      )}

      <div className="flex items-end gap-2 mt-3">
        <textarea
          className="flex-1 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-2 text-sm resize-none min-h-[44px] max-h-32"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendTurn();
            }
          }}
          placeholder={t("practice.inputPlaceholder", "Escribe tu respuesta…")}
          disabled={busy || reachedLimit}
        />
        <button
          onClick={sendTurn}
          disabled={busy || !input.trim() || reachedLimit}
          className="rowi-btn-primary p-3 rounded-xl disabled:opacity-40"
          aria-label={t("practice.send", "Enviar")}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
