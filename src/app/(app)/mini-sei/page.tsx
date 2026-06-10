"use client";

/**
 * /mini-sei — tomar el Rowi Test (mini-SEI normado) fuera del onboarding.
 * Es la entrada viva del primer eslabón de la cadena: re-tomarlo mensualmente
 * o por primera vez si se saltó el onboarding. Reusa MiniSeiWizard.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Award, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import MiniSeiWizard, {
  type MiniSeiQuestion,
  type MiniSeiPrefQuestion,
} from "@/components/mini-sei/MiniSeiWizard";

export default function MiniSeiPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [questions, setQuestions] = useState<MiniSeiQuestion[]>([]);
  const [prefs, setPrefs] = useState<MiniSeiPrefQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/mini-sei/questions?lang=${lang}`).then((r) => r.json()),
      fetch(`/api/mini-sei/preferences?lang=${lang}`).then((r) => r.json()),
    ])
      .then(([q, p]) => {
        if (cancelled) return;
        if (q.ok) setQuestions(q.questions);
        if (p.ok) setPrefs(p.questions);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  async function submit(
    answers: Record<string, number>,
    preferences: Record<string, number>,
  ) {
    setSaving(true);
    try {
      await fetch("/api/mini-sei/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, preferences, source: "adhoc" }),
      });
      setDone(true);
      setTimeout(() => router.push("/hub/vital-signs"), 1200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-[var(--rowi-primary)]" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-[var(--rowi-fg)]">
          {t("miniSei.title", "Tu Rowi Test")}
        </h1>
      </div>
      <p className="text-sm text-[var(--rowi-muted)] mb-8">
        {t("miniSei.pageHint", "Una lectura corta de tu inteligencia emocional. Tarda 2 minutos.")}
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-[var(--rowi-muted)]">
            {t("onboarding.rowiTest.done", "¡Listo! Tu perfil se está afinando.")}
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : questions.length > 0 ? (
        <MiniSeiWizard
          questions={questions}
          preferenceQuestions={prefs}
          submitting={saving}
          onComplete={submit}
        />
      ) : (
        <p className="text-center text-[var(--rowi-muted)] py-10">
          {t("common.error", "Error")}
        </p>
      )}
    </div>
  );
}
