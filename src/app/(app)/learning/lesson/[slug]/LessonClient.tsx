"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Star, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Props {
  slug: string;
  sei: string;
  title: string;
  titleEN: string;
  description: string;
  descriptionEN: string;
  durationMin: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  points: number;
  track: string | null;
  alreadyCompleted: boolean;
}

const DIFFICULTY_LABEL: Record<
  Props["difficulty"],
  { es: string; en: string; cls: string }
> = {
  BEGINNER: { es: "Beginner · EQE1", en: "Beginner · EQE1", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  INTERMEDIATE: { es: "Intermedio · EQE2", en: "Intermediate · EQE2", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  ADVANCED: { es: "Avanzado · EQE3", en: "Advanced · EQE3", cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
};

export default function LessonClient({
  slug,
  sei,
  title,
  titleEN,
  description,
  descriptionEN,
  durationMin,
  difficulty,
  points,
  alreadyCompleted,
}: Props) {
  const { lang } = useI18n();
  const isEN = lang === "en";

  const [completed, setCompleted] = useState(alreadyCompleted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPoints, setSavedPoints] = useState<number | null>(null);

  async function markCompleted() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/learning/microlearnings/${slug}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error ?? (isEN ? "Could not save" : "No pudimos guardar"));
        return;
      }
      setCompleted(true);
      setSavedPoints(data.pointsEarned ?? points);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  const diff = DIFFICULTY_LABEL[difficulty];

  return (
    <div className="rowi-card space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${diff.cls}`}>
            {isEN ? diff.en : diff.es}
          </span>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">
            {isEN ? titleEN : title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-[var(--rowi-muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {durationMin} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              +{points} pts
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]">
              {sei}
            </span>
          </div>
        </div>
      </div>

      <p className="text-base leading-relaxed text-[var(--rowi-foreground)]">
        {isEN ? descriptionEN : description}
      </p>

      <div className="pt-4 border-t border-[var(--rowi-card-border)]">
        {completed ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {savedPoints !== null
              ? isEN ? `Completed · +${savedPoints} pts added.` : `Completada · +${savedPoints} pts sumados.`
              : isEN ? "Already completed." : "Ya completada."}
            <Link href="/learning" className="ml-auto rowi-btn-primary text-xs px-3 py-1.5">
              {isEN ? "More lessons" : "Más lecciones"}
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-[var(--rowi-muted)]">
              {isEN
                ? "When you finish practicing, mark it complete to earn points and grow your streak."
                : "Cuando termines de practicar, márcala completa para ganar puntos y crecer tu racha."}
            </span>
            <button
              onClick={markCompleted}
              disabled={saving}
              className="rowi-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {saving ? (isEN ? "Saving..." : "Guardando...") : (isEN ? "Mark complete" : "Marcar completa")}
            </button>
          </div>
        )}
        {error && (
          <div className="mt-3 text-sm text-rose-500 inline-flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
