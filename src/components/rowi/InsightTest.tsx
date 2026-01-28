"use client";

import * as React from "react";

type InsightType = "coach" | "affinity" | "community" | "eq-dashboard";

export default function InsightTest() {
  const [type, setType] = React.useState<InsightType>("coach");

  // Campos básicos
  const [locale, setLocale] = React.useState("es");

  // Coach
  const [mood, setMood] = React.useState("estresado");
  const [context, setContext] = React.useState("antes de reunión");
  const [minutes, setMinutes] = React.useState(4);

  // Affinity
  const [a, setA] = React.useState("Edu");
  const [b, setB] = React.useState("Viviana");

  // Community
  const [topic, setTopic] = React.useState("Colaboración");
  const [communityPrompt, setCommunityPrompt] = React.useState(
    "Ideas para un reto semanal de empatía"
  );

  // EQ Dashboard (puedes ajustar a tus datos reales)
  const [who, setWho] = React.useState("Edu");
  const [focus, setFocus] = React.useState("EMP,RP,ACT");

  const [out, setOut] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string>("");

  function buildPayload() {
    switch (type) {
      case "coach":
        return { locale, mood, context, minutes };
      case "affinity":
        return { locale, a, b };
      case "community":
        return { locale, topic, prompt: communityPrompt };
      case "eq-dashboard":
        return { locale, who, focus: focus.split(",").map((s) => s.trim()) };
      default:
        return { locale };
    }
  }

  async function run() {
    setErr("");
    setOut("");
    setLoading(true);
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload: buildPayload() }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(
          data?.details || data?.error || `HTTP ${res.status}`
        );
      }
      // Mostramos el texto si viene, o todo el JSON por si quieres inspeccionar
      setOut(data.text ?? JSON.stringify(data, null, 2));
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold">Rowi — Insight Tester</h2>

      {/* Selector de tipo */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="opacity-80">Tipo</span>
          <select
            className="rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
            value={type}
            onChange={(e) => setType(e.target.value as InsightType)}
          >
            <option value="coach">coach</option>
            <option value="affinity">affinity</option>
            <option value="community">community</option>
            <option value="eq-dashboard">eq-dashboard</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="opacity-80">Locale</span>
          <input
            className="w-24 rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          />
        </label>
      </div>

      {/* Campos por tipo */}
      {type === "coach" && (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm opacity-80">Mood</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <div className="text-sm opacity-80">Contexto</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm opacity-80">Minutos</div>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value || "1", 10))}
            />
          </label>
        </div>
      )}

      {type === "affinity" && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm opacity-80">Persona A</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm opacity-80">Persona B</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={b}
              onChange={(e) => setB(e.target.value)}
            />
          </label>
        </div>
      )}

      {type === "community" && (
        <div className="grid gap-3">
          <label className="space-y-1">
            <div className="text-sm opacity-80">Tema</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm opacity-80">Prompt</div>
            <textarea
              rows={3}
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={communityPrompt}
              onChange={(e) => setCommunityPrompt(e.target.value)}
            />
          </label>
        </div>
      )}

      {type === "eq-dashboard" && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm opacity-80">Persona</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={who}
              onChange={(e) => setWho(e.target.value)}
            />
          </label>
          <label className="space-y-1 md:col-span-1">
            <div className="text-sm opacity-80">Focus (coma: EMP,RP,ACT)</div>
            <input
              className="w-full rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={run}
          disabled={loading}
          className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-50"
        >
          {loading ? "Consultando..." : "Enviar a /api/insight"}
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          <strong>Error: </strong>
          {err}
        </div>
      )}

      {out && (
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
          {out}
        </pre>
      )}
    </div>
  );
}