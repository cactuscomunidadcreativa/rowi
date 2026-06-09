"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flame, Moon, Info, ShieldCheck } from "lucide-react";
import {
  RowiStageImage,
  type RowiStage,
} from "@/domains/avatar/components/RowiStageImage";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Pantalla de Becoming — "En quién te estás convirtiendo".
 *
 * El protagonista es el BECOMING (práctica + reflexión diaria): el progreso
 * hacia la siguiente etapa del Rowi y la "vida" que le da la racha.
 * El nivel base (SEI formal o mini-SEI INDICATIVO) solo define el ESTADIO de
 * partida. Lee /api/avatar (sistema de dos ejes ya existente) y
 * /api/daily-pulse/today (señal de reflexión + racha).
 *
 * Niveles Six Seconds → asset del Rowi (consecutivos, sin saltar ninguno):
 *  1 Desafío → Rowi-02 · 2 Emergente → Rowi-03 · 3 Funcional → Rowi-04
 *  4 Diestro → Rowi-05 · 5 Experto → Rowi-06
 * (Rowi-01 es el inicio del viaje y vive en el hero por etapa de Becoming.)
 */

const LEVEL_ASSET: Record<number, string> = {
  1: "/rowivectors/Rowi-02.webp",
  2: "/rowivectors/Rowi-03.webp",
  3: "/rowivectors/Rowi-04.webp",
  4: "/rowivectors/Rowi-05.webp",
  5: "/rowivectors/Rowi-06.webp",
};

type BaseSource = "sei" | "mini_sei" | "none";

interface AvatarState {
  rowiLevel: number;
  sixSecondsLevel: number;
  baseSource: BaseSource;
  evolutionScore: number;
  currentStage: string;
  nextStage: string | null;
  progressToNext: number;
  hatchProgress: number;
  isHatched: boolean;
  canHatchNow: boolean;
  sixSecondsLevelInfo: {
    name: { es: string; en: string };
    emoji: string;
    color: string;
    slug: string;
  };
  stageInfo: {
    name: { es: string; en: string };
    description: { es: string; en: string };
    emoji: string;
  };
  totalXP: number;
  daysActive: number;
}

const ALL_STAGES = ["EGG", "HATCHING", "BABY", "YOUNG", "ADULT", "WISE"] as const;

/** Particle count grows with the streak — more daily practice = more life. */
function lifeParticles(streak: number): number {
  if (streak <= 0) return 0;
  if (streak < 3) return 2;
  if (streak < 7) return 4;
  return 6;
}

