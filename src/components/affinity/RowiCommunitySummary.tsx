"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

/* =========================================================
   📊 Barras visuales — grupos y contextos
========================================================= */
function BarStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value ?? 0}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-rowi-card-border relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${value ?? 0}%`,
            background:
              "linear-gradient(90deg,var(--rowi-g1),var(--rowi-g2),var(--rowi-g3))",
          }}
        />
      </div>
    </div>
  );
}

function BarStatTrend({ context, t }: { context: { key: string; avg: number }; t: (k: string, fallback?: string) => string }) {
  const map: Record<string, string> = {
    relationship: t("affinity.relationship", "❤️ Relaciones"),
    leadership: t("affinity.leadership", "🎯 Liderazgo"),
    conversation: t("affinity.conversation", "💬 Conversaciones"),
    decision: t("affinity.decision", "⚖️ Decisiones"),
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{map[context.key] || context.key}</span>
        <span>{context.avg ?? 0}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-rowi-card-border relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${context.avg ?? 0}%`,
            background:
              "linear-gradient(90deg,var(--rowi-g1),var(--rowi-g2),var(--rowi-g3))",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   🧾 Mini componente de uso IA + gráfico histórico
========================================================= */
function UsageSummary({ t }: { t: (k: string, fallback?: string) => string }) {
  const [usage, setUsage] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadUsage() {
      try {
        const [todayRes, histRes] = await Promise.all([
          fetch("/api/hub/usage/today", { cache: "no-store" }),
          fetch("/api/hub/usage/history", { cache: "no-store" }),
        ]);
        const today = await todayRes.json();
        const hist = await histRes.json();
        if (today.ok) setUsage(today);
        if (hist.ok) setHistory(hist.days || []);
      } catch {
        console.warn("⚠️ No se pudo cargar el uso IA");
      }
    }
    loadUsage();
  }, []);

  if (!usage) return null;

  const planColor =
    usage.plan === "enterprise"
      ? "#facc15"
      : usage.plan === "pro"
      ? "#7c3aed"
      : "#9ca3af";

  return (
    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 border-t pt-3">
      <div className="flex justify-between">
        <span>💡 {t("usage.plan", "Plan")}:</span>
        <span className="font-medium capitalize">{usage?.plan || "free"}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span>
          {usage?.scope === "tenant"
            ? `🏢 ${t("usage.tokens_tenant", "Tokens (Tenant):")}`
            : `🧠 ${t("usage.tokens_used", "Tokens usados:")}`}
        </span>
        <span>{(usage?.totalTokens ?? 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between mt-1 mb-3">
        <span>💲 {t("usage.estimated_cost", "Costo estimado")}:</span>
        <span>~${(usage?.estimatedCostUsd ?? 0).toFixed(4)}</span>
      </div>

      {history.length > 0 && (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={history}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#888" }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.9)",
                  borderRadius: 8,
                  border: "1px solid #eee",
                }}
                labelStyle={{ fontSize: 11, color: "#555" }}
                formatter={(v: any) => [
                  `${v?.toLocaleString() ?? 0} ${t("usage.tokens", "tokens")}`,
                  t("usage.label", "Consumo"),
                ]}
              />
              <Line
                type="monotone"
                dataKey="tokens"
                stroke={planColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-center text-[10px] text-gray-400 mt-1">
            {t("usage.last7days", "Consumo IA (últimos 7 días)")}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🌎 Componente principal — RowiCommunitySummary
========================================================= */
export default function RowiCommunitySummary({ members }: { members: any[] }) {
  const { t } = useI18n("affinity");
  const [summary, setSummary] = useState<any>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState("");
  const total = members.length;
  const withSEI = members.filter((m) => !!m.brainStyle).length;

  // 🔁 Cargar resumen
  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const res = await fetch("/api/affinity/summary", { cache: "no-store" });
        const data = await res.json();
        setSummary(data);

        if (data?.ok && !data?.empty) {
          const ai = await fetch("/api/affinity/interpret/global", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: data, locale: "es" }),
          });
          const j = await ai.json();
          if (j.ok && j.text) setInterpretation(j.text);
        }
      } catch (e) {
        console.error("❌ Error cargando resumen:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [members.length]);

  // 🔄 Recalcular afinidad
  async function recalcAffinity() {
    setLoading(true);
    setMsg(t("affinity.recalculating", "Recalculando afinidad…"));
    try {
      const res = await fetch("/api/affinity/recalculate?mode=manual");
      const j = await res.json();
      if (j.ok) {
        setMsg(t("affinity.updated", "Afinidad actualizada ✅"));
        window.dispatchEvent(new CustomEvent("rowi:members-updated"));
      } else setMsg(j.error || t("affinity.error_plan", "Tu plan no permite recalcular afinidad."));
    } catch {
      setMsg(t("affinity.error_generic", "Error al recalcular afinidad."));
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  const EmotionThermometer = ({ heat, band }: { heat: number; band: string }) => {
    const color =
      band === "hot"
        ? "#22c55e"
        : band === "warm"
        ? "#f59e0b"
        : band === "cold"
        ? "#60a5fa"
        : "#9ca3af";
    const emoji =
      band === "hot" ? "🔥" : band === "warm" ? "🌤️" : band === "cold" ? "❄️" : "🫧";
    return (
      <div className="flex flex-col items-center justify-center mt-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="text-xl font-semibold" style={{ color }}>
            {heat ?? 0}%
          </span>
        </div>
        <div className="h-3 w-48 rounded-full bg-gray-200 dark:bg-zinc-800 mt-1 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-700"
            style={{
              width: `${heat ?? 0}%`,
              background: `linear-gradient(90deg, ${color}, #d797cf)`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="rowi-card p-6 space-y-6 shadow-md border border-rowi-card-border rounded-2xl bg-white/90 dark:bg-zinc-900/90">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold rowi-gradient-text">
          {t("affinity.title", "Comunidad Rowi")}
        </h2>
        <button
          className="rowi-btn text-sm"
          style={{ background: "#7c3aed", color: "#fff" }}
          onClick={recalcAffinity}
          disabled={loading}
        >
          🔄 {loading ? t("affinity.processing", "Procesando…") : t("affinity.recalc", "Recalcular Afinidad")}
        </button>
      </div>

      {/* 📊 Resumen de uso IA */}
      <UsageSummary t={t} />

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <span className="text-3xl font-bold text-rowi-gradient">{total}</span>
          <div className="text-xs">{t("affinity.members", "Miembros")}</div>
        </div>
        <div>
          <span className="text-3xl font-bold text-rowi-gradient">{withSEI}</span>
          <div className="text-xs">{t("affinity.with_sei", "Con perfil SEI")}</div>
        </div>
        <div>
          {summary?.global ? (
            <EmotionThermometer heat={Math.round(summary.global.heat)} band={summary.global.band} />
          ) : (
            <span className="text-3xl">—</span>
          )}
          <div className="text-xs">{t("affinity.global_avg", "Afinidad Promedio Global")}</div>
        </div>
      </div>

      {summary?.byGroup?.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {summary.byGroup.map((g: any) => (
            <BarStat key={g.name} label={g.name} value={g.heat ?? 0} />
          ))}
        </div>
      )}

      {summary?.byContext?.length > 0 &&
        Math.round(summary.byContext[0].heat) !== Math.round(summary.global.heat) && (
          <div className="grid md:grid-cols-2 gap-4">
            {summary.byContext.map((c: any) => (
              <BarStatTrend key={c.context} context={{ key: c.context, avg: c.heat ?? 0 }} t={t} />
            ))}
          </div>
        )}

      {interpretation && (
        <div className="rounded-xl border border-border/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-4 text-sm italic text-foreground/80 shadow-inner">
          💬 {interpretation}
        </div>
      )}
      {msg && <div className="text-xs text-center mt-2 text-gray-500">{msg}</div>}
    </div>
  );
}