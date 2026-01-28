"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * =========================================================
 * 🧭 AffinityMonitor (Rowi SIA)
 * ---------------------------------------------------------
 * Visualiza el ecosistema de afinidad del usuario y del equipo usando
 * los endpoints del motor modular de Affinity:
 * - /api/affinity/dashboard         → panel personal
 * - /api/affinity/dashboard/team    → panel del equipo (tenant)
 *
 * Diseño: Tailwind + Recharts (sin dependencias raras)
 * ---------------------------------------------------------
 * Props opcionales:
 *   baseUrl?: string      → para pruebas locales o SSR en previews
 *   compact?: boolean     → modo compacto (oculta secciones pesadas)
 * =========================================================
 */
export default function AffinityMonitor({ baseUrl = "", compact = false }: { baseUrl?: string; compact?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [meDash, setMeDash] = useState<any>(null);
  const [teamDash, setTeamDash] = useState<any>(null);

  const dashURL = `${baseUrl}/api/affinity/dashboard`;
  const teamURL = `${baseUrl}/api/affinity/dashboard/team`;

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [a, b] = await Promise.all([
          fetch(dashURL, { cache: "no-store" }),
          fetch(teamURL, { cache: "no-store" }),
        ]);
        const ja = await a.json();
        const jb = await b.json();
        if (!alive) return;
        if (!ja?.ok) throw new Error(ja?.error || "Dashboard error");
        setMeDash(ja);
        // team puede fallar si no hay tenant → no rompemos panel
        setTeamDash(jb?.ok ? jb : null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error cargando Affinity Monitor");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [dashURL, teamURL]);

  const colors = {
    primary: "#31a2e3",
    secondary: "#d797cf",
    warm: "#f59f00",
    hot: "#22c55e",
    cold: "#94a3b8",
  };

  const bandColor = (band?: string) =>
    band === "hot" ? colors.hot : band === "warm" ? colors.warm : colors.cold;

  const dailySeries = useMemo(() => meDash?.interactions?.daily ?? [], [meDash]);
  const topMembers = useMemo(() => meDash?.topMembers ?? [], [meDash]);
  const topEmotions = useMemo(() => meDash?.global?.topEmotions ?? [], [meDash]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-border/20 bg-surface p-6 animate-pulse">
        <div className="h-6 w-48 rounded bg-foreground/10 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-foreground/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-2xl border border-red-300/30 bg-red-50/40 dark:bg-red-950/20 p-4">
        <div className="text-red-700 dark:text-red-300 font-semibold mb-1">No se pudo cargar el Affinity Monitor</div>
        <div className="text-sm opacity-80">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header global */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-primary">Affinity Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Termómetro emocional y de conexión — actualizado {new Date(meDash?.updatedAt || Date.now()).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BandPill band={meDash?.global?.band} />
          <span className="text-sm text-muted-foreground">
            {meDash?.global?.relationships ?? 0} relaciones monitoreadas
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Affinity global" value={`${meDash?.global?.heat ?? 0}%`} hint="Promedio de afinidad personal" band={meDash?.global?.band} />
        <KpiCard title="Efectividad" value={meDash?.global?.avgEffectiveness != null ? `${meDash.global.avgEffectiveness}%` : "—"} hint="Interacciones efectivas últimos 30 días" />
        <KpiCard title="Top emoción" value={topEmotions?.[0]?.tag || "—"} hint="Emoción predominante reciente" />
      </div>

      {/* Emociones predominantes */}
      {!compact && (
        <div className="rounded-2xl border border-border/20 bg-surface p-4">
          <SectionTitle title="Emociones predominantes" subtitle="Últimos 30 días" />
          {topEmotions?.length ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {topEmotions.map((e: any) => (
                <span key={e.tag} className="inline-flex items-center gap-2 rounded-full border border-border/30 px-3 py-1 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.secondary }} />
                  {e.tag}
                  <span className="text-muted-foreground">×{e.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sin datos de emociones recientes.</div>
          )}
        </div>
      )}

      {/* Interacciones diarias */}
      <div className="rounded-2xl border border-border/20 bg-surface p-4">
        <SectionTitle title="Interacciones" subtitle="Frecuencia (30 días)" />
        {dailySeries?.length ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} hide={dailySeries.length > 20} />
                <YAxis width={32} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill={colors.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Sin interacciones registradas.</div>
        )}
      </div>

      {/* Top relaciones */}
      <div className="rounded-2xl border border-border/20 bg-surface p-4">
        <SectionTitle title="Relaciones destacadas" subtitle="Top 5 por afinidad" />
        {topMembers?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {topMembers.map((m: any) => (
              <div key={`${m.memberId}-${m.context}`} className="rounded-xl border border-border/20 bg-background/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate">{m.memberId}</div>
                  <span className="text-sm font-bold" style={{ color: bandColor(m.band) }}>{m.heat}%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Contexto: {m.context || "general"}</div>
                <div className="text-xs text-muted-foreground">Cercanía: {m.closeness || "—"}</div>
                {m.aiSummary && (
                  <div className="mt-2 text-xs italic text-foreground/80 line-clamp-3">{m.aiSummary}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Aún no hay relaciones destacadas.</div>
        )}
      </div>

      {/* Sección equipo (si existe tenant) */}
      {teamDash?.ok && (
        <div className="rounded-2xl border border-border/20 bg-surface p-4">
          <SectionTitle title="Equipo" subtitle={`Miembros: ${teamDash?.team?.members || 0}`} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <KpiCard title="Affinity equipo" value={`${teamDash?.team?.avgHeat ?? 0}%`} hint="Promedio de afinidad del tenant" band={teamDash?.team?.band} />
            <KpiCard title="Efectividad equipo" value={teamDash?.team?.avgEffectiveness != null ? `${teamDash.team.avgEffectiveness}%` : "—"} hint="Interacciones efectivas (30 días)" />
            <KpiCard title="Top emoción equipo" value={teamDash?.team?.topEmotions?.[0]?.tag || "—"} hint="Predominante en 30 días" />
          </div>

          {/* Contextos */}
          {teamDash?.byContext?.length ? (
            <div className="h-56 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={teamDash.byContext} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="context" tick={{ fontSize: 12 }} />
                  <YAxis width={32} tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="avg" stroke={colors.secondary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {/* Ranking */}
          {teamDash?.ranking?.length ? (
            <div className="rounded-xl border border-border/20 bg-background/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Miembro</th>
                    <th className="px-3 py-2">Affinity</th>
                    <th className="px-3 py-2">Conexiones</th>
                  </tr>
                </thead>
                <tbody>
                  {teamDash.ranking.map((r: any, idx: number) => (
                    <tr key={r.userId} className="border-t border-border/10">
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 font-semibold" style={{ color: bandColor(r.avgHeat >= 70 ? "hot" : r.avgHeat >= 45 ? "warm" : "cold") }}>{r.avgHeat}%</td>
                      <td className="px-3 py-2">{r.connections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sin datos de equipo disponibles.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🧩 Subcomponentes UI
========================================================= */
function KpiCard({ title, value, hint, band }: { title: string; value: string; hint?: string; band?: string }) {
  const color = band === "hot" ? "text-green-500" : band === "warm" ? "text-amber-500" : "text-slate-400";
  return (
    <div className="rounded-2xl border border-border/20 bg-surface p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className={`text-2xl font-semibold mt-1 ${band ? color : "text-foreground"}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function BandPill({ band }: { band?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    hot: { label: "HOT", className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
    warm: { label: "WARM", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    cold: { label: "COLD", className: "bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30" },
  };
  const cfg = band ? map[band] : map.cold;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.className}`}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: "currentColor" }} />
      {cfg.label}
    </span>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-2">
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
