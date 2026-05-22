"use client";

/**
 * Empathy Mirror — mini-game de empatía (EMP).
 *
 * 5 escenarios. En cada uno, una persona pasa por algo y el jugador
 * tiene que escribir en 1 línea qué cree que está sintiendo el otro,
 * más un indicador de cercanía emocional ("yo siento eso a veces" /
 * "no me imagino"). El feedback corto le devuelve la pista de cómo
 * Six Seconds entrena la empatía: nombrar + reconocer + acompañar.
 *
 * Scoring:
 *   +5 por reflejar
 *   +10 si escribe ≥ 6 chars su lectura
 *   +5 si marca "yo siento eso a veces" (auto-conexión)
 *   Max por ronda 20 · 5 rondas 100 pts.
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ArrowLeft, ArrowRight, Heart, Sparkles, Trophy, CheckCircle2, AlertCircle } from "lucide-react";

interface Scenario {
  esWho: string;
  enWho: string;
  esSituation: string;
  enSituation: string;
}

const SCENARIOS: Scenario[] = [
  {
    esWho: "Una compañera de trabajo",
    enWho: "A coworker",
    esSituation: "lleva días llegando tarde, distraída, dice que está bien pero no sonríe.",
    enSituation: "has been arriving late for days, distracted, says she's fine but doesn't smile.",
  },
  {
    esWho: "Tu pareja",
    enWho: "Your partner",
    esSituation: "te dice 'no es nada' después de una llamada con su familia, pero queda en silencio.",
    enSituation: "says 'it's nothing' after a call with their family, but stays silent.",
  },
  {
    esWho: "Un amigo cercano",
    enWho: "A close friend",
    esSituation: "te cuenta entusiasmado un proyecto nuevo, y al final te pregunta dos veces si te parece buena idea.",
    enSituation: "tells you excitedly about a new project and at the end asks twice if you think it's a good idea.",
  },
  {
    esWho: "Tu mamá / papá",
    enWho: "Your mom / dad",
    esSituation: "te manda mensajes más seguido de lo habitual, sin razón clara, solo para saber 'cómo estás'.",
    enSituation: "messages you more often than usual, no clear reason, just to ask 'how are you'.",
  },
  {
    esWho: "Alguien en la fila del banco",
    enWho: "Someone in the bank line",
    esSituation: "se pone tenso, mira el reloj cada minuto, y bufa cuando avanzan dos personas.",
    enSituation: "tenses up, looks at the clock every minute, and huffs when two people advance.",
  },
];

const POINTS_REFLECT = 5;
const POINTS_DESCRIBE = 10;
const POINTS_SELF_CONNECT = 5;

interface Result {
  description: string;
  selfConnect: boolean;
  points: number;
}

export default function EmpathyMirrorPage() {
  const { lang } = useI18n();
  const isEN = lang === "en";

  const [round, setRound] = useState(0);
  const [description, setDescription] = useState("");
  const [selfConnect, setSelfConnect] = useState<boolean | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPoints, setSavedPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[round];
  const totalPoints = results.reduce((acc, r) => acc + r.points, 0);
  const selfConnectCount = results.filter((r) => r.selfConnect).length;
  const describedCount = results.filter((r) => r.description.trim().length >= 6).length;

  function next() {
    const describes = description.trim().length >= 6;
    const points =
      POINTS_REFLECT +
      (describes ? POINTS_DESCRIBE : 0) +
      (selfConnect === true ? POINTS_SELF_CONNECT : 0);
    setResults((arr) => [
      ...arr,
      { description: description.trim(), selfConnect: selfConnect === true, points },
    ]);
    setDescription("");
    setSelfConnect(null);
    if (round + 1 >= SCENARIOS.length) {
      setFinished(true);
    } else {
      setRound((r) => r + 1);
    }
  }

  async function collectPoints() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/learning/play/empathy-mirror/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rounds: results.length,
          describedCount,
          selfConnectCount,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error ?? (isEN ? "Could not save" : "No pudimos guardar"));
        return;
      }
      setSavedPoints(data.pointsAdded ?? totalPoints);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  const canAdvance = selfConnect !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--rowi-bg)] to-[var(--rowi-card-elev)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEN ? "Back to Learning" : "Volver a Aprendizaje"}
          </Link>
          <span className="rowi-chip">
            {isEN ? "Round" : "Ronda"} {Math.min(round + 1, SCENARIOS.length)} / {SCENARIOS.length}
          </span>
        </div>

        <div className="rowi-card bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
                {isEN ? "Empathy Mirror" : "Espejo de Empatía"}
              </h1>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {isEN
                  ? "Empathy is naming what the other is feeling without rushing to fix it. Read the scene and reflect back."
                  : "La empatía es nombrar lo que el otro siente sin apurarse a arreglarlo. Lee la escena y reflejá."}
              </p>
            </div>
          </div>
        </div>

        {finished ? (
          <div className="rowi-card text-center space-y-5 py-8">
            <Trophy className="w-14 h-14 mx-auto text-amber-500" />
            <div>
              <h2 className="text-2xl font-bold text-[var(--rowi-foreground)] mb-1">
                {isEN ? "Round complete" : "Ronda completa"}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)]">
                {isEN
                  ? `You described ${describedCount} of ${SCENARIOS.length}. You self-connected ${selfConnectCount}.`
                  : `Describiste ${describedCount} de ${SCENARIOS.length}. Te auto-conectaste en ${selfConnectCount}.`}
              </p>
            </div>
            <div className="text-4xl font-bold rowi-gradient-text">
              +{totalPoints} Rowi Points
            </div>
            {savedPoints !== null ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {isEN
                    ? `${savedPoints} points added to your balance.`
                    : `${savedPoints} puntos sumados a tu saldo.`}
                </div>
                <Link href="/learning" className="rowi-btn-primary inline-flex items-center gap-2">
                  {isEN ? "Back to Learning" : "Volver a Aprendizaje"}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {error && (
                  <div className="text-sm text-rose-500 inline-flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <button
                  onClick={collectPoints}
                  disabled={saving}
                  className="rowi-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {saving ? (isEN ? "Saving..." : "Guardando...") : (isEN ? "Collect points" : "Recolectar puntos")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rowi-card space-y-5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)] mb-1">
                {isEN ? scenario.enWho : scenario.esWho}
              </div>
              <p className="text-lg font-medium text-[var(--rowi-foreground)] leading-snug">
                {isEN ? scenario.enSituation : scenario.esSituation}
              </p>
            </div>

            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1.5 block">
                {isEN ? "What might this person be feeling?" : "¿Qué crees que está sintiendo esta persona?"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder={isEN ? "Maybe she feels..." : "Tal vez siente..."}
                className="w-full rounded-lg p-3 text-sm bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] text-[var(--rowi-foreground)] resize-none focus:outline-none focus:border-rose-500/50"
              />
              <div className="text-[10px] text-[var(--rowi-muted-weak)] mt-1">
                {description.trim().length}/280 ·{" "}
                {description.trim().length >= 6
                  ? isEN ? "+10 pts unlocked" : "+10 pts desbloqueados"
                  : isEN ? "min 6 chars for bonus" : "mín 6 chars para bonus"}
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1.5 block">
                {isEN ? "Have you felt this yourself sometimes?" : "¿Vos has sentido eso a veces?"}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelfConnect(true)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    selfConnect === true
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-[var(--rowi-card-elev)] border-[var(--rowi-card-border)] text-[var(--rowi-foreground)] hover:border-rose-500/40"
                  }`}
                >
                  {isEN ? "Yes, I feel that too" : "Sí, yo también"}
                </button>
                <button
                  onClick={() => setSelfConnect(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    selfConnect === false
                      ? "bg-[var(--rowi-card-elev)] border-[var(--rowi-primary)] text-[var(--rowi-foreground)]"
                      : "bg-[var(--rowi-card-elev)] border-[var(--rowi-card-border)] text-[var(--rowi-muted)] hover:border-[var(--rowi-primary)]/30"
                  }`}
                >
                  {isEN ? "No, I can't imagine it" : "No me imagino"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={next}
                disabled={!canAdvance}
                className="rowi-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {round + 1 >= SCENARIOS.length
                  ? isEN ? "See results" : "Ver resultados"
                  : isEN ? "Next" : "Siguiente"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!finished && results.length > 0 && (
          <div className="text-center text-sm text-[var(--rowi-muted)]">
            {isEN ? "Running total: " : "Acumulado: "}
            <span className="font-semibold text-[var(--rowi-foreground)]">{totalPoints} pts</span>
          </div>
        )}
      </div>
    </div>
  );
}
