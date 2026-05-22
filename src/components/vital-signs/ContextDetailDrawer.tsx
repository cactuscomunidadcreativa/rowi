"use client";

/**
 * ContextDetailDrawer — drill-down completo del "capital emocional" de un
 * contexto (team / org / family / world). Inventario Six Seconds: 8 SEI,
 * 5 drivers + cohesión, 15 PPs, 4 outcomes (org/world), arquetipo /
 * orientación dominante + secundaria, engagement index.
 *
 * Lazy: solo hace fetch al endpoint /api/vital-signs/context/[scope]/[id]
 * cuando se abre. Cierra con ESC o click fuera.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Heart,
  Sparkles,
  TrendingUp,
  Brain,
  Target,
  Zap,
  Compass,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Scope = "team" | "org" | "family" | "world";
type Quadrant = "LINTERNA" | "MAPA" | "BOTIQUIN" | "BOTAS";

interface AggDriver {
  code: "TRUST" | "MOTIVATION" | "CHANGE" | "TEAMWORK" | "EXECUTION";
  esName: string;
  enName: string;
  esNeed: string;
  enNeed: string;
  scoreMean: number | null;
  scoreSD: number | null;
  cohesion: "high" | "consistent" | "mid" | "low" | "unknown";
  n: number;
}

interface AggPp {
  code: string;
  driver: AggDriver["code"];
  esName: string;
  enName: string;
  esFunction: string;
  enFunction: string;
  scoreMean: number | null;
  scoreSD: number | null;
  n: number;
}

interface AggOutcome {
  code: string;
  esName: string;
  enName: string;
  scoreMean: number | null;
}

interface AggSei {
  key: string;
  esName: string;
  enName: string;
  pursuit: "know" | "choose" | "give";
  scoreMean: number | null;
  n: number;
}

interface AggTalent {
  key: string;
  esName: string;
  enName: string;
  category: "focus" | "decisions" | "drive";
  scoreMean: number | null;
  n: number;
}

interface DetailResponse {
  ok: boolean;
  error?: string;
  scope: Scope;
  subjectName: string;
  suppressed: boolean;
  n: number;
  nTotal: number;
  engagementIndex: number | null;
  overallMean: number | null;
  drivers: AggDriver[];
  pulsePoints: AggPp[];
  outcomes: AggOutcome[];
  seiCompetencies: AggSei[];
  brainTalents: AggTalent[];
  orientation: {
    quadrant: Quadrant;
    esName: string;
    enName: string;
    esIdentity: string;
    enIdentity: string;
    emoji: string;
  } | null;
  orientationSecondary: {
    quadrant: Quadrant;
    esName: string;
    enName: string;
    esIdentity: string;
    enIdentity: string;
    emoji: string;
  } | null;
  orientationCombined: boolean;
}

interface Props {
  scope: Scope;
  subjectId: string;
  open: boolean;
  onClose: () => void;
}

const COHESION_LABEL: Record<AggDriver["cohesion"], { es: string; en: string; cls: string }> = {
  high: { es: "Alta", en: "High", cls: "text-emerald-600 dark:text-emerald-300" },
  consistent: { es: "Consistente", en: "Consistent", cls: "text-emerald-500" },
  mid: { es: "Media", en: "Mid", cls: "text-amber-500" },
  low: { es: "Baja", en: "Low", cls: "text-rose-500" },
  unknown: { es: "—", en: "—", cls: "text-[var(--rowi-muted-weak)]" },
};

export default function ContextDetailDrawer({ scope, subjectId, open, onClose }: Props) {
  const { lang } = useI18n();
  const isEN = lang === "en";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/vital-signs/context/${scope}/${subjectId}`)
      .then((r) => r.json())
      .then((json: DetailResponse) => {
        if (!json.ok) {
          setError(json.error ?? (isEN ? "Could not load" : "No pudimos cargar"));
        } else {
          setData(json);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Network error"))
      .finally(() => setLoading(false));
  }, [open, scope, subjectId, isEN]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-[var(--rowi-bg)] border-l border-[var(--rowi-card-border)] overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 bg-[var(--rowi-bg)]/95 backdrop-blur border-b border-[var(--rowi-card-border)]">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)]">
                  {scope === "world"
                    ? isEN ? "Rowiverse" : "Rowiverse"
                    : scope === "org"
                      ? isEN ? "Organization" : "Organización"
                      : scope === "team"
                        ? isEN ? "Team" : "Equipo"
                        : isEN ? "Family" : "Familia"}
                </div>
                <h2 className="text-base font-semibold text-[var(--rowi-foreground)] truncate">
                  {data?.subjectName ?? "—"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--rowi-card-elev)]"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[var(--rowi-foreground)]" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {loading && (
                <div className="flex items-center gap-3 text-[var(--rowi-muted)] py-12 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEN ? "Loading..." : "Cargando..."}
                </div>
              )}

              {error && (
                <div className="rowi-card text-sm text-rose-500">{error}</div>
              )}

              {data && data.suppressed && (
                <div className="rowi-card text-sm text-[var(--rowi-muted)] text-center py-8">
                  {isEN
                    ? `Not enough data: ${data.n} of ${data.nTotal} members with a complete profile (need 5).`
                    : `No hay datos suficientes: ${data.n} de ${data.nTotal} miembros con perfil completo (mínimo 5).`}
                </div>
              )}

              {data && !data.suppressed && (
                <>
                  {/* Capital emocional disponible — hero */}
                  <div className="rounded-2xl p-5 bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border border-[var(--rowi-primary)]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
                      <span className="text-[10px] uppercase tracking-wider text-[var(--rowi-primary)] font-bold">
                        {isEN ? "Available emotional capital" : "Capital emocional disponible"}
                      </span>
                    </div>
                    <div className="flex items-end gap-4 mb-2">
                      <div className="text-5xl font-bold rowi-gradient-text">
                        {data.engagementIndex ?? "—"}
                        <span className="text-2xl text-[var(--rowi-muted)] font-normal">/100</span>
                      </div>
                      <div className="text-sm text-[var(--rowi-muted)] pb-2">
                        {isEN ? "Engagement Index" : "Índice de Engagement"}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--rowi-muted)] mt-2">
                      {isEN
                        ? `Inventory of ${data.n} member profiles aggregating SEI + Vital Signs + Brain Talents.`
                        : `Inventario de ${data.n} perfiles agregando SEI + Vital Signs + Brain Talents.`}
                    </p>
                    {data.orientation && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="text-lg">{data.orientation.emoji}</span>
                        <span className="font-semibold text-[var(--rowi-foreground)]">
                          {isEN ? data.orientation.enName : data.orientation.esName}
                          {data.orientationCombined && data.orientationSecondary && (
                            <span className="text-[var(--rowi-muted)] font-normal">
                              {" + "}
                              {isEN
                                ? data.orientationSecondary.enName
                                : data.orientationSecondary.esName}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 8 SEI competencies */}
                  {data.seiCompetencies.length > 0 && (
                    <Section
                      Icon={Brain}
                      title={isEN ? "8 SEI competencies (Know · Choose · Give)" : "8 competencias SEI (Conocer · Elegir · Dar)"}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {data.seiCompetencies.map((c) => (
                          <div
                            key={c.key}
                            className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                          >
                            <div className="text-[10px] uppercase text-[var(--rowi-muted-weak)]">
                              {c.pursuit}
                            </div>
                            <div className="text-xs text-[var(--rowi-foreground)] truncate">
                              {isEN ? c.enName : c.esName}
                            </div>
                            <div className="text-base font-bold text-[var(--rowi-foreground)]">
                              {c.scoreMean?.toFixed(1) ?? "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* 18 Brain Talents */}
                  {data.brainTalents.some((t) => t.scoreMean !== null) && (
                    <Section
                      Icon={Zap}
                      title={isEN ? "18 Brain Talents" : "18 Brain Talents"}
                    >
                      {(["focus", "decisions", "drive"] as const).map((cat) => {
                        const talents = data.brainTalents.filter((t) => t.category === cat);
                        const catLabelES = cat === "focus" ? "Foco" : cat === "decisions" ? "Decisiones" : "Impulso";
                        const catLabelEN = cat === "focus" ? "Focus" : cat === "decisions" ? "Decisions" : "Drive";
                        return (
                          <div key={cat} className="mb-3 last:mb-0">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted)] mb-1.5">
                              {isEN ? catLabelEN : catLabelES}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                              {talents.map((t) => (
                                <div
                                  key={t.key}
                                  className="rounded-lg p-2 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] flex items-center justify-between"
                                >
                                  <span className="text-xs text-[var(--rowi-foreground)] truncate">
                                    {isEN ? t.enName : t.esName}
                                  </span>
                                  <span className="text-sm font-semibold text-[var(--rowi-foreground)]">
                                    {t.scoreMean?.toFixed(1) ?? "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </Section>
                  )}

                  {/* 5 drivers + cohesión */}
                  <Section
                    Icon={Heart}
                    title={isEN ? "5 drivers + cohesion" : "5 drivers + cohesión"}
                  >
                    <div className="space-y-2">
                      {data.drivers.map((d) => (
                        <div
                          key={d.code}
                          className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                              {isEN ? d.enName : d.esName}
                            </div>
                            <div className="text-[10px] text-[var(--rowi-muted)] truncate">
                              {isEN ? d.enNeed : d.esNeed}
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <div className="text-base font-bold text-[var(--rowi-foreground)]">
                              {d.scoreMean?.toFixed(1) ?? "—"}
                            </div>
                            <div className={`text-[10px] ${COHESION_LABEL[d.cohesion].cls}`}>
                              SD {d.scoreSD?.toFixed(1) ?? "—"} ·{" "}
                              {isEN ? COHESION_LABEL[d.cohesion].en : COHESION_LABEL[d.cohesion].es}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* 15 pulse points */}
                  <Section
                    Icon={TrendingUp}
                    title={isEN ? "15 pulse points" : "15 pulse points"}
                  >
                    <div className="space-y-3">
                      {data.drivers.map((d) => {
                        const pps = data.pulsePoints.filter((p) => p.driver === d.code);
                        if (pps.length === 0) return null;
                        return (
                          <div key={d.code}>
                            <div className="text-xs font-semibold text-[var(--rowi-muted)] mb-1">
                              {isEN ? d.enName : d.esName}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                              {pps.map((pp) => (
                                <div
                                  key={pp.code}
                                  className="rounded-lg p-2 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)] flex items-center justify-between"
                                >
                                  <span className="text-xs text-[var(--rowi-foreground)] truncate">
                                    {isEN ? pp.enName : pp.esName}
                                  </span>
                                  <span className="text-sm font-semibold text-[var(--rowi-foreground)]">
                                    {pp.scoreMean?.toFixed(1) ?? "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>

                  {/* 4 outcomes (org / world only) */}
                  {(scope === "org" || scope === "world") && data.outcomes.length > 0 && (
                    <Section
                      Icon={Target}
                      title={isEN ? "4 OVS outcomes" : "4 outcomes del OVS"}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {data.outcomes.map((o) => (
                          <div
                            key={o.code}
                            className="rounded-lg p-3 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                          >
                            <div className="text-xs text-[var(--rowi-muted)] truncate">
                              {isEN ? o.enName : o.esName}
                            </div>
                            <div className="text-base font-bold text-[var(--rowi-foreground)]">
                              {o.scoreMean?.toFixed(1) ?? "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  <div className="text-[10px] text-[var(--rowi-muted-weak)] text-center pt-4">
                    {isEN
                      ? "v0 inference — not an official OVS / TVS. Norm = 100 · Source: Six Seconds Network."
                      : "Inferencia v0 — no es OVS / TVS oficial. Norma = 100 · Fuente: Six Seconds Network."}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  Icon,
  title,
  children,
}: {
  Icon: typeof Heart;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[var(--rowi-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
