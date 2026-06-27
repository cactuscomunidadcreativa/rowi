"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import ConsentRefreshBanner from "@/components/vital-signs/ConsentRefreshBanner";
import Link from "next/link";
import { ROWI_ARCHETYPES } from "@/lib/vital-signs/catalog";
import {
  vsDriverName,
  vsDriverNeed,
  vsPpName,
  vsPpFunction,
  vsOutcomeName,
  vsOrientationName,
  vsOrientationIdentity,
  vsArchetypeName,
  vsArchetypeTagline,
  type VsLang,
} from "@/lib/vital-signs/vsLocale";
import ContextDetailDrawer from "@/components/vital-signs/ContextDetailDrawer";
import DailyPulseWeek from "@/components/dashboard/DailyPulseWeek";
import { BudgetCrossCard } from "@/components/vital-signs/BudgetCrossCard";
import { MiniSeiTrendCard } from "@/components/vital-signs/MiniSeiTrendCard";
import {
  Activity,
  Brain,
  Compass,
  Loader2,
  Sparkles,
  Heart,
  Target,
  Zap,
  TrendingUp,
  Users,
  Building2,
  Home,
  Globe2,
  MessageCircleQuestion,
  ChevronRight,
} from "lucide-react";

type Band = "low" | "mid" | "high" | "unknown";
type Quadrant = "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS" | "BALANCED";

interface PulsePoint {
  code: string;
  driver: "TRUST" | "MOTIVATION" | "CHANGE" | "TEAMWORK" | "EXECUTION";
  esName: string;
  enName: string;
  esFunction: string;
  enFunction: string;
  score: number | null;
  competencyComponent: number | null;
  talentComponent: number | null;
  band: Band;
  delta: number | null;
}

interface Driver {
  code: PulsePoint["driver"];
  esName: string;
  enName: string;
  esNeed: string;
  enNeed: string;
  score: number | null;
  band: Band;
  pulsePoints: PulsePoint[];
}

interface VSData {
  ok: boolean;
  source: "inferred" | "no-snapshot";
  user: { name: string; email: string };
  snapshotDate: string | null;
  snapshotProject: string | null;
  drivers: Driver[];
  pulsePoints: PulsePoint[];
  quadrant: {
    code: Quadrant;
    esName: string;
    enName: string;
    scores: Record<Exclude<Quadrant, "BALANCED">, number | null>;
  };
  benchmark: { mean: number; source: string };
  coverage: { hasSei: boolean; hasTalents: boolean; seiCount: number; talentCount: number };
}

const DRIVER_STYLE: Record<Driver["code"], { accent: string; icon: typeof Heart }> = {
  TRUST:      { accent: "text-sky-600 dark:text-sky-300",       icon: Heart },
  MOTIVATION: { accent: "text-amber-600 dark:text-amber-300",    icon: Sparkles },
  CHANGE:     { accent: "text-violet-600 dark:text-violet-300",  icon: TrendingUp },
  TEAMWORK:   { accent: "text-emerald-600 dark:text-emerald-300", icon: Brain },
  EXECUTION:  { accent: "text-rose-600 dark:text-rose-300",      icon: Target },
};

const BAND_DOT: Record<Band, string> = {
  low: "bg-rose-500",
  mid: "bg-amber-500",
  high: "bg-emerald-500",
  unknown: "bg-[var(--rowi-muted-weak)]",
};

const BAND_RING: Record<Band, string> = {
  low: "ring-rose-300/60",
  mid: "ring-amber-300/60",
  high: "ring-emerald-300/60",
  unknown: "ring-transparent",
};

interface CheckIn {
  ok: boolean;
  pulsePointCode?: string;
  driver?: string;
  ageDays?: number | null;
  question?: string | null;
}

