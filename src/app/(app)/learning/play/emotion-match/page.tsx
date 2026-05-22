"use client";

/**
 * Emotion Match — mini-game de alfabetización emocional (EL).
 *
 * 5 rondas. Cada ronda muestra una situación + 4 opciones de emoción.
 * No hay "respuesta correcta" — el juego es de SELF-AWARENESS, no de
 * acierto. El jugador elige la emoción que MÁS conecta con la situación
 * desde su experiencia. Después aparece un campo opcional para
 * justificar en 1 línea ("¿por qué esa emoción?").
 *
 * Scoring:
 *   - +5 puntos por elegir
 *   - +10 puntos adicionales si justifica (texto ≥ 6 chars)
 *   Total máximo por ronda = 15. 5 rondas = 75 puntos máx.
 *
 * Persistencia: PulsePointSignal source="emotion_match" con value =
 * 3 (siempre, no es escala) + metadata { emotion, justification }
 * vinculada a EXECUTION_FEEDBACK (PP de EL en el BE2GROW). Suma a
 * UserPoints con reason MICRO_LEARNING.
 */

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ArrowLeft, Trophy, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

interface Scenario {
  esText: string;
  enText: string;
  esContext: string;
  enContext: string;
  options: Array<{ esEmotion: string; enEmotion: string; emoji: string }>;
}

const SCENARIOS: Scenario[] = [
  {
    esText: "Después de semanas de esfuerzo, terminás un proyecto y nadie del equipo lo comenta.",
    enText: "After weeks of effort, you finish a project and nobody on the team mentions it.",
    esContext: "Trabajo · invisibilidad",
    enContext: "Work · invisibility",
    options: [
      { esEmotion: "Decepción", enEmotion: "Disappointment", emoji: "🌧️" },
      { esEmotion: "Resignación", enEmotion: "Resignation", emoji: "🪨" },
      { esEmotion: "Soledad", enEmotion: "Loneliness", emoji: "🌑" },
      { esEmotion: "Orgullo silencioso", enEmotion: "Silent pride", emoji: "🌱" },
    ],
  },
  {
    esText: "Tu mejor amigo recibe la noticia que vos esperabas.",
    enText: "Your best friend gets the news you were hoping for.",
    esContext: "Amistad · comparación",
    enContext: "Friendship · comparison",
    options: [
      { esEmotion: "Alegría mezclada", enEmotion: "Mixed joy", emoji: "🎭" },
      { esEmotion: "Envidia", enEmotion: "Envy", emoji: "🟢" },
      { esEmotion: "Inspiración", enEmotion: "Inspiration", emoji: "⚡" },
      { esEmotion: "Vacío", enEmotion: "Emptiness", emoji: "🕳️" },
    ],
  },
  {
    esText: "Un familiar mayor te llama por teléfono solo para conversar, sin motivo específico.",
    enText: "An elderly family member calls you just to talk, no specific reason.",
    esContext: "Familia · presencia",
    enContext: "Family · presence",
    options: [
      { esEmotion: "Ternura", enEmotion: "Tenderness", emoji: "🤍" },
      { esEmotion: "Culpa", enEmotion: "Guilt", emoji: "🌫️" },
      { esEmotion: "Conexión", enEmotion: "Connection", emoji: "🔗" },
      { esEmotion: "Apuro", enEmotion: "Hurry", emoji: "⏱️" },
    ],
  },
  {
    esText: "Te das cuenta que reaccionaste mal en una conversación importante.",
    enText: "You realize you reacted badly in an important conversation.",
    esContext: "Auto-conciencia · arrepentimiento",
    enContext: "Self-awareness · regret",
    options: [
      { esEmotion: "Arrepentimiento", enEmotion: "Regret", emoji: "💭" },
      { esEmotion: "Vergüenza", enEmotion: "Shame", emoji: "🫥" },
      { esEmotion: "Curiosidad", enEmotion: "Curiosity", emoji: "🔍" },
      { esEmotion: "Frustración", enEmotion: "Frustration", emoji: "💢" },
    ],
  },
  {
    esText: "Una persona desconocida te ayuda sin esperar nada a cambio.",
    enText: "A stranger helps you without expecting anything in return.",
    esContext: "Comunidad · gratitud",
    enContext: "Community · gratitude",
    options: [
      { esEmotion: "Gratitud", enEmotion: "Gratitude", emoji: "🙏" },
      { esEmotion: "Asombro", enEmotion: "Awe", emoji: "✨" },
      { esEmotion: "Confianza renovada", enEmotion: "Renewed trust", emoji: "🌅" },
      { esEmotion: "Incomodidad", enEmotion: "Discomfort", emoji: "🤷" },
    ],
  },
];

