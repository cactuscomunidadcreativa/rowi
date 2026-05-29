"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { EMOTION_TRANSLATIONS } from "@/data/emotions/translations";

const translations = {
  es: { recentMood: "Estado de ánimo reciente" },
  en: { recentMood: "Recent mood" },
  pt: { recentMood: "Estado de ânimo recente" },
  it: { recentMood: "Umore recente" },
};

/**
 * The emotion name is stored in Spanish (the Six Seconds vocabulary). Translate
 * it to the active language for display; fall back to the raw value if the word
 * isn't in the lexicon (e.g. free-text or a not-yet-mapped synonym).
 */
function translateEmotion(text: string, lang: string): string {
  if (!text || lang === "es") return text;
  const entry = EMOTION_TRANSLATIONS[text.trim().toLowerCase()];
  if (!entry) return text;
  return entry[lang as "en" | "pt" | "it"] ?? text;
}

export function MoodChip({ text, emoji }: { text: string; emoji: string }) {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const moodLabel = translateEmotion(text, lang);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 shadow-sm flex items-center gap-3">
      <span className="text-2xl">{emoji || "🙂"}</span>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{t.recentMood}</div>
        <div className="font-medium text-gray-900 dark:text-white">{moodLabel || "—"}</div>
      </div>
    </div>
  );
}
