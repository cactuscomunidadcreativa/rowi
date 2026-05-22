"use client";

/**
 * Daily Pulse Card — 1 pregunta corta cada día rotando por las 8 SEI
 * competencies. Se monta arriba de /dashboard como primer card visible.
 *
 * Si el usuario ya respondió hoy, muestra el feedback + la racha.
 * Si no, escala 1-5 + botón "Responder". Al responder, fetch al endpoint
 * y muestra el feedback con un emoji por bucket.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface PulseQuestion {
  sei: string;
  pulsePointCode: string;
  esQuestion: string;
  enQuestion: string;
}

interface TodayResponse {
  ok: boolean;
  question?: PulseQuestion;
  answeredToday?: { value: number; at: string } | null;
  streak?: { current: number; longest: number };
  error?: string;
}

interface AnswerResponse {
  ok: boolean;
  already?: boolean;
  value?: number;
  pointsAdded?: number;
  streak?: { current: number; longest: number };
  feedback?: string;
  error?: string;
}

export default function DailyPulseCard() {
  const { lang } = useI18n();
  const isEN = lang === "en";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayResponse | null>(null);
  const [value, setValue] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);
  const [pointsAdded, setPointsAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tz = new Date().getTimezoneOffset();
    fetch(`/api/daily-pulse/today?tz=${tz}`)
      .then((r) => r.json())
      .then((json: TodayResponse) => {
        setData(json);
        if (json.streak) setStreak(json.streak);
      })
      .catch(() => setError(isEN ? "Could not load today's pulse" : "No pudimos cargar el pulso de hoy"))
      .finally(() => setLoading(false));
  }, [isEN]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/daily-pulse/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value,
          lang: isEN ? "en" : "es",
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        }),
      });
      const json = (await res.json()) as AnswerResponse;
      if (!json.ok) {
        setError(json.error ?? (isEN ? "Could not save" : "No pudimos guardar"));
        return;
      }
      if (json.feedback) setFeedback(json.feedback);
      if (json.streak) setStreak(json.streak);
      if (json.pointsAdded) setPointsAdded(json.pointsAdded);
      setData((d) => (d ? { ...d, answeredToday: { value: json.value ?? value, at: new Date().toISOString() } } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rowi-card flex items-center gap-3 text-sm text-[var(--rowi-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        {isEN ? "Loading today's pulse..." : "Cargando el pulso de hoy..."}
      </div>
    );
  }

  // Sin auth o sin pregunta: no renderizar.
  if (!data?.ok || !data.question) {
    return null;
  }

  const q = data.question;
  const questionText = isEN ? q.enQuestion : q.esQuestion;
  const answered = !!data.answeredToday;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-[var(--rowi-primary)]/10 via-white to-[var(--rowi-secondary)]/5 dark:from-[var(--rowi-primary)]/20 dark:via-zinc-900 dark:to-[var(--rowi-secondary)]/10 rounded-2xl border border-[var(--rowi-primary)]/30 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--rowi-primary)] bg-[var(--rowi-primary)]/10 px-2 py-0.5 rounded-full">
            {isEN ? "Daily Pulse" : "Pulso de hoy"}
          </span>
          <span className="text-[10px] text-[var(--rowi-muted-weak)] uppercase tracking-wider">
            {q.sei}
          </span>
        </div>
        {streak && streak.current > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5" />
            {streak.current} {isEN ? "day streak" : "días seguidos"}
          </div>
        )}
      </div>

      <p className="text-base font-medium text-[var(--rowi-foreground)] leading-snug mb-4">
        {questionText}
      </p>

      {answered || feedback ? (
        <div className="space-y-3">
          {feedback ? (
            <div className="flex items-start gap-2 text-sm text-[var(--rowi-foreground)] bg-white/60 dark:bg-zinc-800/40 rounded-xl p-3">
              <Sparkles className="w-4 h-4 text-[var(--rowi-primary)] mt-0.5 flex-shrink-0" />
              <p>{feedback}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              {isEN ? "You already answered today. See you tomorrow." : "Ya respondiste hoy. Nos vemos mañana."}
            </div>
          )}
          {pointsAdded ? (
            <div className="text-xs text-[var(--rowi-muted)]">
              +{pointsAdded} Rowi Points
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setValue(v)}
                disabled={submitting}
                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                  value === v
                    ? "bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white scale-110 shadow"
                    : "bg-white/70 dark:bg-zinc-800/60 text-[var(--rowi-foreground)] hover:scale-105"
                }`}
              >
                {v}
              </button>
            ))}
            <span className="text-xs text-[var(--rowi-muted-weak)] ml-2">
              {isEN ? "1 = not at all · 5 = a lot" : "1 = nada · 5 = mucho"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[var(--rowi-muted-weak)]">
              {isEN ? "Takes less than a minute" : "Toma menos de un minuto"}
            </span>
            <button
              onClick={submit}
              disabled={submitting}
              className="rowi-btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              {submitting ? "..." : isEN ? "Answer" : "Responder"}
            </button>
          </div>
          {error && <div className="text-xs text-rose-500">{error}</div>}
        </div>
      )}
    </motion.div>
  );
}
