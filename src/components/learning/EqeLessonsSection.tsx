"use client";

/**
 * EqeLessonsSection — lista las 24 micro-lessons del track EQE
 * (Six Seconds adaptado 18+) agrupadas por SEI competency. Tres tabs
 * por nivel (EQE1 / EQE2 / EQE3) que mapean a Know · Choose · Give.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Clock, Star, Lock, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Lesson {
  slug: string;
  sei: string;
  title: string;
  titleEN: string;
  description: string;
  descriptionEN: string;
  durationMin: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  points: number;
  isFeatured: boolean;
  track: "EQE1" | "EQE2" | "EQE3" | null;
  progress: { status: string; progress: number; pointsEarned: number } | null;
}

const TRACKS = [
  { key: "EQE1", esLabel: "EQE1 · Know Yourself", enLabel: "EQE1 · Know Yourself", pursuitES: "Conócete", pursuitEN: "Know" },
  { key: "EQE2", esLabel: "EQE2 · Choose Yourself", enLabel: "EQE2 · Choose Yourself", pursuitES: "Elige", pursuitEN: "Choose" },
  { key: "EQE3", esLabel: "EQE3 · Give Yourself", enLabel: "EQE3 · Give Yourself", pursuitES: "Da", pursuitEN: "Give" },
] as const;

const SEI_NAMES: Record<string, { es: string; en: string }> = {
  EL: { es: "Alfabetización Emocional", en: "Emotional Literacy" },
  RP: { es: "Reconocer Patrones", en: "Recognize Patterns" },
  ACT: { es: "Pensamiento Consecuente", en: "Consequential Thinking" },
  NE: { es: "Navegar Emociones", en: "Navigate Emotions" },
  IM: { es: "Motivación Intrínseca", en: "Intrinsic Motivation" },
  OP: { es: "Optimismo", en: "Optimism" },
  EMP: { es: "Empatía", en: "Empathy" },
  NG: { es: "Metas Nobles", en: "Noble Goals" },
};

export default function EqeLessonsSection() {
  const { lang, t } = useI18n();
  const isEN = lang === "en";

  const [items, setItems] = useState<Lesson[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<"EQE1" | "EQE2" | "EQE3">("EQE1");

  useEffect(() => {
    fetch("/api/learning/microlearnings/list?source=EQE")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setItems(json.items as Lesson[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!items || items.length === 0) return null;

  const filtered = items.filter((l) => l.track === activeTrack);
  const totalThis = filtered.length;
  const doneThis = filtered.filter((l) => l.progress?.status === "COMPLETED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-violet-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("eqeLessons.heading", "Programa Six Seconds EQ Educator (18+)")}
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t(
              "eqeLessons.description",
              "24 micro-lecciones adaptadas del programa EQE1/2/3. Practica una al día, 5-20 min cada una.",
            )}
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 bg-white dark:bg-zinc-800 rounded-full border border-gray-200 dark:border-zinc-700">
          {doneThis}/{totalThis} {t("eqeLessons.inThisTrack", "en este track")}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {TRACKS.map((tr) => (
          <button
            key={tr.key}
            onClick={() => setActiveTrack(tr.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTrack === tr.key
                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-violet-300"
            }`}
          >
            {isEN ? tr.enLabel : tr.esLabel}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map((l) => {
          const done = l.progress?.status === "COMPLETED";
          const seiName = SEI_NAMES[l.sei] ?? { es: l.sei, en: l.sei };
          return (
            <Link
              key={l.slug}
              href={`/learning/lesson/${l.slug}`}
              className={`block rounded-2xl p-4 border transition-all ${
                done
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                  : "bg-white dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700/50 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  {l.sei} · {isEN ? seiName.en : seiName.es}
                </span>
                {done ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-[10px] text-gray-400">+{l.points} pts</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2">
                {isEN ? l.titleEN : l.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                {isEN ? l.descriptionEN : l.description}
              </p>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {l.durationMin} min
                </span>
                {l.isFeatured && (
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
