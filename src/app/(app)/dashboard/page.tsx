"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Heart,
  Users,
  Zap,
  MessageCircle,
  ArrowRight,
  BarChart3,
  Star,
  Flame,
  Compass
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

// === Componentes existentes ===
import CompetenciesSpider from "@/components/charts/CompetenciesSpider";
import { EqTotalBar } from "@/components/metrics/EqTotalBar";
import { PursuitsBars } from "@/components/metrics/PursuitsBars";
import { MoodChip } from "@/components/dashboard/MoodChip";
import DailyPulseCard from "@/components/dashboard/DailyPulseCard";
import { TalentCluster } from "@/components/talents/TalentCluster";
import { getTalentLabel } from "@/domains/eq/lib/dictionary";
import OutcomesPanel from "@/components/outcomes/OutcomesPanel";
import OverallSummary from "@/components/outcomes/OverallSummary";
import CoachPanel from "@/components/coach/CoachPanel";
import FeedbackPanel from "@/components/dashboard/FeedbackPanel";
import RowiLevelPill from "@/components/shared/RowiLevelPill";
import { EQ_MAX, EQ_LEVELS, getEqLevel, toPercentOf135 } from "@/domains/eq/lib/eqLevels";

/**
 * Resuelve el label localizado de un Brain Talent. Delega en getTalentLabel
 * (dictionary.ts), que normaliza la key cruda PascalCase del API ("DataMining",
 * "Reflecting", "Designing") a la key camelCase del diccionario. El lookup
 * directo anterior fallaba con PascalCase y dejaba el nombre crudo.
 */
function talentLabel(k: string, lang: string): string {
  return getTalentLabel(k, lang);
}

