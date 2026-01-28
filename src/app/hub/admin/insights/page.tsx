"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Brain, LineChart, BarChart2, Sparkles, Loader2, ShieldCheck, Filter
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   🧠 INSIGHTS HUB — IA Cognitiva Manual
   ========================================================= */
export default function InsightsPage() {
  const [insightType, setInsightType] = useState<string | null>(null);
  const [authKey, setAuthKey] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  // =====================================================
  // 🔹 Generar insight (manual con clave)
  // =====================================================
  async function runInsight(type: string) {
    if (!authKey) {
      toast.warning("Ingresa tu clave antes de ejecutar un insight.");
      return;
    }

    setInsightType(type);
    startTransition(async () => {
      try {
        const res = await fetch("/api/hub/insights/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, authKey }),
        });

        if (!res.ok) throw new Error("Error generando insight.");
        const data = await res.json();
        setResult(data.result || "Sin resultados por ahora.");
        toast.success("Insight generado con éxito.");
      } catch (e: any) {
        toast.error(e.message || "Error generando insight cognitivo.");
      }
    });
  }

  return (
    <main className="p-8 space-y-10 overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-rowi-blueDay/40">
      {/* 🌅 HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rowi-blueDay via-rowi-purpleDay to-rowi-pinkDay bg-clip-text text-transparent">
            Insights Hub
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Procesamiento cognitivo manual — genera correlaciones e interpretaciones con IA segura.
          </p>
        </div>
        <Sparkles className="w-6 h-6 text-rowi-pinkDay animate-pulse" />
      </motion.header>

      {/* 🔐 CLAVE DE AUTORIZACIÓN */}
      <section className="p-5 border rounded-2xl bg-white/80 dark:bg-gray-900/50 shadow backdrop-blur-md space-y-2">
        <label className="text-sm text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rowi-blueDay" />
          Clave de autorización para IA Cognitiva
        </label>
        <input
          type="password"
          placeholder="••••••••"
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full bg-white/70 dark:bg-gray-800/60 focus:ring-2 focus:ring-rowi-blueDay outline-none"
        />
        <p className="text-xs text-gray-500">
          La IA solo se ejecutará de forma manual, bajo tu autorización.
        </p>
      </section>

      {/* 🎛️ CARDS DE INSIGHTS DISPONIBLES */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InsightCard
          icon={<Brain className="w-5 h-5 text-rowi-blueDay" />}
          title="EQ ↔ Afinidad"
          description="Explora cómo la inteligencia emocional impacta en la afinidad grupal y conexión interpersonal."
          onClick={() => runInsight("eq-affinity")}
          loading={loading && insightType === "eq-affinity"}
        />
        <InsightCard
          icon={<LineChart className="w-5 h-5 text-rowi-purpleDay" />}
          title="EQ ↔ Desempeño"
          description="Descubre la relación entre las competencias emocionales y el rendimiento organizacional."
          onClick={() => runInsight("eq-performance")}
          loading={loading && insightType === "eq-performance"}
        />
        <InsightCard
          icon={<BarChart2 className="w-5 h-5 text-rowi-pinkDay" />}
          title="Afinidad ↔ Clima"
          description="Analiza cómo los niveles de afinidad afectan la percepción del clima organizacional."
          onClick={() => runInsight("affinity-climate")}
          loading={loading && insightType === "affinity-climate"}
        />
      </section>

      {/* 🧾 RESULTADOS DE LA IA */}
      {result && (
        <Card className="p-6 border border-rowi-blueDay/20 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md">
          <h3 className="font-semibold mb-2 text-lg text-rowi-blueDay flex items-center gap-2">
            <Filter className="w-4 h-4" /> Insight Generado
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {result}
          </p>
        </Card>
      )}
    </main>
  );
}

/* =========================================================
   🎨 COMPONENTE AUXILIAR DE TARJETA
   ========================================================= */
function InsightCard({ icon, title, description, onClick, loading }: any) {
  return (
    <Card className="p-5 bg-white/80 dark:bg-gray-900/50 border border-rowi-blueDay/10 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2 text-gray-800 dark:text-gray-100">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full mt-auto bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white text-sm font-medium rounded-lg py-2 flex items-center justify-center gap-2 hover:opacity-90 transition"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        {loading ? "Procesando..." : "Generar Insight"}
      </button>
    </Card>
  );
}