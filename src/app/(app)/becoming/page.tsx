"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles, Info } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * MY BECOMING — el contraste honesto yo-vs-yo-pasado (30/60/90 días).
 * NO muestra un Becoming Score numérico: mostrar un número inventado
 * traicionaría "Track Becoming". Solo la comparación real del usuario consigo
 * mismo + su actividad de Becoming en la ventana.
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

export default function BecomingPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated" && !!session?.user;
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);

  const { data, isLoading } = useSWR<ContrastRes>(
    isAuth ? `/api/becoming/contrast?days=${days}` : null,
    fetcher
  );

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
        <p className="text-gray-500">{t("becoming.signIn", "Inicia sesión para ver tu Becoming")}</p>
      </div>
    );
  }

  const c = data?.ok ? data : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-violet-500" />
            {t("becoming.title", "Mi Becoming")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("becoming.subtitle", "Tú, comparado contigo mismo. No con nadie más.")}
          </p>
        </div>

        {/* Selector de ventana 30/60/90 */}
        <div className="flex gap-2">
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

        {/* Contraste de competencias */}
        <motion.section
          key={days}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {(t("becoming.contrast.title", "Hace {days} días vs hoy") as string).replace(
              "{days}",
              String(days)
            )}
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
                  <span className="w-10 text-right text-sm text-gray-400">
                    {row.past ?? "—"}
                  </span>
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

        {/* Actividad de Becoming en la ventana */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t("becoming.practice.title", "Tu práctica en este periodo")}
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { n: c?.practice.reflections ?? 0, label: t("becoming.practice.reflections", "reflexiones") },
              { n: c?.practice.practicesDone ?? 0, label: t("becoming.practice.done", "prácticas hechas") },
              { n: c?.practice.daysWithEntry ?? 0, label: t("becoming.practice.days", "días con registro") },
            ].map((m, i) => (
              <div key={i} className="rounded-xl bg-violet-50 dark:bg-zinc-700/40 py-3">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{m.n}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Nota explícita: aquí no hay score falso */}
        <p className="text-xs text-gray-400 flex items-start gap-1.5 px-1">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {t(
            "becoming.noScore",
            "Aquí no hay un puntaje. El Becoming no se mide con un número — se ve en el contraste honesto contigo mismo."
          )}
        </p>
      </div>
    </div>
  );
}
