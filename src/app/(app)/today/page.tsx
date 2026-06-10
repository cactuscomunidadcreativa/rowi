"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Sparkles, Target, Moon, Check, MessageCircle } from "lucide-react";
import DailyPulseCard from "@/components/dashboard/DailyPulseCard";
import { RowiStageImage, type RowiStage } from "@/domains/avatar/components/RowiStageImage";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * TODAY — el corazón del producto. El loop diario:
 *   MAÑANA (SEE) → BECOME (el sistema propone) → PRACTICE (una acción) →
 *   NOCHE (REFLECT, "¿cuánto te estás pareciendo a quien quieres ser?").
 * Diseñado alrededor del fracaso: la noche difícil es el dato más valioso.
 */

interface LoopEntry {
  morningMood: string | null;
  morningIntensity: number | null;
  becomeSei: string | null;
  becomeIdentity: string | null;
  practiceText: string | null;
  practiceDone: boolean;
  reflectionText: string | null;
}

const TODAY_URL = "/api/today";

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "evening";
}

export default function TodayPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated" && !!session?.user;

  const tz = typeof window !== "undefined" ? -new Date().getTimezoneOffset() : 0;
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("rowi.lang") ?? "es" : "es";

  const { data: todayRes, isLoading } = useSWR(
    isAuth ? `${TODAY_URL}?tz=${tz}&lang=${lang}` : null,
    fetcher
  );
  const { data: avatarRes } = useSWR(isAuth ? "/api/avatar" : null, fetcher);

  const [moodInput, setMoodInput] = useState("");
  const [reflectionInput, setReflectionInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [evolved, setEvolved] = useState<{ hatched: boolean; newStage: string } | null>(null);

  if (status === "loading" || (isAuth && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <p className="text-gray-500">{t("today.loading", "Preparando tu día…")}</p>
      </div>
    );
  }
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t("today.signIn", "Inicia sesión para ver tu día")}</p>
      </div>
    );
  }

  const entry: LoopEntry | null = todayRes?.ok ? todayRes.entry : null;
  const stage = (avatarRes?.ok ? avatarRes.data?.currentStage : "EGG") as RowiStage;

  async function post(step: string, payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(TODAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, tzOffsetMinutes: tz, lang, ...payload }),
      }).then((r) => r.json());
      await mutate(`${TODAY_URL}?tz=${tz}&lang=${lang}`);
      // TODAY → Avatar → BECOMING: si la reflexión movió el avatar, refrescamos
      // el avatar y mostramos la recompensa (antes no pasaba nada al cerrar el loop).
      const ev = res?.reward?.evolution;
      if (ev && (ev.evolved || ev.hatched)) {
        await mutate("/api/avatar");
        setEvolved({ hatched: ev.hatched, newStage: ev.newStage });
      }
    } finally {
      setSaving(false);
    }
  }

  const hasMorning = !!entry?.morningMood;
  const hasReflection = !!entry?.reflectionText;
  const loopComplete = hasMorning && entry?.practiceDone && hasReflection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t(`today.greeting.${greetingKey()}`, "Buenos días")}
        </h1>

        {/* MAÑANA — SEE */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("today.see.title", "¿Cómo llegas hoy?")}
            </h2>
          </div>
          {hasMorning ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">{t("today.see.saved", "Hoy llegas así:")}</span>{" "}
              <span className="font-medium">{entry?.morningMood}</span>
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                value={moodInput}
                onChange={(e) => setMoodInput(e.target.value)}
                placeholder={t("today.see.placeholder", "En una palabra o frase…")}
                maxLength={200}
                className="flex-1 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                disabled={saving || !moodInput.trim()}
                onClick={() => post("morning", { mood: moodInput.trim() })}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {t("today.see.save", "Listo")}
              </button>
            </div>
          )}
        </motion.section>

        {/* BECOME — el sistema propone */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl shadow-lg p-5 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
              {t("today.become.kicker", "Rowi te propone")}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-snug">
            {entry?.becomeIdentity ?? t("today.become.title", "Tu mejor versión hoy")}
          </h2>
        </motion.section>

        {/* PRACTICE — una sola acción */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("today.practice.title", "Tu práctica de hoy")}
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">
            {t("today.practice.one", "Una sola cosa. No cinco. Una.")}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">{entry?.practiceText}</p>
          <div className="flex items-center gap-2">
            <button
              disabled={saving}
              onClick={() => post("practice", { done: !entry?.practiceDone })}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                entry?.practiceDone
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-violet-600 text-white"
              }`}
            >
              <Check className="w-4 h-4" />
              {entry?.practiceDone
                ? t("today.practice.done", "Hecho")
                : t("today.practice.markdone", "Marcar como hecho")}
            </button>
            <Link
              href="/rowi"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              <MessageCircle className="w-4 h-4" />
              {t("today.practice.talk", "Hablar con Rowi")}
            </Link>
          </div>
        </motion.section>

        {/* DAILY PULSE (1 toque) + AVATAR */}
        <div className="grid gap-5">
          <DailyPulseCard />
          <div className="flex flex-col items-center bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5">
            <RowiStageImage stage={stage} size="md" float />
          </div>
        </div>

        {/* NOCHE — REFLECT */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("today.night.title", "¿Cuánto te estás pareciendo a la persona que quieres ser?")}
            </h2>
          </div>
          {hasReflection ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">{t("today.night.saved", "Tu reflexión de hoy")}</span>
              <br />
              {entry?.reflectionText}
            </p>
          ) : (
            <>
              {/* Diseño del fracaso: la noche difícil es el dato más valioso */}
              <p className="text-xs text-violet-600 dark:text-violet-300 mb-3">
                {t(
                  "today.night.failure",
                  "¿Costó? Eso no es un fracaso — es exactamente el dato que necesitábamos. ¿Qué tan cerca estuviste?"
                )}
              </p>
              <textarea
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                placeholder={t("today.night.placeholder", "Qué tanto te acercaste hoy…")}
                maxLength={1000}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                disabled={saving || !reflectionInput.trim()}
                onClick={() => post("reflection", { text: reflectionInput.trim() })}
                className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {t("today.night.save", "Guardar mi reflexión")}
              </button>
            </>
          )}
        </motion.section>

        {loopComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm font-medium text-violet-600 dark:text-violet-400 py-2"
          >
            {t("today.complete", "Cerraste tu día. Eso es evolución.")}
          </motion.p>
        )}

        {/* Recompensa visible: tu reflexión hizo crecer a tu Rowi (TODAY → BECOMING). */}
        {evolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-center p-5 shadow-lg"
          >
            <p className="text-lg font-bold">
              {evolved.hatched
                ? t("today.evolved.hatched", "¡Tu Rowi ha nacido! 🐣")
                : t("today.evolved.grew", "Tu Rowi evolucionó 🦉")}
            </p>
            <p className="text-sm text-violet-100 mt-1">
              {t(
                "today.evolved.caption",
                "Tu reflexión de hoy hizo crecer a quien te estás convirtiendo."
              )}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