interface ContextCard {
  scope: "team" | "org" | "family" | "world";
  subjectId: string;
  subjectName: string;
  subjectSlug?: string;
  suppressed: boolean;
  n: number;
  nTotal: number;
  overallMean: number | null;
  engagementIndex: number | null;
  topDriver: { code: string; esName: string; enName: string; scoreMean: number } | null;
  bottomDriver: { code: string; esName: string; enName: string; scoreMean: number } | null;
  archetype: {
    quadrant: "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS";
    esName: string;
    enName: string;
    esTagline: string;
    enTagline: string;
    emoji: string;
  } | null;
  orientation: {
    quadrant: "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS";
    esName: string;
    enName: string;
    esIdentity: string;
    enIdentity: string;
    emoji: string;
  } | null;
  orientationSecondary: {
    quadrant: "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS";
    esName: string;
    enName: string;
    esIdentity: string;
    enIdentity: string;
    emoji: string;
  } | null;
  orientationCombined: boolean;
  orientationDelta: number | null;
  outcomes: Array<{ code: string; esName: string; enName: string; scoreMean: number | null }>;
}

interface MultiContextData {
  ok: boolean;
  teams: ContextCard[];
  orgs: ContextCard[];
  families: ContextCard[];
  world: ContextCard | null;
}