export default function ClientDashboard() {
  const { lang, t } = useI18n();

  const [base, setBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cargar EQ real desde API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/eq/me", { cache: "no-store" });
        const data = await res.json();
        setBase(data);
      } catch (err) {
        console.error("Error cargando /api/eq/me:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !base) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--rowi-g1)]/20 to-[var(--rowi-g2)]/20 flex items-center justify-center animate-pulse">
            <Image
              src="/rowivectors/Rowi-06.webp"
              alt="Rowi"
              width={60}
              height={60}
              className="object-contain"
            />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[var(--rowi-g2)] border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">
          {t("dashboardPg.loading", "Cargando tu perfil emocional...")}
        </p>
      </div>
    );
  }

  const eqTotal = base.eq?.total ?? 0;

  // SIN lectura aún: un dashboard en ceros no guía a nadie (bug Eduardo F7).
  // Mostramos el camino: Rowi Test gratis → SEI completo → planes.
  if (!eqTotal) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <Image
          src="/rowivectors/Rowi-06.webp"
          alt="Rowi"
          width={120}
          height={120}
          className="object-contain mb-6"
        />
        <h1 className="text-2xl font-bold text-[var(--rowi-fg)] mb-2">
          {t("dashboard.empty.title", "Tu espejo está esperando su primera lectura")}
        </h1>
        <p className="text-sm text-[var(--rowi-muted)] max-w-md mb-8">
          {t(
            "dashboard.empty.body",
            "Este panel se llena con tu inteligencia emocional real. Empieza con el Rowi Test gratis (2 minutos) o ve directo al SEI completo de Six Seconds."
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/mini-sei" className="rowi-btn-primary px-6 py-3 text-sm font-medium">
            {t("dashboard.empty.miniSei", "Hacer mi Rowi Test gratis · 2 min")}
          </Link>
          <Link
            href="/sei"
            className="px-6 py-3 text-sm font-medium rounded-full border border-[var(--rowi-card-border)] text-[var(--rowi-fg)] hover:border-[var(--rowi-primary)]"
          >
            {t("dashboard.empty.fullSei", "Quiero el SEI completo")}
          </Link>
        </div>
        <Link
          href="/pricing"
          className="mt-4 text-xs text-[var(--rowi-muted)] underline hover:text-[var(--rowi-fg)]"
        >
          {t("dashboard.empty.plans", "Ver planes con SEI incluido")}
        </Link>
      </div>
    );
  }

  const eqLevel = getEqLevel(eqTotal);
  const userName = base.user?.name?.split(" ")[0] || t("dashboardPg.user", "Usuario");

  // Ghost / Previous snapshot
  const prev = base.previous;
  const prevEqTotal = prev?.eq?.total ?? null;
  const eqDelta = eqTotal && prevEqTotal ? Math.round((eqTotal - prevEqTotal) * 10) / 10 : null;

  return (
    <div className="space-y-8 pt-20 pb-12 px-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          {/* Kicker: el dashboard es la vista analítica profunda; TODAY es el home. */}
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-[var(--rowi-g2)] mb-1">
            {t("dashboardPg.deepView", "Vista completa")}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("dashboardPg.welcome", "Bienvenido de vuelta")}, <span className="rowi-gradient-text">{userName}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("dashboardPg.subtitle", "Tu espacio de crecimiento emocional")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/today"
            className="rounded-xl border border-[var(--rowi-g2)]/40 px-4 py-2 text-sm font-medium text-[var(--rowi-g2)] hover:bg-[var(--rowi-g2)]/5 transition-colors whitespace-nowrap"
          >
            {t("dashboardPg.backToToday", "Ir a mi día")}
          </Link>
          <MoodChip
            text={base.mood?.recentText ?? "—"}
            emoji={base.mood?.recentEmoji ?? "🙂"}
          />
        </div>
      </motion.div>

      {/* DAILY PULSE — 1 pregunta SEI por día */}
      <DailyPulseCard />

      {/* QUICK ACTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {!base.signals?.hasSEI && (
          <QuickAction
            href="/sei"
            icon={Zap}
            label={t("dashboardPg.takeSei", "Tomar evaluación SEI")}
            gradient="from-yellow-500 to-orange-500"
          />
        )}
        {base.signals?.hasSEI && (
          <QuickAction
            href="/rowi"
            icon={MessageCircle}
            label={t("dashboardPg.startChat", "Iniciar conversación")}
            gradient="from-yellow-500 to-orange-500"
          />
        )}
        <QuickAction
          href="/affinity"
          icon={Heart}
          label={t("dashboardPg.exploreAffinity", "Explorar Afinidad")}
          gradient="from-pink-500 to-rose-500"
        />
        <QuickAction
          href="/community"
          icon={Users}
          label={t("dashboardPg.joinCommunity", "Unirse a la Comunidad")}
          gradient="from-blue-500 to-cyan-500"
        />
        <QuickAction
          href="/progress"
          icon={TrendingUp}
          label={t("dashboardPg.viewProgress", "Ver mi progreso")}
          gradient="from-green-500 to-emerald-500"
        />
        <QuickAction
          href="/settings/subscription"
          icon={Sparkles}
          label={t("dashboardPg.upgradePlan", "Mejora tu plan")}
          gradient="from-violet-500 to-fuchsia-500"
        />
      </motion.div>

      {/* EQ SCORE + COMPETENCIES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* EQ Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                {t("dashboardPg.eqScore", "Tu Puntuación EQ")}
              </h2>
              <a
                href="https://www.6seconds.org/2025/04/23/the-six-seconds-eq-model/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--rowi-g2)] hover:underline"
              >
                {t("dashboardPg.eqScoreDesc", "Basado en la metodología Six Seconds")} →
              </a>
            </div>
          </div>

          {/* EQ Level Display */}
          <div className="mb-6 text-center">
            <div
              className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
              style={{ backgroundColor: `${eqLevel.color}15` }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: eqLevel.color }}
              />
              <span
                className="text-2xl font-bold"
                style={{ color: eqLevel.color }}
              >
                {eqLevel.label}
              </span>
              {eqDelta != null && eqDelta !== 0 && (
                <span className={`text-sm font-semibold ${eqDelta > 0 ? "text-green-500" : "text-red-400"}`}>
                  {eqDelta > 0 ? "\u2191" : "\u2193"}{Math.abs(eqDelta)}
                </span>
              )}
            </div>
            {/* Legend: current vs previous */}
            {prev && (
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: eqLevel.color }} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {t("dashboardPg.current", "Actual")}{base.snapshotProject ? ` · ${base.snapshotProject}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full opacity-30" style={{ backgroundColor: eqLevel.color }} />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {t("dashboardPg.previous", "Anterior")} · {prev.project || (prev.date ? new Date(prev.date).toLocaleDateString() : "")}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 relative h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              {/* Ghost bar (previous EQ) */}
              {prevEqTotal != null && (
                <div
                  className="absolute inset-y-0 left-0 h-full rounded-full opacity-25"
                  style={{ width: `${(prevEqTotal / EQ_MAX) * 100}%`, backgroundColor: eqLevel.color }}
                />
              )}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(eqTotal / EQ_MAX) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="relative h-full rounded-full"
                style={{ backgroundColor: eqLevel.color }}
              />
            </div>
          </div>

          {/* Pursuits K/C/G */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              {t("dashboardPg.pursuits", "Los 3 Propósitos")}
            </h3>
            <PursuitsBars
              know={base.eq?.pursuits?.know ?? null}
              choose={base.eq?.pursuits?.choose ?? null}
              give={base.eq?.pursuits?.give ?? null}
              prevKnow={prev?.eq?.pursuits?.know ?? null}
              prevChoose={prev?.eq?.pursuits?.choose ?? null}
              prevGive={prev?.eq?.pursuits?.give ?? null}
              max={EQ_MAX}
            />
          </div>
        </motion.div>

        {/* Competencies Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                {t("dashboardPg.competencies", "Competencias Emocionales")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("dashboardPg.competenciesDesc", "Tus 8 competencias del modelo SEI")}
              </p>
            </div>
          </div>

          {Object.values(base.eq?.competencias || {}).some(
            (v) => typeof v === "number" && v > 0
          ) ? (
            <>
              <div className="h-64">
                <CompetenciesSpider
                  comps={base.eq?.competencias}
                  compare={prev?.eq?.competencias ?? null}
                  datePresent={base.snapshotProject || (base.snapshotDate ? new Date(base.snapshotDate).toLocaleDateString() : null)}
                  dateCompare={prev?.project || (prev?.date ? new Date(prev.date).toLocaleDateString() : null)}
                />
              </div>
              <IndicatorsLegend indicatorsLabel={t("dashboardPg.indicators", "Indicadores de nivel")} />
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                {t("dashboardPg.noCompetencies", "Completa tu evaluación SEI para ver tus competencias")}
              </p>
              <Link
                href="/sei"
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                {t("dashboardPg.takeSei", "Tomar evaluación SEI")}
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* TALENTS — solo mostrar si hay datos de Brain Talents */}
      {(Object.keys(base.eq?.talents?.focus || {}).length > 0 ||
        Object.keys(base.eq?.talents?.decisions || {}).length > 0 ||
        Object.keys(base.eq?.talents?.drive || {}).length > 0) && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          {t("dashboardPg.talents", "Tus Talentos")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <TalentCard
            title={t("dashboardPg.focus", "Enfoque")}
            icon={Target}
            color="#1E88E5"
            talents={Object.entries(base.eq?.talents?.focus || {})
              .filter(([k]) => k.replace(/[\s_]/g, "").toLowerCase() !== "brainagility")
              .map(([k, v]) => ({
                label: talentLabel(k, lang),
                value: toPercentOf135(typeof v === "number" ? v : 0),
                raw: typeof v === "number" ? v : null,
              }))}
          />
          <TalentCard
            title={t("dashboardPg.decisions", "Decisiones")}
            icon={Flame}
            color="#E53935"
            talents={Object.entries(base.eq?.talents?.decisions || {})
              .filter(([k]) => k.replace(/[\s_]/g, "").toLowerCase() !== "brainagility")
              .map(([k, v]) => ({
                label: talentLabel(k, lang),
                value: toPercentOf135(typeof v === "number" ? v : 0),
                raw: typeof v === "number" ? v : null,
              }))}
          />
          <TalentCard
            title={t("dashboardPg.drive", "Impulso")}
            icon={TrendingUp}
            color="#43A047"
            talents={Object.entries(base.eq?.talents?.drive || {})
              .filter(([k]) => k.replace(/[\s_]/g, "").toLowerCase() !== "brainagility")
              .map(([k, v]) => ({
                label: talentLabel(k, lang),
                value: toPercentOf135(typeof v === "number" ? v : 0),
                raw: typeof v === "number" ? v : null,
              }))}
          />
        </div>
      </motion.div>
      )}

      {/* OUTCOMES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--rowi-g2)]" />
          {t("dashboardPg.outcomes", "Resultados de Vida")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm h-full">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                {t("dashboardPg.overall", "Puntuación General")}
              </h3>
              <OverallSummary
                overall4={base.outcomes?.overall4 ?? null}
                subtitle={`${base.outcomes?.overall4 ?? "—"} / ${EQ_MAX} · ${getEqLevel(base.outcomes?.overall4 ?? 0).label}`}
                color={getEqLevel(base.outcomes?.overall4 ?? 0).color}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t("dashboardPg.outcomesDesc", "Cómo tu IE impacta tu bienestar")}
              </p>
              <OutcomesPanel
                present={{ ...base.outcomes, success: base.success }}
                compare={prev?.outcomes ?? null}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* FEEDBACK / EVOLUTION (if previous snapshot exists) */}
      {prev && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <FeedbackPanel
            present={{ competencias: base.eq?.competencias }}
            refA={prev?.eq?.competencias ?? null}
            datePresent={base.snapshotProject || (base.snapshotDate ? new Date(base.snapshotDate).toLocaleDateString() : null)}
            dateCompare={prev?.project || (prev?.date ? new Date(prev.date).toLocaleDateString() : null)}
          />
        </motion.div>
      )}

      {/* ROWI COACH */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 rounded-2xl border border-[var(--rowi-g2)]/20 p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
              <Image
                src="/rowivectors/Rowi-06.webp"
                alt="Rowi"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--rowi-g2)]" />
                {t("dashboardPg.coachTitle", "Rowi Coach")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("dashboardPg.coachDesc", "Tu compañero de inteligencia emocional está listo para ayudarte")}
              </p>
            </div>
          </div>

          <div className="md:ml-auto">
            <Link
              href="/rowi"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              {t("dashboardPg.startChat", "Iniciar conversación")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <CoachPanel
            compact
            profile={{
              user: base.user,
              mood: base.mood,
              brain: base.brain,
              eq: base.eq,
              outcomes: base.outcomes,
              success: base.success,
            }}
          />
        </div>
      </motion.div>

      {/* ADDITIONAL INFO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm"
      >
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--rowi-g2)]" />
          {t("dashboardPg.additionalInfo", "Información Adicional")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboardPg.user", "Usuario")}</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {base.user?.name ?? "—"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {base.user?.email ?? "—"}
            </p>
          </div>
          {base.brain?.style && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("dashboardPg.brainStyle", "Estilo cerebral")}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {base.brain.style}
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          {t("dashboardPg.dataSource", "Fuente de datos")}: {base.source}
        </p>
      </motion.div>
    </div>
  );
}

/* =========================================================
   🔗 Quick Action Button
========================================================= */
function QuickAction({
  href,
  icon: Icon,
  label,
  gradient
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] hover:shadow-md transition-all group"
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)] transition-colors">
        {label}
      </span>
    </Link>
  );
}

/* =========================================================
   🎯 Talent Card
========================================================= */
function TalentCard({
  title,
  icon: Icon,
  color,
  talents,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  talents: { label: string; value: number; raw: number | null }[];
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <TalentCluster
        title=""
        color={color}
        talents={talents}
      />
    </div>
  );
}

/* =========================================================
   📊 Indicators Legend
========================================================= */
function IndicatorsLegend({ indicatorsLabel }: { indicatorsLabel: string }) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {indicatorsLabel}
      </div>
      <div className="flex flex-wrap gap-3">
        {EQ_LEVELS.map((lvl) => (
          <div key={lvl.key} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: lvl.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {lvl.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
