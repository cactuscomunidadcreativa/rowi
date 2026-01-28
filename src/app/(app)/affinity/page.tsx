"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import AffinityMonitor from "@/components/affinity/AffinityMonitor";

type Member = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  brainStyle?: string;
  group?: string;
  closeness?: "Cercano" | "Neutral" | "Lejano" | string;
};

type AffPiece = {
  heat135?: number;
  heat?: number; // por compatibilidad con respuestas antiguas
  heat100?: number;
  affinityLevel?: string;
  interpretation?: string;
  fade?: boolean;
  parts?: { growth?: number; collaboration?: number; understanding?: number };
};

export default function AffinityPage() {
  const { t, locale } = useI18n();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [affByMember, setAffByMember] = useState<Record<string, AffPiece>>({});
  const [loadingByMember, setLoadingByMember] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState<"relationship" | "equipo" | "trabajo" | "liderazgo">("relationship");
  const [q, setQ] = useState("");

  // IA solo cuando el usuario interviene (chat) o cálculo manual
  const [chat, setChat] = useState<{ role: "assistant" | "user"; content: string }[]>([
    {
      role: "assistant",
      content: t("affinity.rowi_welcome", "👋 Hola, soy Rowi. ¿Con quién te gustaría conectar mejor hoy?"),
    },
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [rowiTyping, setRowiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helpers
  const PROJECT_MAP: Record<string, "relationship" | "execution" | "leadership" | "decision" | "conversation"> = {
    relationship: "relationship",
    relaciones: "relationship",
    equipo: "leadership",
    liderazgo: "leadership",
    trabajo: "execution",
    execution: "execution",
  };
  const normalizedProject = PROJECT_MAP[project] ?? "execution";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* =========================================================
     📦 Cargar miembros
  ========================================================= */
  async function loadMembers() {
    try {
      const r = await fetch("/api/community/members", { cache: "no-store" });
      const j = await r.json();
      setMembers(Array.isArray(j?.members) ? j.members : []);
    } catch (err) {
      console.error("Error cargando miembros:", err);
      setMembers([]);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [locale]);

  /* =========================================================
     ⚖️ Nivel textual por heat135
  ========================================================= */
  function levelFromHeat135(h: number) {
    if (h >= 118) return "Experto";
    if (h >= 108) return "Diestro";
    if (h >= 92) return "Funcional";
    if (h >= 82) return "Emergente";
    return "Desafío";
  }

  /* =========================================================
     🚀 Calcular afinidad de toda la comunidad (lotes + cache)
  ========================================================= */
  async function loadAffinityAll(force = false) {
    if (!members.length) return;

    // Cache por contexto durante 24h
    const cacheKey = `affinity-cache-${normalizedProject}`;
    const last = Number(localStorage.getItem(cacheKey) || 0);
    const expired = Date.now() - last > 24 * 60 * 60 * 1000;

    if (!force && !expired && Object.keys(affByMember).length) {
      // Ya tenemos datos en memoria y cache vigente -> no recalc
      return;
    }

    const batchSize = 10;
    const nextAff: Record<string, AffPiece> = {};
    for (let i = 0; i < (members?.length || 0); i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (member) => {
          try {
            const r = await fetch(`/api/affinity?project=${normalizedProject}&memberId=${member.id}`, {
              cache: "no-store",
            });
            const j = await r.json();
            const aff = j?.items?.[0] ?? null;
            if (!aff) return;
            const heat135 = aff?.heat135 ?? aff?.heat ?? 0;
            const heat100 = Math.round((heat135 / 135) * 100);
            nextAff[member.id] = {
              ...aff,
              heat135,
              heat100,
              affinityLevel: levelFromHeat135(heat135),
            };
          } catch (e) {
            console.warn("Error batch recalc:", member.name, e);
          }
        })
      );
      // Pausa para no saturar CPU/API
      await new Promise((res) => setTimeout(res, 350));
    }
    setAffByMember(nextAff);
    localStorage.setItem(cacheKey, String(Date.now()));
  }

  // Cambiar de contexto -> intentar usar cache / recalc lazy
  useEffect(() => {
    if (members.length > 0) {
      loadAffinityAll(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedProject, members.length]);

  /* =========================================================
     💎 Calcular afinidad individual + Interpretación IA
     (solo a demanda del usuario)
  ========================================================= */
  async function loadAffinityFor(member: Member) {
    if (!member?.id) return;
    try {
      setLoadingByMember((s) => ({ ...s, [member.id]: true }));

      const r = await fetch(`/api/affinity?project=${normalizedProject}&memberId=${member.id}`, {
        cache: "no-store",
      });
      const j = await r.json();
      const aff = j?.items?.[0] ?? null;
      if (!aff) return;

      const heat135 = aff?.heat135 ?? aff?.heat ?? 0;
      const heat100 = Math.round((heat135 / 135) * 100);

      // Afinidad base
      setAffByMember((s) => ({
        ...s,
        [member.id]: {
          ...aff,
          heat135,
          heat100,
          affinityLevel: levelFromHeat135(heat135),
          fade: true,
        },
      }));

      // IA solo al pedir interpretación explícita (evento significativo del usuario)
      try {
        const interp = await fetch("/api/affinity/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: "Tú",
            memberName: member.name,
            project: normalizedProject,
            affinity: heat100,
            parts: aff?.parts || { growth: 0, collaboration: 0, understanding: 0 },
            locale,
          }),
        });
        const ji = await interp.json();
        if (ji?.ok && ji.text) {
          setAffByMember((s) => ({
            ...s,
            [member.id]: { ...s[member.id], interpretation: ji.text, fade: true },
          }));
        }
      } catch (e) {
        console.warn("Interpretación IA no disponible:", e);
      }
    } catch (err) {
      console.warn("Error afinidad:", err);
    } finally {
      setLoadingByMember((s) => ({ ...s, [member.id]: false }));
    }
  }

  /* =========================================================
     💬 Chat con Rowi (IA solo al interactuar)
  ========================================================= */
  async function askRowiAffinity() {
    const seed = coachInput.trim();
    if (!seed) return;
    setChat((c) => [...c, { role: "user", content: seed }]);
    setCoachInput("");
    setRowiTyping(true);

    try {
      const res = await fetch("/api/rowi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "affinity",
          locale,
          payload: {
            ask: selectedMembers.length
              ? `Analiza mi afinidad con ${selectedMembers.map((m) => m.name).join(", ")} en ${normalizedProject}. ${seed}`
              : seed,
          },
        }),
      });
      const j = await res.json();
      setChat((c) => [...c, { role: "assistant", content: j?.text || "⚙️ No pude generar respuesta ahora." }]);
    } catch {
      setChat((c) => [...c, { role: "assistant", content: "⚠️ Hubo un error de conexión con Rowi." }]);
    } finally {
      setRowiTyping(false);
    }
  }

  /* =========================================================
     🔍 Filtro simple (solo texto)
  ========================================================= */
  const filteredMembers = useMemo(() => {
    const term = q.toLowerCase().trim();
    const seen = new Set<string>();
    return members.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      const match = !term
        ? true
        : [m.name, m.email, m.group, m.country, m.brainStyle]
            .filter(Boolean)
            .some((v) => (v || "").toLowerCase().includes(term));
      return match;
    });
  }, [q, members]);

  /* =========================================================
     🧮 Promedio general (+ nivel textual)
  ========================================================= */
  const overallAffinity = useMemo(() => {
    const vals = Object.values(affByMember).map((v) => v.heat100 ?? 0);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [affByMember]);

  const overallLevel = useMemo(() => {
    // Estimamos el nivel según el promedio en 135
    const h135 = Math.round((overallAffinity * 135) / 100);
    return levelFromHeat135(h135);
  }, [overallAffinity]);

  /* =========================================================
     UI General
  ========================================================= */
  return (
    <main className="p-6 space-y-6 min-h-[calc(100vh-120px)]">
      {/* ==================== FILA 1 ==================== */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* COLUMNA IZQUIERDA */}
        <div className="rounded-2xl bg-surface border border-border/20 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-primary">{t("affinity.community", "Mi comunidad")}</h2>
              {/* Recalcular todo manual */}
              <button
                onClick={() => {
                  localStorage.removeItem(`affinity-cache-${normalizedProject}`);
                  loadAffinityAll(true);
                }}
                className="text-xs text-muted-foreground hover:text-primary transition"
                title="Forzar recálculo de toda la comunidad"
              >
                🔁 Recalcular todo
              </button>
            </div>

            <select
              value={project}
              onChange={(e) => setProject(e.target.value as any)}
              className="rounded-md bg-background border border-border/30 px-2 py-1 text-sm text-foreground"
              title="Selecciona el contexto de afinidad"
            >
              <option value="relationship">Relaciones</option>
              <option value="equipo">Equipo</option>
              <option value="trabajo">Trabajo</option>
              <option value="liderazgo">Liderazgo</option>
            </select>
          </div>

          {/* 🔹 Overall promedio + nivel */}
          {Object.keys(affByMember).length > 0 && (
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Promedio general:{" "}
                <span className="font-semibold text-primary">{overallAffinity}%</span>{" "}
                <span className="text-xs text-muted-foreground">({overallLevel})</span>
              </div>
              <input
                className="w-60 rounded-lg border border-border/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder={t("search.placeholder", "Buscar por nombre, grupo o país")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}

          {/* 🧩 Miembros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl/grid-cols-3 xl:grid-cols-3 gap-3">
            {filteredMembers.map((m) => {
              const selected = selectedMembers.some((x) => x.id === m.id);
              const aff = affByMember[m.id];
              const affinityPct = aff?.heat100 ?? null;
              const interp = aff?.interpretation;
              return (
                <div
                  key={m.id}
                  onClick={() =>
                    setSelectedMembers((prev) =>
                      selected ? prev.filter((x) => x.id !== m.id) : [...prev, m]
                    )
                  }
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    selected
                      ? "border-primary/60 bg-primary/5 scale-[1.02]"
                      : "border-border/30 hover:border-primary/40 bg-background"
                  }`}
                >
                  <div className="font-semibold text-sm text-primary truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.group || "—"}</div>
                  <div className="text-xs mt-1">
                    Afinidad:{" "}
                    <span className="font-semibold text-secondary">
                      {typeof affinityPct === "number"
                        ? `${affinityPct}% (${aff?.affinityLevel})`
                        : "—"}
                    </span>
                  </div>

                  {/* 💬 Interpretación IA (fade-in + pulse) */}
                  {interp && (
                    <div
                      className={`mt-1 text-[11px] italic text-foreground/80 transition-all duration-700 ease-in-out ${
                        aff?.fade ? "opacity-100 animate-[pulse_1.5s_ease-in-out_1]" : "opacity-0"
                      }`}
                    >
                      💬 {interp}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 🎛️ Acciones */}
          {selectedMembers.length > 0 && (
            <div className="mt-4 text-right">
              <button
                onClick={() => selectedMembers.forEach((m) => loadAffinityFor(m))}
                disabled={Object.values(loadingByMember).some(Boolean)}
                className={`rounded-full px-5 py-2 text-sm font-semibold ${
                  Object.values(loadingByMember).some(Boolean)
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                }`}
              >
                {Object.values(loadingByMember).some(Boolean)
                  ? "⚙️ Calculando..."
                  : "🔄 Calcular afinidad seleccionados"}
              </button>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA — Chat Rowi */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-surface border border-border/20 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border/10 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                🤖
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary">Rowi Affinity</h2>
                <p className="text-xs text-muted-foreground">Tu coach emocional cognitivo</p>
              </div>
            </div>

            <div className="flex-1 min-h-[260px] max-h-[400px] overflow-y-auto px-4 py-3 space-y-3 bg-background/80 dark:bg-background/40">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 text-sm rounded-2xl ${
                      m.role === "assistant"
                        ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground border border-border/20"
                        : "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {rowiTyping && (
                <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 text-muted-foreground animate-pulse">
                  Rowi escribiendo...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-border/10 bg-background/60 px-4 py-3 flex items-end gap-2 rounded-b-2xl">
              <textarea
                rows={2}
                className="flex-1 resize-none rounded-xl border border-border/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Escribe aquí para consultar a Rowi..."
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askRowiAffinity();
                  }
                }}
              />
              <button
                onClick={askRowiAffinity}
                disabled={!coachInput.trim()}
                className={`rounded-full px-5 py-2 text-sm font-medium text-white transition-transform shadow-md ${
                  coachInput.trim()
                    ? "bg-gradient-to-r from-primary to-secondary hover:scale-[1.05]"
                    : "opacity-50 cursor-not-allowed bg-muted"
                }`}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FILA 2 ==================== */}
      <section>
        <div className="rounded-2xl bg-surface border border-border/20 p-4">
          <AffinityMonitor />
        </div>
      </section>
    </main>
  );
}