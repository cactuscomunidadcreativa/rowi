"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Loader2, Brain, Flame, Activity, TrendingUp, Filter, Database,
  BarChart2, Radar, Users2, Sparkles, Globe2, Building2, Puzzle
} from "lucide-react";
import { toast } from "sonner";
import EQRadar from "@/components/charts/EQRadar";
import EQBar from "@/components/charts/EQBar";
import HistoryLine from "@/components/charts/HistoryLine";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   🎛 EMOTIONS HUB DASHBOARD — ROWI MASTER EDITION
   ========================================================= */
export default function EmotionsDashboardPage() {
  const { t } = useI18n();
  const [superHubs, setSuperHubs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);

  const [selectedSuperHub, setSelectedSuperHub] = useState<string>("");
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedHub, setSelectedHub] = useState<string>("");

  const [summary, setSummary] = useState<any>(null);
  const [loading, startTransition] = useTransition();

  // =============================================
  // 🔹 Cargar jerarquía
  // =============================================
  useEffect(() => {
    async function loadHierarchy() {
      try {
        const [sh, t, h] = await Promise.all([
          fetch("/api/hub/superhubs").then(r => r.json()).catch(() => []),
          fetch("/api/hub/tenants").then(r => r.json()).catch(() => []),
          fetch("/api/admin/hubs").then(r => r.json()).catch(() => []),
        ]);
        setSuperHubs(Array.isArray(sh) ? sh : []);
        setTenants(Array.isArray(t) ? t : []);
        setHubs(Array.isArray(h) ? h : []);
      } catch {
        toast.error(t("admin.emotions.errorLoadingHierarchy"));
      }
    }
    loadHierarchy();
  }, []);

  // =============================================
  // 🔹 Query dinámica
  // =============================================
  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (selectedSuperHub) q.set("superHubId", selectedSuperHub);
    if (selectedTenant) q.set("tenantId", selectedTenant);
    if (selectedHub) q.set("hubId", selectedHub);
    return q.toString();
  }, [selectedSuperHub, selectedTenant, selectedHub]);

  // =============================================
  // 🔹 Cargar datos
  // =============================================
  const loadData = () =>
    startTransition(async () => {
      try {
        const res = await fetch(`/api/hub/emotions/eq?${query}`, { cache: "no-store" });
        const json = await res.json();
        setSummary(json);
      } catch (e) {
        toast.error(t("admin.emotions.errorLoadingEmotional"));
      }
    });

  useEffect(() => {
    loadData();
  }, [query]);

  const kpi = summary?.kpi;
  const dist = summary?.distributions;
  const series = summary?.series;

  return (
    <main className="p-8 space-y-12 overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-rowi-blueDay/40 scrollbar-track-transparent">
      {/* 🌅 HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rowi-blueDay via-rowi-purpleDay to-rowi-pinkDay bg-clip-text text-transparent">
            Emotions Hub
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            Inteligencia Emocional, Afinidad y Motores Activos en una sola vista.
          </p>
        </div>

        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <Sparkles className="text-rowi-pinkDay w-6 h-6" />
        </motion.div>
      </motion.header>

      {/* 🎚️ FILTROS */}
      <section className="p-5 border rounded-2xl bg-white/80 dark:bg-gray-900/40 shadow backdrop-blur-md flex flex-wrap gap-4 items-center sticky top-0 z-10">
        <Filter className="w-4 h-4 text-gray-600" />

        <Select
          label="SuperHub"
          icon={<Globe2 />}
          value={selectedSuperHub}
          onChange={setSelectedSuperHub}
          options={superHubs}
          reset={() => {
            setSelectedSuperHub("");
            setSelectedTenant("");
            setSelectedHub("");
          }}
        />

        <Select
          label="Tenant"
          icon={<Building2 />}
          value={selectedTenant}
          onChange={setSelectedTenant}
          options={tenants.filter((t) => !selectedSuperHub || t.superHubId === selectedSuperHub)}
          reset={() => {
            setSelectedTenant("");
            setSelectedHub("");
          }}
        />

        <Select
          label="Hub"
          icon={<Puzzle />}
          value={selectedHub}
          onChange={setSelectedHub}
          options={hubs.filter((h) => !selectedTenant || h.tenantId === selectedTenant)}
        />

        <button
          onClick={loadData}
          className="ml-auto px-5 py-2 bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar"}
        </button>
      </section>

      {/* 🔢 KPIs */}
      <motion.section layout className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <Kpi icon={<Activity />} label="Snapshots EQ" value={kpi?.totalSnapshots ?? 0} />
        <Kpi
          icon={<Brain />}
          label="Promedio K/C/G"
          value={`${num(kpi?.avgK)}/${num(kpi?.avgC)}/${num(kpi?.avgG)}`}
        />
        <Kpi icon={<Flame />} label="Affinity Heat" value={num(kpi?.avgAffinityHeat)} />
        <Kpi icon={<Users2 />} label="Eventos Emocionales" value={kpi?.totalEvents ?? 0} />
      </motion.section>

      {/* 📊 EQ Promedio */}
      <section>
        <ChartCard title={t("admin.emotions.eqAvgCompetencies")} icon={<Radar />}>
          <EQRadar
            // @ts-ignore
            data={(dist?.competencies ?? []).map((c) => ({
              key: c.key,
              score: Math.round(c._avg.score ?? 0),
            }))}
          />
        </ChartCard>
      </section>

      {/* 📊 K / C / G Promedio */}
      <section>
        <ChartCard title={t("admin.emotions.kcgAvg")} icon={<BarChart2 />}>
          {/* EQBar expects { key, score } not { label, value } */}
          <EQBar
            data={[
              { key: "K", score: Math.round(kpi?.avgK ?? 0) },
              { key: "C", score: Math.round(kpi?.avgC ?? 0) },
              { key: "G", score: Math.round(kpi?.avgG ?? 0) },
            ]}
          />
        </ChartCard>
      </section>

      {/* 📈 EQ Histórico */}
      <section>
        <ChartCard title={t("admin.emotions.eqHistorical")} icon={<TrendingUp />}>
          {/* HistoryLine expects { date, avg } — map overall4 → avg.
              HistoryLine has no `label` prop; title goes on ChartCard above. */}
          <HistoryLine
            data={(series?.eq ?? []).map((s: { date: string; overall4: number }) => ({ date: s.date, avg: s.overall4 }))}
          />
        </ChartCard>
      </section>

      {/* 💡 Subfactores */}
      <section>
        <StatList title={t("admin.emotions.subfactors")} items={dist?.subfactors || []} />
      </section>

      {/* 💡 Valores */}
      <section>
        <StatList title={t("admin.emotions.values")} items={dist?.values || []} />
      </section>

      {/* 💡 Talentos */}
      <section>
        <StatList title={t("admin.emotions.talents")} items={dist?.talents || []} />
      </section>

      {/* 🔥 Afinidad Promedio */}
      <section>
        <ChartCard title={t("admin.emotions.affinityAvg")} icon={<Flame />}>
          <HistoryLine
            data={(series?.affinity ?? []).map((s: { date: string; heat: number }) => ({ date: s.date, avg: s.heat }))}
          />
        </ChartCard>
      </section>

      {/* 🎭 Moods más frecuentes */}
      <section>
        <ChartCard title={t("admin.emotions.frequentMoods")} icon={<Database />}>
          <ul className="text-sm space-y-1 overflow-y-auto max-h-[260px] scrollbar-thin scrollbar-thumb-rowi-blueDay/30">
            {(dist?.moods ?? [])
              .sort((a: any, b: any) => b._count - a._count)
              .slice(0, 12)
              .map((m: any) => (
                <li key={m.mood} className="flex justify-between border-b border-gray-200/10 pb-1">
                  <span className="text-gray-800 dark:text-gray-300">{m.mood}</span>
                  <span className="text-gray-500">{m._count}</span>
                </li>
              ))}
          </ul>
        </ChartCard>
      </section>
    </main>
  );
} // 👈 ESTA ERA LA LLAVE QUE FALTABA
/* =========================================================
   🧩 COMPONENTES AUXILIARES
   ========================================================= */
