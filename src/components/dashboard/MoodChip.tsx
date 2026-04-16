"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

const translations = {
  es: { recentMood: "Estado de ánimo reciente" },
  en: { recentMood: "Recent mood" },
  pt: { recentMood: "Estado de ânimo recente" },
  it: { recentMood: "Umore recente" },
};

export function MoodChip({ text, emoji }: { text: string; emoji: string }) {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 shadow-sm flex items-center gap-3">
      <span className="text-2xl">{emoji || "🙂"}</span>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{t.recentMood}</div>
        <div className="font-medium text-gray-900 dark:text-white">{text || "—"}</div>
      </div>
    </div>
  );
}