export default function VitalSignsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VSData | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [checkInValue, setCheckInValue] = useState(3);
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [multiCtx, setMultiCtx] = useState<MultiContextData | null>(null);
  const [detailOpen, setDetailOpen] = useState<{
    scope: "team" | "org" | "family" | "world";
    subjectId: string;
  } | null>(null);

  // Cards/drawer resuelven pt/it vía vsLocale; la sección personal de
  // abajo sigue cayendo a es para pt/it (su i18n vive aparte).
  const lang = locale as VsLang;

  useEffect(() => {
    fetch("/api/vital-signs/me")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((e) => console.error("vital-signs load error:", e))
      .finally(() => setLoading(false));

    fetch(`/api/vital-signs/check-in?locale=${locale}`)
      .then((r) => r.json())
      .then(setCheckIn)
      .catch(() => {});

    fetch("/api/vital-signs/multi-context")
      .then((r) => r.json())
      .then((json: MultiContextData) => setMultiCtx(json))
      .catch(() => {});
  }, [locale]);

  async function submitCheckIn() {
    if (!checkIn?.pulsePointCode) return;
    setCheckInSaving(true);
    try {
      await fetch("/api/vital-signs/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pulsePointCode: checkIn.pulsePointCode,
          source: "self_check",
          value: checkInValue,
        }),
      });
      setCheckInDone(true);
    } finally {
      setCheckInSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-[var(--rowi-muted)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t("vs.loading", "Calculando tus Vital Signs...")}</span>
        </div>
      </div>
    );
  }

  const noData =
    !data ||
    data.ok === false ||
    !data.coverage ||
    data.source === "no-snapshot" ||
    !data.coverage.hasSei;

  return (
    <div className="space-y-6 p-6">
      <ConsentRefreshBanner />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
              {t("vs.title", "Mis Vital Signs")}
            </h1>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("vs.subtitle", "Tu perfil de los 5 drivers y 15 pulse points del modelo Six Seconds")}
            </p>
          </div>
        </div>
        {data?.snapshotProject && (
          <span className="rowi-chip">{data.snapshotProject}</span>
        )}
      </div>

      {noData ? (
        <div className="rowi-card text-center py-12">
          <Compass className="w-12 h-12 mx-auto mb-4 text-[var(--rowi-muted-weak)]" />
          <h2 className="text-base font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("vs.noData", "Aún no podemos calcular tus Vital Signs")}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-6 max-w-md mx-auto">
            {t("vs.noDataDesc", "Para inferir tus 15 pulse points necesitamos primero un SEI Assessment de Six Seconds.")}
          </p>
          <button onClick={() => router.push("/hub/settings")} className="rowi-btn-primary">
            {t("vs.linkSEI", "Vincular SEI Assessment")}
          </button>
        </div>
      ) : (
        <>
          {/* Daily pulse 7-day sparkline */}
          <DailyPulseWeek />

          {/* Mini-SEI monthly trend (trait) */}
          <MiniSeiTrendCard />

          {/* Emotional Budgeting — capacity vs perception gap */}
          <BudgetCrossCard />

          {/* Intelligent check-in */}
          {checkIn?.question && !checkInDone && (
            <div className="rowi-card bg-gradient-to-br from-[var(--rowi-primary)]/5 to-[var(--rowi-secondary)]/5 border-[var(--rowi-primary)]/20">
              <div className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide mb-2">
                {t("vs.checkIn.title", "Check-in semanal · 1 pregunta")}
              </div>
              <p className="text-base font-medium text-[var(--rowi-foreground)] mb-4">
                {checkIn.question}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setCheckInValue(v)}
                      className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                        checkInValue === v
                          ? "bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white"
                          : "bg-[var(--rowi-card-elev)] text-[var(--rowi-foreground)] hover:opacity-80"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[var(--rowi-muted-weak)]">
                  {t("vs.checkIn.scale", "1 = nada · 5 = mucho")}
                </span>
                <button
                  onClick={submitCheckIn}
                  disabled={checkInSaving}
                  className="rowi-btn-primary ml-auto disabled:opacity-50"
                >
                  {checkInSaving ? "..." : t("vs.checkIn.send", "Enviar")}
                </button>
              </div>
            </div>
          )}
          {checkInDone && (
            <div className="rowi-card bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30">
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                {t("vs.checkIn.thanks", "Gracias. Tu lectura quedó registrada como microsignal.")}
              </p>
            </div>
          )}

          {/* Coverage notice */}
          <div className="rowi-card bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p>{t("vs.coverage.notice", "Estos scores son una inferencia v0 desde tu perfil SEI y Brain Talents.")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-amber-700 dark:text-amber-200/80">
                  <span>{t("vs.coverage.seiCount", "Competencias SEI")}: {data!.coverage.seiCount}/8</span>
                  <span>{t("vs.coverage.talentCount", "Brain Talents")}: {data!.coverage.talentCount}/18</span>
                  <span>{t("vs.benchmark.mean", "Norma = 100")} · {t("vs.benchmark.network", "Six Seconds Network")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quadrant */}
          <div className="rowi-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("vs.section.quadrant", "Tu cuadrante dominante")}
              </h3>
              <Compass className="w-5 h-5 text-[var(--rowi-muted)]" />
            </div>
            <div className="text-3xl font-bold rowi-gradient-text mb-2">
              {t(
                `vs.quadrant.${data!.quadrant.code.toLowerCase()}`,
                vsOrientationName(data!.quadrant.code, lang, data!.quadrant.esName, data!.quadrant.enName),
              )}
            </div>
            {data!.quadrant.code !== "BALANCED" && ROWI_ARCHETYPES[data!.quadrant.code] && (
              <div className="mb-3 flex items-center gap-2 text-sm">
                <span className="text-xl">{ROWI_ARCHETYPES[data!.quadrant.code].emoji}</span>
                <div>
                  <div className="font-semibold text-[var(--rowi-foreground)]">
                    {vsArchetypeName(
                      data!.quadrant.code,
                      lang,
                      ROWI_ARCHETYPES[data!.quadrant.code].esName,
                      ROWI_ARCHETYPES[data!.quadrant.code].enName,
                    )}
                  </div>
                  <div className="text-xs text-[var(--rowi-muted)]">
                    {vsArchetypeTagline(
                      data!.quadrant.code,
                      lang,
                      ROWI_ARCHETYPES[data!.quadrant.code].esTagline,
                      ROWI_ARCHETYPES[data!.quadrant.code].enTagline,
                    )}
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-[var(--rowi-muted)] mb-4">
              {t("vs.quadrant.notice", "El cuadrante es un arquetipo dominante, no una etiqueta fija.")}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {(["LINTERNA", "MAPA", "BOTIQUIN", "BOTAS"] as const).map((q) => {
                const score = data!.quadrant.scores[q];
                const active = data!.quadrant.code === q;
                const qLabelKey = `vs.quadrant.${q.toLowerCase()}`;
                return (
                  <div
                    key={q}
                    className={`rounded-xl p-3 border transition-colors ${
                      active
                        ? "bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border-[var(--rowi-primary)]/40"
                        : "bg-[var(--rowi-card-elev)] border-[var(--rowi-card-border)]"
                    }`}
                  >
                    <div className="text-xs text-[var(--rowi-muted)] mb-1">{t(qLabelKey, q)}</div>
                    <div className="text-base font-semibold text-[var(--rowi-foreground)]">
                      {score?.toFixed(1) ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drivers */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
              {t("vs.section.drivers", "Los 5 drivers")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {data!.drivers.map((d) => {
                const style = DRIVER_STYLE[d.code];
                const Icon = style.icon;
                return (
                  <div key={d.code} className={`rowi-card ring-1 ${BAND_RING[d.band]}`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${style.accent}`} />
                      <span className={`w-2 h-2 rounded-full ${BAND_DOT[d.band]}`} />
                    </div>
                    <div className="text-2xl font-bold text-[var(--rowi-foreground)] mb-1">
                      {d.score?.toFixed(1) ?? "—"}
                    </div>
                    <div className="text-sm font-medium text-[var(--rowi-foreground)]">
                      {vsDriverName(d.code, lang, d.esName, d.enName)}
                    </div>
                    <div className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">
                      {vsDriverNeed(d.code, lang, d.esNeed, d.enNeed)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pulse Points grouped by driver */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
              {t("vs.section.pulsePoints", "Los 15 pulse points")}
            </h3>
            <div className="space-y-3">
              {data!.drivers.map((d) => {
                const style = DRIVER_STYLE[d.code];
                return (
                  <div key={d.code} className="rowi-card">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${BAND_DOT[d.band]}`} />
                      <span className={`text-sm font-medium ${style.accent}`}>
                        {vsDriverName(d.code, lang, d.esName, d.enName)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {d.pulsePoints.map((pp) => {
                        const ppKey = `vs.pp.${pp.code.split("_").slice(1).join("_").toLowerCase()}`;
                        const fallback = vsPpName(pp.code, lang, pp.esName, pp.enName);
                        return (
                          <div
                            key={pp.code}
                            className={`rounded-xl p-3 border bg-[var(--rowi-card-elev)] border-[var(--rowi-card-border)] ring-1 ${BAND_RING[pp.band]}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                                {t(ppKey, fallback)}
                              </span>
                              <span className="text-base font-semibold text-[var(--rowi-foreground)]">
                                {pp.score?.toFixed(1) ?? "—"}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--rowi-muted)] line-clamp-1 mb-2">
                              {vsPpFunction(pp.code, lang, pp.esFunction, pp.enFunction)}
                            </div>
                            {pp.delta !== null && (
                              <div className="text-xs text-[var(--rowi-muted)]">
                                {pp.delta > 0 ? "+" : ""}
                                {pp.delta.toFixed(1)}{" "}
                                <span className="text-[var(--rowi-muted-weak)]">
                                  {pp.delta > 1
                                    ? t("vs.delta.above", "Por encima")
                                    : pp.delta < -1
                                    ? t("vs.delta.below", "Por debajo")
                                    : t("vs.delta.aligned", "En la norma")}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {multiCtx?.ok && (
            <>
              <div className="rowi-card bg-gradient-to-r from-[var(--rowi-primary)]/5 to-[var(--rowi-secondary)]/5 border-[var(--rowi-primary)]/20">
                <p className="text-sm text-[var(--rowi-foreground)]">
                  {t(
                    "vs.multiCtx.inferenceNotice",
                    "Los siguientes agregados son una inferencia v0 desde los SEI + Brain Talents de los miembros, no son OVS / TVS oficiales medidos. La regla de privacidad N ≥ 5 oculta cualquier contexto con menos de 5 perfiles.",
                  )}
                </p>
              </div>
              <ContextSection
                title={t("vs.multiCtx.teams.title", "Mis equipos (TVS proxy)")}
                subtitle={t(
                  "vs.multiCtx.teams.subtitle",
                  "Cómo se ven los equipos a los que perteneces, inferidos desde los perfiles de sus miembros.",
                )}
                empty={t(
                  "vs.multiCtx.teams.empty",
                  "Aún no perteneces a ninguna comunidad con suficientes miembros.",
                )}
                cards={multiCtx.teams}
                lang={lang}
                t={t}
                Icon={Users}
                accent="text-emerald-600 dark:text-emerald-300"
                onOpenDetail={(scope, subjectId) => setDetailOpen({ scope, subjectId })}
              />
              <ContextSection
                title={t("vs.multiCtx.orgs.title", "Mis organizaciones (OVS proxy)")}
                subtitle={t(
                  "vs.multiCtx.orgs.subtitle",
                  "Cómo se ve cada organización a la que perteneces, inferida desde los perfiles de sus miembros.",
                )}
                empty={t(
                  "vs.multiCtx.orgs.empty",
                  "Aún no eres miembro de ninguna organización.",
                )}
                cards={multiCtx.orgs}
                lang={lang}
                t={t}
                Icon={Building2}
                accent="text-violet-600 dark:text-violet-300"
                onOpenDetail={(scope, subjectId) => setDetailOpen({ scope, subjectId })}
              />
              <ContextSection
                title={t("vs.multiCtx.families.title", "Mi familia (FVS proxy)")}
                subtitle={t(
                  "vs.multiCtx.families.subtitle",
                  "FVS inferido desde los perfiles de los miembros con consentimiento aceptado.",
                )}
                empty={t(
                  "vs.multiCtx.families.empty",
                  "Aún no declaraste vínculos familiares aceptados.",
                )}
                cards={multiCtx.families}
                lang={lang}
                t={t}
                Icon={Home}
                accent="text-rose-600 dark:text-rose-300"
                onOpenDetail={(scope, subjectId) => setDetailOpen({ scope, subjectId })}
              />
              <ContextSection
                title={t("vs.multiCtx.world.title", "La humanidad Rowi (OVS Rowiverse)")}
                subtitle={t(
                  "vs.multiCtx.world.subtitle",
                  "Cómo se ve hoy toda la base Rowi: el contexto 'mundo' al que perteneces aunque no tengas org propia.",
                )}
                empty={t(
                  "vs.multiCtx.world.empty",
                  "Aún no hay suficientes usuarios con perfil para mostrar el agregado mundial.",
                )}
                cards={multiCtx.world ? [multiCtx.world] : []}
                lang={lang}
                t={t}
                Icon={Globe2}
                accent="text-sky-600 dark:text-sky-300"
                onOpenDetail={(scope, subjectId) => setDetailOpen({ scope, subjectId })}
              />
            </>
          )}
        </>
      )}

      {detailOpen && (
        <ContextDetailDrawer
          scope={detailOpen.scope}
          subjectId={detailOpen.subjectId}
          open={!!detailOpen}
          onClose={() => setDetailOpen(null)}
        />
      )}
    </div>
  );
}

interface ContextSectionProps {
  title: string;
  subtitle: string;
  empty: string;
  cards: ContextCard[];
  lang: VsLang;
  t: (key: string, fallback: string) => string;
  Icon: typeof Users;
  accent: string;
  onOpenDetail: (scope: ContextCard["scope"], subjectId: string) => void;
}

function ContextSection({
  title,
  subtitle,
  empty,
  cards,
  lang,
  t,
  Icon,
  accent,
  onOpenDetail,
}: ContextSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${accent}`} />
        <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">{title}</h3>
      </div>
      <p className="text-xs text-[var(--rowi-muted)] mb-3">{subtitle}</p>
      {cards.length === 0 ? (
        <div className="rowi-card text-center py-6 text-sm text-[var(--rowi-muted)]">
          {empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => (
            <ContextCardItem
              key={`${c.scope}-${c.subjectId}`}
              card={c}
              lang={lang}
              t={t}
              accent={accent}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContextCardItemProps {
  card: ContextCard;
  lang: VsLang;
  t: (key: string, fallback: string) => string;
  accent: string;
  onOpenDetail: (scope: ContextCard["scope"], subjectId: string) => void;
}

function combineIdentities(
  t: (key: string, fallback: string) => string,
  a: string,
  b: string,
): string {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return t("vitalSignsPg.combineIdentities", "Combina {a} con {b}")
    .replace("{a}", x)
    .replace("{b}", y);
}

function ContextCardItem({ card, lang, t, accent, onOpenDetail }: ContextCardItemProps) {
  const hintKey = `vs.multiCtx.improvementHint.${card.scope}`;
  const hintFallback =
    card.scope === "team"
      ? "¿Cómo puedo aportar más a este equipo?"
      : card.scope === "org"
      ? "¿Qué quiero aportar a esta organización?"
      : card.scope === "family"
      ? "¿Cómo puedo cuidar mejor a mi familia?"
      : "¿Qué Rowi puedo aportar al mundo?";

  return (
    <div className="rowi-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--rowi-foreground)] truncate">
            {card.subjectName}
          </div>
          {card.subjectSlug && (
            <div className="text-[10px] text-[var(--rowi-muted-weak)] truncate">
              {card.subjectSlug}
            </div>
          )}
        </div>
        <span className="text-[10px] text-[var(--rowi-muted)] whitespace-nowrap">
          {card.n} / {card.nTotal} {t("vs.multiCtx.respondents", "respondentes")}
        </span>
      </div>

      {card.suppressed ? (
        <div className="text-xs text-[var(--rowi-muted)] py-4">
          {t(
            "vs.multiCtx.suppressed",
            "Sin suficientes datos para mostrar (mínimo 5 miembros con perfil completo).",
          )}
        </div>
      ) : (
        <>
          {(card.scope === "org" || card.scope === "world") && card.orientation && (
            <div className="flex items-center gap-2 text-xs bg-[var(--rowi-card-elev)] rounded-lg p-2">
              <span className="text-base whitespace-nowrap">
                {card.orientation.emoji}
                {card.orientationCombined && card.orientationSecondary && (
                  <>
                    <span className="text-[var(--rowi-muted)] mx-0.5">+</span>
                    {card.orientationSecondary.emoji}
                  </>
                )}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-[var(--rowi-foreground)] truncate">
                  {vsOrientationName(card.orientation.quadrant, lang, card.orientation.esName, card.orientation.enName)}
                  {card.orientationCombined && card.orientationSecondary && (
                    <span className="text-[var(--rowi-muted)]">
                      {" + "}
                      {vsOrientationName(
                        card.orientationSecondary.quadrant,
                        lang,
                        card.orientationSecondary.esName,
                        card.orientationSecondary.enName,
                      )}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--rowi-muted)] truncate">
                  {card.orientationCombined && card.orientationSecondary
                    ? combineIdentities(
                        t,
                        vsOrientationIdentity(card.orientation.quadrant, lang, card.orientation.esIdentity, card.orientation.enIdentity),
                        vsOrientationIdentity(card.orientationSecondary.quadrant, lang, card.orientationSecondary.esIdentity, card.orientationSecondary.enIdentity),
                      )
                    : vsOrientationIdentity(card.orientation.quadrant, lang, card.orientation.esIdentity, card.orientation.enIdentity)}
                </div>
              </div>
            </div>
          )}
          {(card.scope === "team" || card.scope === "family") && card.archetype && (
            <div className="flex items-center gap-2 text-xs bg-[var(--rowi-card-elev)] rounded-lg p-2">
              <span className="text-base">{card.archetype.emoji}</span>
              <div className="min-w-0">
                <div className="font-medium text-[var(--rowi-foreground)] truncate">
                  {vsArchetypeName(card.archetype.quadrant, lang, card.archetype.esName, card.archetype.enName)}
                </div>
                <div className="text-[10px] text-[var(--rowi-muted)] truncate">
                  {vsArchetypeTagline(card.archetype.quadrant, lang, card.archetype.esTagline, card.archetype.enTagline)}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)]">
                {t("vs.multiCtx.engagementIndex", "Índice de Engagement")}
              </div>
              <div className="text-2xl font-bold rowi-gradient-text">
                {card.engagementIndex ?? "—"}
                <span className="text-xs text-[var(--rowi-muted)] font-normal">/100</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)]">
                {t("vs.benchmark.mean", "Norma = 100")}
              </div>
              <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                {card.overallMean?.toFixed(1) ?? "—"}
              </div>
            </div>
          </div>
          {(card.topDriver || card.bottomDriver) && (
            <div className="text-xs space-y-1">
              {card.topDriver && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--rowi-muted)]">
                    {t("vs.multiCtx.topDriver", "Más fuerte")}
                  </span>
                  <span className={`font-medium ${accent}`}>
                    {vsDriverName(card.topDriver.code, lang, card.topDriver.esName, card.topDriver.enName)}{" "}
                    {card.topDriver.scoreMean.toFixed(1)}
                  </span>
                </div>
              )}
              {card.bottomDriver && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--rowi-muted)]">
                    {t("vs.multiCtx.bottomDriver", "Más débil")}
                  </span>
                  <span className="font-medium text-[var(--rowi-foreground)]">
                    {vsDriverName(card.bottomDriver.code, lang, card.bottomDriver.esName, card.bottomDriver.enName)}{" "}
                    {card.bottomDriver.scoreMean.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}
          {(card.scope === "org" || card.scope === "world") && card.outcomes.length > 0 && (
            <div className="pt-2 border-t border-[var(--rowi-card-border)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)] mb-1.5">
                {t("vs.multiCtx.outcomes.title", "4 outcomes del OVS")}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {card.outcomes.map((o) => (
                  <div key={o.code} className="text-xs">
                    <div className="text-[var(--rowi-muted)] truncate">
                      {vsOutcomeName(o.code, lang, o.esName, o.enName)}
                    </div>
                    <div className="font-semibold text-[var(--rowi-foreground)]">
                      {o.scoreMean?.toFixed(1) ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="border-t border-[var(--rowi-card-border)] pt-2 mt-auto space-y-2">
        {!card.suppressed && (
          <button
            onClick={() => onOpenDetail(card.scope, card.subjectId)}
            className="flex items-center gap-2 text-xs font-medium text-[var(--rowi-primary)] hover:opacity-80 w-full"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">
              {t("vs.multiCtx.viewCapital", "Ver capital emocional completo")}
            </span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        )}
        <Link
          href={`/hub/vital-signs/ask?scope=${card.scope}&subjectId=${card.subjectId}`}
          className="flex items-center gap-2 text-xs text-[var(--rowi-foreground)] hover:text-[var(--rowi-primary)] transition-colors"
        >
          <MessageCircleQuestion className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{t(hintKey, hintFallback)}</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </Link>
        <div className="text-[10px] text-[var(--rowi-muted-weak)]">
          {t("vs.multiCtx.disclaimer", "Inferencia v0 — no es OVS / TVS oficial")}
        </div>
      </div>
    </div>
  );
}