function Select({ label, icon, value, onChange, options, reset }: any) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <select
        className="border rounded-md px-2 py-1 bg-white/80 dark:bg-gray-800/60 focus:ring-1 focus:ring-rowi-blueDay"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{label} (Todos)</option>
        {options.map((o: any) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {value && (
        <button onClick={reset} className="text-xs text-gray-400 hover:text-rowi-blueDay">
          ×
        </button>
      )}
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card className="p-3 flex flex-col gap-1 border-rowi-blueDay/20 shadow-sm hover:shadow-md transition">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
          {icon} {label}
        </div>
        <div className="text-2xl font-bold text-rowi-blueNight dark:text-rowi-blueDay">
          {value}
        </div>
      </Card>
    </motion.div>
  );
}

function ChartCard({ title, icon, children }: any) {
  return (
    <Card className="p-5 border-rowi-blueDay/10 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md shadow-md hover:shadow-lg transition-all rounded-2xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
        {icon} {title}
      </h3>
      {children}
    </Card>
  );
}

function StatList({ title, items }: { title: string; items: any[] }) {
  const sorted = [...items].sort((a, b) => (b._avg.score ?? 0) - (a._avg.score ?? 0)).slice(0, 10);
  return (
    <Card className="p-5 bg-white/80 dark:bg-gray-900/50 shadow hover:shadow-lg transition rounded-2xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-200">
        <Brain className="w-4 h-4 text-rowi-blueDay" /> {title}
      </h3>
      <ul className="space-y-1 text-sm overflow-y-auto max-h-[240px] scrollbar-thin scrollbar-thumb-rowi-blueDay/30">
        {sorted.map((i) => (
          <li key={i.key} className="flex justify-between border-b border-gray-200/10 pb-1">
            <span className="truncate">{i.key}</span>
            <span className="text-gray-500">{Math.round(i._avg.score ?? 0)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function num(n?: number) {
  return typeof n === "number" && !isNaN(n) ? n.toFixed(1) : "—";
}