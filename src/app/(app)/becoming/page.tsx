"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles, Info, Flame, CalendarDays, Award } from "lucide-react";
import { RowiStageImage, type RowiStage } from "@/domains/avatar/components/RowiStageImage";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * BECOMING — la memoria viva del viaje (ver ROWI_FILOSOFIA_TODAY_BECOMING).
 * Diseño 70% memoria + 30% acción: ni museo ni menú.
 *  - 70% MEMORIA (arriba, protagonista): el avatar = la cara de en quién te
 *    estás convirtiendo; tu etapa, tu progreso, las señales de tu historia.
 *  - 30% ACCIÓN (abajo, invita sin imponer): el contraste honesto yo-vs-yo
 *    (sin score falso) + tu práctica. La memoria invita; la acción está ahí.
 */

const SEI_LABEL: Record<string, string> = {
  EL: "Self-Awareness",
  RP: "Pattern Recognition",
  ACT: "Consequential Thinking",
  NE: "Navigate Emotions",
  IM: "Intrinsic Motivation",
  OP: "Optimism",
  EMP: "Empathy",
  NG: "Noble Goal",
};

const WINDOWS = [30, 60, 90] as const;

interface CompContrast {
  sei: string;
  past: number | null;
  now: number | null;
  delta: number | null;
}

interface ContrastRes {
  ok: boolean;
  days: number;
  competencies: CompContrast[] | null;
  practice: { reflections: number; practicesDone: number; daysWithEntry: number };
  hasContrast: boolean;
}

interface AvatarRes {
  ok: boolean;
  data?: {
    currentStage: RowiStage;
    progressToNext: number;
    daysActive: number;
    totalXP: number;
    isHatched: boolean;
    stageInfo: { name: { es: string; en: string }; description: { es: string; en: string }; emoji: string };
  };
}

export default function BecomingPage() {
  const { t, lang } = useI18n();
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated" && !!session?.user;
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);

  const { data, isLoading } = useSWR<ContrastRes>(
    isAuth ? `/api/becoming/contrast?days=${days}` : null,
    fetcher
  );
  const { data: avatarRes } = useSWR<AvatarRes>(isAuth ? "/api/avatar" : null, fetcher, {
    revalidateOnFocus: false,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <p className="text-gray-500">{t("becoming.loading", "Reuniendo tu historia…")}</p>
      </div>
    );
  }
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t("becoming.signIn", "Inicia sesión para ver tu evolución")}</p>
      </div>
    );
  }

  const c = data?.ok ? data : null;
  const av = avatarRes?.ok ? avatarRes.data : null;
  const stage: RowiStage = av?.currentStage ?? "EGG";
  const stageName = av ? (lang === "es" ? av.stageInfo.name.es : av.stageInfo.name.en) : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ═══════════════════ 70% MEMORIA ═══════════════════ */}

        {/* El avatar = la cara de en quién te estás convirtiendo */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-1">
            {t("becoming.title", "Mi evolución")}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("becoming.heroQuestion", "¿En quién te estás convirtiendo?")}
          </h1>

          <div className="flex justify-center mb-3">
            <RowiStageImage stage={stage} size="xl" float alt={stageName || "Rowi"} />
          </div>

          {av && (
            <>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {av.stageInfo.emoji} {stageName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                {lang === "es" ? av.stageInfo.description.es : av.stageInfo.description.en}
              </p>

              {/* Progreso a la siguiente etapa — tu lugar en el viaje */}
              <div className="max-w-xs mx-auto mt-4">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>{t("becoming.progress.label", "Hacia tu siguiente etapa")}</span>
                  <span>{Math.round(av.progressToNext)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, av.progressToNext))}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </>
          )}
        </motion.section>

        {/* Las señales de tu historia */}
        {av && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: CalendarDays, n: av.daysActive, label: t("becoming.signals.days", "días contigo") },
              { icon: Flame, n: c?.practice.daysWithEntry ?? 0, label: t("becoming.signals.active", "días con registro") },
              { icon: Award, n: av.totalXP, label: t("becoming.signals.xp", "experiencia") },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm py-4 text-center">
                  <Icon className="w-5 h-5 text-violet-500 mx-auto mb-1.5" />
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{m.n}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</div>
                </div>
              );
            })}
          </motion.section>
        )}

        {/* ═══════════════════ 30% ACCIÓN ═══════════════════ */}

        <div className="pt-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            {t("becoming.contrastSection", "Tu contraste honesto")}
          </p>

          {/* Selector de ventana 30/60/90 */}
          <div className="flex gap-2 mb-3">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setDays(w)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  days === w
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700"
                }`}
              >
                {t(`becoming.window.${w}`, `${w} días`)}
              </button>
            ))}
          </div>

          {/* Contraste de competencias yo-vs-yo */}
          <motion.section
            key={days}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
              {(t("becoming.contrast.title", "Hace {days} días vs hoy") as string).replace("{days}", String(days))}
            </h2>

            {isLoading ? (
              <p className="text-sm text-gray-400">{t("becoming.loading", "Reuniendo tu historia…")}</p>
            ) : c?.competencies ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-end gap-6 text-[11px] text-gray-400 pr-1">
                  <span>{t("becoming.contrast.then", "Antes")}</span>
                  <span>{t("becoming.contrast.now", "Hoy")}</span>
                </div>
                {c.competencies.map((row) => (
                  <div key={row.sei} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-sm text-gray-700 dark:text-gray-200 truncate">
                      {SEI_LABEL[row.sei] ?? row.sei}
                    </span>
                    <span className="w-10 text-right text-sm text-gray-400">{row.past ?? "—"}</span>
                    <span className="w-10 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {row.now ?? "—"}
                    </span>
                    <span className="w-12 flex items-center justify-end">
                      {row.delta === null ? (
                        <Minus className="w-4 h-4 text-gray-300" />
                      ) : row.delta > 0 ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs font-semibold">
                          <TrendingUp className="w-4 h-4" />+{row.delta}
                        </span>
                      ) : row.delta < 0 ? (
                        <span className="inline-flex items-center text-amber-600 text-xs font-semibold">
                          <TrendingDown className="w-4 h-4" />
                          {row.delta}
                        </span>
                      ) : (
                        <Minus className="w-4 h-4 text-gray-300" />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(
                  "becoming.contrast.none",
                  "Aún no hay suficiente historia para comparar. Vuelve en unos días: tu contraste se construye con tu práctica."
                )}
              </p>
            )}
          </motion.section>

          {/* Nota explícita: aquí no hay score falso */}
          <p className="text-xs text-gray-400 flex items-start gap-1.5 px-1 mt-3">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {t(
              "becoming.noScore",
              "Aquí no hay un puntaje. La evolución no se mide con un número — se ve en el contraste honesto contigo mismo."
            )}
          </p>

          {/* La puerta a seguir creciendo hoy (acción que invita) */}
          <a
            href="/today"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 font-semibold shadow-lg hover:opacity-95 transition"
          >
            <Sparkles className="w-4 h-4" />
            {t("becoming.cta", "Sigue creciendo hoy")}
          </a>
        </div>
      </div>
    </div>
  );
}
