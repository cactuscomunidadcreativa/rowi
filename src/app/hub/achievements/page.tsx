"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/react";
import { Trophy, Brain, ChevronRight, Sparkles } from "lucide-react";

export default function HubAchievementsPage() {
  const { t } = useI18n();

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-amber-500/20">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t("hub.achievements.title", "Logros")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("hub.achievements.subtitle", "Tu progreso y reconocimientos")}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center mb-6">
        <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">
          {t("hub.achievements.comingSoonTitle", "Próximamente")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          {t(
            "hub.achievements.comingSoonBody",
            "Estamos preparando un sistema de insignias y trayectoria de aprendizaje."
          )}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/hub/eq"
          className="rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 hover:border-amber-500 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold">
              {t("hub.achievements.eqProgressCta", "Tu progreso EQ")}
            </h3>
            <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t(
              "hub.achievements.eqProgressDesc",
              "Revisa tu evolución en las 8 competencias Six Seconds."
            )}
          </p>
        </Link>
        <Link
          href="/hub/vital-signs"
          className="rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 hover:border-amber-500 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold">
              {t("hub.achievements.vsHistoryCta", "Historial de Vital Signs")}
            </h3>
            <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t(
              "hub.achievements.vsHistoryDesc",
              "Mira la evolución de tus mediciones a lo largo del tiempo."
            )}
          </p>
        </Link>
      </section>
    </main>
  );
}