export default function AvatarPage() {
  const { t, lang } = useI18n();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  const tzOffset =
    typeof window !== "undefined" ? -new Date().getTimezoneOffset() : 0;

  const { data: avatarRes, isLoading: avatarLoading } = useSWR(
    isAuthenticated ? "/api/avatar" : null,
    fetcher
  );
  const { data: pulseRes } = useSWR(
    isAuthenticated ? `/api/daily-pulse/today?tz=${tzOffset}` : null,
    fetcher
  );

  if (status === "loading" || (isAuthenticated && avatarLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image
              src="/rowivectors/Rowi-01.webp"
              alt={t("avatar.becoming.hero.alt", "Tu Rowi")}
              width={120}
              height={120}
              className="mx-auto drop-shadow-xl"
            />
          </motion.div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            {t("avatar.becoming.loading", "Cargando tu Rowi...")}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          {t("avatar.becoming.signIn", "Inicia sesión para ver tu Rowi")}
        </p>
      </div>
    );
  }

  const state: AvatarState | null = avatarRes?.ok ? avatarRes.data : null;

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 px-4">
        <div className="text-center">
          <Image
            src="/rowivectors/Rowi-01.webp"
            alt={t("avatar.becoming.hero.alt", "Tu Rowi")}
            width={140}
            height={140}
            className="mx-auto drop-shadow-xl mb-4"
          />
          <p className="text-gray-500 dark:text-gray-400">
            {t(
              "avatar.becoming.foundation.none",
              "Haz tu espejo emocional para ver tu punto de partida"
            )}
          </p>
        </div>
      </div>
    );
  }

  const level = state.sixSecondsLevel;
  const levelColor = state.sixSecondsLevelInfo?.color ?? "#7c3aed";
  const levelName =
    state.sixSecondsLevelInfo?.name?.[lang as "es" | "en"] ??
    state.sixSecondsLevelInfo?.name?.es ??
    "";
  const heroAsset = LEVEL_ASSET[level] ?? LEVEL_ASSET[1];

  const streak = pulseRes?.ok ? pulseRes.streak?.current ?? 0 : 0;
  const reflectedToday = pulseRes?.ok ? !!pulseRes.answeredToday : false;
  const particleCount = lifeParticles(streak);

  const stageName =
    state.stageInfo?.name?.[lang as "es" | "en"] ?? state.stageInfo?.name?.es ?? "";
  const nextStageName = state.nextStage
    ? (t(`avatar.stages.${state.nextStage}`, state.nextStage) as string)
    : null;

  // Lenguaje preciso (evita claims falsos de SEI):
  // - Foundation = Emotional Mirror (baseline provisional, mini-SEI inferido)
  // - Practice Energy = vida diaria (práctica + reflexión + streak)
  // - "Validated by SEI" = solo aparece si hay SEI formal cargado
  const hasFoundation = state.baseSource !== "none";
  const isValidatedBySei = state.baseSource === "sei";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header — Becoming protagonista */}
        <div className="text-center mb-2">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2"
          >
            <Sparkles className="w-7 h-7 text-violet-500" />
            {t("avatar.becoming.title", "En quién te estás convirtiendo")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 mt-1 text-sm"
          >
            {t(
              "avatar.becoming.subtitle",
              "Tu Rowi nace desde tu espejo inicial y evoluciona con tu práctica"
            )}
          </motion.p>
        </div>

        {/* HERO — el Rowi con vida proporcional a la racha */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative rounded-3xl shadow-2xl p-8 overflow-hidden bg-white dark:bg-zinc-800"
          style={{
            boxShadow:
              streak > 0
                ? `0 20px 60px -15px ${levelColor}55`
                : undefined,
          }}
        >
          {/* Glow de vida (más fuerte con la racha) */}
          {streak > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${levelColor}22, transparent 60%)`,
              }}
            />
          )}

          {/* Partículas de vida */}
          <AnimatePresence>
            {Array.from({ length: particleCount }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  y: [0, -50, -100],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                className="absolute text-2xl pointer-events-none"
                style={{ left: `${15 + i * 13}%`, bottom: "25%" }}
              >
                ✨
              </motion.span>
            ))}
          </AnimatePresence>

          <div className="relative flex flex-col items-center">
            {/* HÉROE: el huevo→búho real por etapa de Becoming (assets reales). */}
            <RowiStageImage
              stage={state.currentStage as RowiStage}
              size="xl"
              float
              alt={t("avatar.becoming.hero.alt", "Tu Rowi")}
            />

            {/* Etapa actual del Rowi */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <span>{state.stageInfo?.emoji}</span>
              {stageName}
            </motion.h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center max-w-sm">
              {state.stageInfo?.description?.[lang as "es" | "en"] ??
                state.stageInfo?.description?.es}
            </p>

            {/* Progreso de eclosión — solo antes de nacer. Crece por reflexión. */}
            {!state.isHatched && (
              <div className="w-full max-w-md mt-4">
                {state.canHatchNow ? (
                  <motion.p
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center text-sm font-semibold text-violet-600 dark:text-violet-400"
                  >
                    {t("avatar.becoming.hatch.ready", "¡Tu Rowi está listo para nacer! ✨")}
                  </motion.p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>{t("avatar.becoming.hatch.progress", "Tu huevo está creciendo")}</span>
                      <span>{Math.round(state.hatchProgress)}%</span>
                    </div>
                    <div className="h-2.5 bg-amber-100 dark:bg-zinc-700/60 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(3, Math.round(state.hatchProgress))}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                      {t(
                        "avatar.becoming.hatch.hint",
                        "Cada reflexión diaria acerca a tu Rowi a nacer"
                      )}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* BARRA DE BECOMING — el héroe del progreso */}
            <div className="w-full max-w-md mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {t("avatar.becoming.progressLabel", "Tu evolución")}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {state.nextStage && nextStageName
                    ? (t("avatar.becoming.toNextStage", "Camino a {stage}") as string).replace(
                        "{stage}",
                        nextStageName
                      )
                    : t("avatar.becoming.maxStage", "Has alcanzado la etapa más alta de tu Rowi")}
                </span>
              </div>
              <div className="h-4 bg-violet-100 dark:bg-zinc-700/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, Math.round(state.progressToNext))}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
              </div>
            </div>

            {/* Señal de reflexión de hoy */}
            <div className="mt-4">
              {reflectedToday ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
                  {t("avatar.becoming.reflectedToday", "Hoy reflexionaste ✨")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                  <Moon className="w-4 h-4" />
                  {t("avatar.becoming.notReflectedToday", "Aún no reflexionas hoy")}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* VIDA — racha + días contigo */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              {t("avatar.becoming.practice.title", "Energía de práctica")}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            {t("avatar.becoming.practice.label", "Basado en tus prácticas y reflexiones")}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {streak <= 0
              ? t(
                  "avatar.becoming.life.none",
                  "Empieza hoy: tu primera reflexión le da vida a tu Rowi"
                )
              : streak === 1
              ? t("avatar.becoming.life.streakOne", "1 día de práctica")
              : (t("avatar.becoming.life.streak", "{count} días de práctica") as string).replace(
                  "{count}",
                  String(streak)
                )}
          </p>
          {state.daysActive > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {(t("avatar.becoming.life.daysActive", "{count} días contigo") as string).replace(
                "{count}",
                String(state.daysActive)
              )}
            </p>
          )}
        </motion.div>

        {/* FOUNDATION — espejo inicial (baseline provisional). Nunca afirma "tu
            nivel SEI es X": el sello "Validated by SEI" solo aparece con SEI formal. */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("avatar.becoming.foundation.title", "Punto de partida")}
            </h3>
            {isValidatedBySei && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                style={{ backgroundColor: "#10b98122", color: "#047857" }}
              >
                <ShieldCheck className="w-3 h-3" />
                {t("avatar.becoming.validated.badge", "Validado por SEI")}
              </span>
            )}
          </div>

          {hasFoundation ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="relative h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: `${levelColor}15` }}
                >
                  <Image
                    src={heroAsset}
                    alt={t("avatar.becoming.hero.alt", "Tu Rowi")}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  {/* Si hay SEI formal, sí podemos nombrar el nivel validado.
                      Si es espejo inicial, solo el lenguaje provisional. */}
                  {isValidatedBySei ? (
                    <>
                      <p className="font-semibold" style={{ color: levelColor }}>
                        {levelName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("avatar.becoming.foundation.label", "Basado en tu espejo inicial")}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      {t("avatar.becoming.foundation.label", "Basado en tu espejo inicial")}
                    </p>
                  )}
                </div>
              </div>
              {isValidatedBySei ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {t(
                    "avatar.becoming.validated.hint",
                    "Tu baseline está validado por tu evaluación Six Seconds formal."
                  )}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {t(
                    "avatar.becoming.foundation.hint",
                    "Tu punto de partida proviene de tu espejo emocional (mini-SEI inferido). Es una estimación provisional, no una evaluación formal."
                  )}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              {t(
                "avatar.becoming.foundation.none",
                "Haz tu espejo emocional para ver tu punto de partida"
              )}
            </p>
          )}
        </motion.div>

        {/* ETAPAS DEL ROWI */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t("avatar.becoming.stagesTitle", "Las etapas de tu Rowi")}
          </h3>
          <div className="flex items-center justify-between gap-1">
            {ALL_STAGES.map((stg) => {
              const currentIdx = ALL_STAGES.indexOf(
                state.currentStage as (typeof ALL_STAGES)[number]
              );
              const idx = ALL_STAGES.indexOf(stg);
              const reached = currentIdx >= 0 && idx <= currentIdx;
              const isCurrent = stg === state.currentStage;
              return (
                <div key={stg} className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={`text-xl md:text-2xl transition-all ${
                      reached ? "" : "opacity-30 grayscale"
                    } ${isCurrent ? "scale-125" : ""}`}
                  >
                    {stageEmoji(stg)}
                  </div>
                  <span
                    className={`text-[10px] mt-1 text-center truncate w-full ${
                      isCurrent
                        ? "font-bold text-violet-600 dark:text-violet-400"
                        : "text-gray-400"
                    }`}
                  >
                    {t(`avatar.stages.${stg}`, stg)}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold text-violet-500">
                      {t("avatar.becoming.current", "Actual")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Emoji por etapa (espejo del backend AVATAR_STAGES). */
function stageEmoji(stage: string): string {
  const map: Record<string, string> = {
    EGG: "🥚",
    HATCHING: "🐣",
    BABY: "🐥",
    YOUNG: "🦉",
    ADULT: "🦅",
    WISE: "🪶",
  };
  return map[stage] ?? "🥚";
}
