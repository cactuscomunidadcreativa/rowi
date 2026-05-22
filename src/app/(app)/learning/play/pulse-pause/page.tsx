"use client";

/**
 * Pulse Pause — el mini-game core de Rowi.
 *
 * Six Seconds enseña que la diferencia entre reaccionar y responder es
 * una pausa de ~6 segundos. Este mini-game practica esa pausa: ante un
 * escenario emocional, el jugador debe MANTENER PRESIONADO el botón
 * durante 6 segundos antes de responder. Si suelta antes, "reaccionó".
 * Si completa los 6, "respondió" — más puntos y feedback educacional.
 *
 * 5 rondas → máximo 100 puntos. Al final POST a la API persiste el
 * total en UserPoints con reason=MICRO_LEARNING.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ArrowLeft, Trophy, Sparkles, Heart, AlertCircle, CheckCircle2 } from "lucide-react";

interface Scenario {
  esText: string;
  enText: string;
  esContext: string;
  enContext: string;
}

const SCENARIOS: Scenario[] = [
  {
    esText: "Tu jefe critica tu informe frente al equipo.",
    enText: "Your boss criticizes your report in front of the team.",
    esContext: "Trabajo · feedback público",
    enContext: "Work · public feedback",
  },
  {
    esText: "Tu pareja olvida algo importante que prometió hacer.",
    enText: "Your partner forgets something important they promised to do.",
    esContext: "Pareja · promesa rota",
    enContext: "Partner · broken promise",
  },
  {
    esText: "Un coche te corta el paso de manera peligrosa en la carretera.",
    enText: "A car cuts you off dangerously on the road.",
    esContext: "Tráfico · seguridad",
    enContext: "Traffic · safety",
  },
  {
    esText: "Recibes un mensaje pasivo-agresivo de un amigo.",
    enText: "You get a passive-aggressive message from a friend.",
    esContext: "Amistad · conflicto",
    enContext: "Friendship · conflict",
  },
  {
    esText: "Te enteras de que un compañero recibió el ascenso que esperabas.",
    enText: "You find out a colleague got the promotion you were hoping for.",
    esContext: "Trabajo · ego",
    enContext: "Work · ego",
  },
];

const HOLD_MS = 6000;
const POINTS_FULL_HOLD = 20;
const POINTS_REACTED = 5;

export default function PulsePausePage() {
  const { lang } = useI18n();
  const isEN = lang === "en";
  const [round, setRound] = useState(0);
  const [holding, setHolding] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [roundResults, setRoundResults] = useState<Array<{ paused: boolean; points: number }>>([]);
  const [showResult, setShowResult] = useState<null | { paused: boolean; points: number }>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPoints, setSavedPoints] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startedAt = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  function tick() {
    if (startedAt.current === null) return;
    const elapsed = Date.now() - startedAt.current;
    setHoldMs(elapsed);
    if (elapsed >= HOLD_MS) {
      completeRound(true);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  function startHold() {
    if (showResult || finished) return;
    startedAt.current = Date.now();
    setHolding(true);
    setHoldMs(0);
    raf.current = requestAnimationFrame(tick);
  }

  function releaseHold() {
    if (!holding) return;
    const elapsed = startedAt.current ? Date.now() - startedAt.current : 0;
    startedAt.current = null;
    setHolding(false);
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (elapsed >= HOLD_MS) {
      // Already completed via tick
      return;
    }
    completeRound(false);
  }

  function completeRound(paused: boolean) {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    startedAt.current = null;
    setHolding(false);
    const points = paused ? POINTS_FULL_HOLD : POINTS_REACTED;
    const result = { paused, points };
    setRoundResults((arr) => [...arr, result]);
    setShowResult(result);
  }

  function nextRound() {
    setShowResult(null);
    setHoldMs(0);
    if (round + 1 >= SCENARIOS.length) {
      setFinished(true);
    } else {
      setRound((r) => r + 1);
    }
  }

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const totalPoints = roundResults.reduce((acc, r) => acc + r.points, 0);
  const pauseCount = roundResults.filter((r) => r.paused).length;
  const progressPct = Math.min(100, (holdMs / HOLD_MS) * 100);

  async function collectPoints() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/learning/play/pulse-pause/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPoints, pauseCount, rounds: roundResults.length }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setSaveError(data?.error ?? (isEN ? "Could not save points" : "No pudimos guardar tus puntos"));
        return;
      }
      setSavedPoints(data.pointsAdded ?? totalPoints);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  const scenario = SCENARIOS[round];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--rowi-bg)] to-[var(--rowi-card-elev)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
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

        {/* Title */}
        <div className="rowi-card bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border-[var(--rowi-primary)]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
                {isEN ? "Pulse Pause" : "Pausa de Pulso"}
              </h1>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {isEN
                  ? "Six Seconds is the difference between reacting and responding. Hold the button for 6 seconds before answering each scenario."
                  : "Seis segundos es la diferencia entre reaccionar y responder. Mantén pulsado el botón durante 6 segundos antes de responder a cada escenario."}
              </p>
            </div>
          </div>
        </div>

        {/* Finished screen */}
        {finished ? (
          <div className="rowi-card text-center space-y-5 py-8">
            <Trophy className="w-14 h-14 mx-auto text-amber-500" />
            <div>
              <h2 className="text-2xl font-bold text-[var(--rowi-foreground)] mb-1">
                {isEN ? "Round complete" : "Ronda completa"}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)]">
                {isEN
                  ? `You paused ${pauseCount} of ${SCENARIOS.length} times.`
                  : `Pausaste ${pauseCount} de ${SCENARIOS.length} veces.`}
              </p>
            </div>
            <div className="text-4xl font-bold rowi-gradient-text">
              +{totalPoints} {isEN ? "Rowi Points" : "Rowi Points"}
            </div>
            {savedPoints !== null ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {isEN
                    ? `${savedPoints} points added to your balance.`
                    : `${savedPoints} puntos sumados a tu saldo.`}
                </div>
                <div>
                  <Link href="/learning" className="rowi-btn-primary inline-flex items-center gap-2">
                    {isEN ? "Back to Learning" : "Volver a Aprendizaje"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {saveError && (
                  <div className="text-sm text-rose-500 inline-flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {saveError}
                  </div>
                )}
                <button
                  onClick={collectPoints}
                  disabled={saving}
                  className="rowi-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {saving
                    ? isEN ? "Saving..." : "Guardando..."
                    : isEN ? "Collect points" : "Recolectar puntos"}
                </button>
              </div>
            )}
          </div>
        ) : showResult ? (
          /* Result screen */
          <div className="rowi-card text-center space-y-4 py-6">
            {showResult.paused ? (
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <div>
                  <h2 className="text-xl font-bold text-[var(--rowi-foreground)] mb-1">
                    {isEN ? "You responded." : "Respondiste."}
                  </h2>
                  <p className="text-sm text-[var(--rowi-muted)] max-w-md mx-auto">
                    {isEN
                      ? "Six full seconds. The amygdala calmed, the prefrontal cortex took over. That pause is the work."
                      : "Seis segundos completos. La amígdala se calmó, la corteza prefrontal tomó el mando. Esa pausa es el trabajo."}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
                <div>
                  <h2 className="text-xl font-bold text-[var(--rowi-foreground)] mb-1">
                    {isEN ? "You reacted." : "Reaccionaste."}
                  </h2>
                  <p className="text-sm text-[var(--rowi-muted)] max-w-md mx-auto">
                    {isEN
                      ? "The signal moved through the limbic system faster than the cortex could respond. That's reaction, not response. Try staying with the discomfort next time."
                      : "La señal pasó por el sistema límbico antes de que la corteza pudiera responder. Eso es reacción, no respuesta. La próxima vez intenta sostener el malestar."}
                  </p>
                </div>
              </>
            )}
            <div className="text-2xl font-bold rowi-gradient-text">
              +{showResult.points} {isEN ? "points" : "puntos"}
            </div>
            <button onClick={nextRound} className="rowi-btn-primary">
              {round + 1 >= SCENARIOS.length
                ? isEN ? "See results" : "Ver resultados"
                : isEN ? "Next scenario" : "Siguiente escenario"}
            </button>
          </div>
        ) : (
          /* Round screen */
          <div className="rowi-card space-y-5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)] mb-1">
                {isEN ? scenario.enContext : scenario.esContext}
              </div>
              <p className="text-lg font-medium text-[var(--rowi-foreground)] leading-snug">
                {isEN ? scenario.enText : scenario.esText}
              </p>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-[var(--rowi-muted)] mb-4">
                {isEN
                  ? "Hold the button for 6 seconds before responding."
                  : "Mantén pulsado el botón durante 6 segundos antes de responder."}
              </p>
              <button
                onMouseDown={startHold}
                onMouseUp={releaseHold}
                onMouseLeave={releaseHold}
                onTouchStart={startHold}
                onTouchEnd={releaseHold}
                className={`relative inline-flex items-center justify-center w-40 h-40 rounded-full font-semibold text-white text-base shadow-lg transition-all select-none ${
                  holding
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 scale-105"
                    : "bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
                }`}
                style={{ touchAction: "manipulation" }}
              >
                <div
                  className="absolute inset-0 rounded-full bg-white/20"
                  style={{
                    clipPath: holding
                      ? `inset(${100 - progressPct}% 0 0 0)`
                      : "inset(100% 0 0 0)",
                    transition: holding ? "none" : "clip-path 0.2s ease-out",
                  }}
                />
                <span className="relative z-10">
                  {holding
                    ? `${Math.max(0, Math.ceil((HOLD_MS - holdMs) / 1000))}s`
                    : isEN ? "Hold" : "Pulsa"}
                </span>
              </button>
              <p className="text-xs text-[var(--rowi-muted-weak)] mt-3">
                {isEN
                  ? "Release before 6s = reaction. Hold the full 6s = response."
                  : "Sueltas antes de 6s = reacción. Mantienes los 6s = respuesta."}
              </p>
            </div>
          </div>
        )}

        {/* Running tally */}
        {!finished && roundResults.length > 0 && (
          <div className="text-center text-sm text-[var(--rowi-muted)]">
            {isEN ? "Running total: " : "Acumulado: "}
            <span className="font-semibold text-[var(--rowi-foreground)]">
              {totalPoints} {isEN ? "pts" : "pts"}
            </span>
            {" · "}
            {pauseCount} / {roundResults.length} {isEN ? "paused" : "pausas completas"}
          </div>
        )}
      </div>
    </div>
  );
}