const POINTS_PICK = 5;
const POINTS_JUSTIFY = 10;

export default function EmotionMatchPage() {
  const { lang } = useI18n();
  const isEN = lang === "en";

  const [round, setRound] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [justification, setJustification] = useState("");
  const [results, setResults] = useState<Array<{ pickedIndex: number; justified: boolean; points: number }>>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPoints, setSavedPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenario = SCENARIOS[round];
  const totalPoints = results.reduce((acc, r) => acc + r.points, 0);
  const justifiedCount = results.filter((r) => r.justified).length;

  function next() {
    if (pickedIndex === null) return;
    const justified = justification.trim().length >= 6;
    const points = POINTS_PICK + (justified ? POINTS_JUSTIFY : 0);
    setResults((arr) => [...arr, { pickedIndex, justified, points }]);
    setPickedIndex(null);
    setJustification("");
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
      const res = await fetch("/api/learning/play/emotion-match/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPoints, rounds: results.length, justifiedCount }),
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

        <div className="rowi-card bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border-[var(--rowi-primary)]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
                {isEN ? "Emotion Match" : "Empareja la Emoción"}
              </h1>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {isEN
                  ? "Naming what you feel is the first competence of EQ. No right or wrong — choose what connects, then explain why."
                  : "Nombrar lo que sentís es la primera competencia del EQ. No hay correcta o incorrecta — elegí la que conecte y contá por qué."}
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
                  ? `You justified ${justifiedCount} of ${SCENARIOS.length} choices.`
                  : `Justificaste ${justifiedCount} de ${SCENARIOS.length} elecciones.`}
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
                {isEN ? scenario.enContext : scenario.esContext}
              </div>
              <p className="text-lg font-medium text-[var(--rowi-foreground)] leading-snug">
                {isEN ? scenario.enText : scenario.esText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {scenario.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setPickedIndex(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    pickedIndex === idx
                      ? "bg-gradient-to-br from-[var(--rowi-primary)]/15 to-[var(--rowi-secondary)]/10 border-[var(--rowi-primary)]/40 scale-[1.01]"
                      : "bg-[var(--rowi-card-elev)] border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)]/30"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                  <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                    {isEN ? opt.enEmotion : opt.esEmotion}
                  </span>
                </button>
              ))}
            </div>

            {pickedIndex !== null && (
              <div className="space-y-2">
                <label className="text-xs text-[var(--rowi-muted)]">
                  {isEN
                    ? "Why this one? (optional, +10 pts if you justify)"
                    : "¿Por qué esta? (opcional, +10 pts si justificás)"}
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={2}
                  maxLength={280}
                  placeholder={isEN ? "Because..." : "Porque..."}
                  className="w-full rounded-lg p-3 text-sm bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] text-[var(--rowi-foreground)] resize-none focus:outline-none focus:border-[var(--rowi-primary)]/50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--rowi-muted-weak)]">
                    {justification.trim().length}/280 ·{" "}
                    {justification.trim().length >= 6
                      ? isEN ? "+10 pts unlocked" : "+10 pts desbloqueados"
                      : isEN ? "min 6 chars for bonus" : "mín 6 chars para bonus"}
                  </span>
                  <button onClick={next} className="rowi-btn-primary inline-flex items-center gap-2">
                    {round + 1 >= SCENARIOS.length
                      ? isEN ? "See results" : "Ver resultados"
                      : isEN ? "Next" : "Siguiente"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!finished && results.length > 0 && (
          <div className="text-center text-sm text-[var(--rowi-muted)]">
            {isEN ? "Running total: " : "Acumulado: "}
            <span className="font-semibold text-[var(--rowi-foreground)]">{totalPoints} pts</span>
            {" · "}
            {justifiedCount} / {results.length} {isEN ? "justified" : "justificadas"}
          </div>
        )}
      </div>
    </div>
  );
}
