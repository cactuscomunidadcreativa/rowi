"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import RowiCommunitySummary from "@/components/affinity/RowiCommunitySummary";

/* =========================================================
   🎨 [1] CONFIGURACIÓN BASE ROWI
========================================================= */
const R = {
  purple: "#7a59c9",
  blue: "#31a2e3",
  pink: "#d797cf",
};

const GROUP_KEYS = ["Trabajo", "Familia", "Amigos", "Por conocer"];

const DEFAULT_CONN: Record<string, string[]> = {
  Trabajo: ["Jefe", "Par/Colega", "Subordinado", "Cliente", "Proveedor", "Socio"],
  Familia: ["Padre", "Madre", "Hijo/a", "Hermano/a", "Abuelo/a", "Pareja", "Comparten hijos"],
  Amigos: ["Colegio", "Universidad", "Trabajo", "Comunidad/Club", "Online"],
  "Por conocer": ["Networking", "Futuro cliente", "Interés amoroso", "Referencia"],
};

/* =========================================================
   🧠 [2] TIPOS DE DATOS
========================================================= */
type Member = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  brainStyle?: string;
  group: string;
  connectionType?: string;
  closeness: "Cercano" | "Neutral" | "Lejano";
  affinity?: number | null;
};

/* =========================================================
   📄 [3] COMPONENTE PRINCIPAL — COMMUNITY PAGE
========================================================= */
export default function CommunityPage() {
  const { t } = useI18n();

  /* --------------------------------------------
     🧩 ESTADOS GLOBALES
     --------------------------------------------
     - members: lista completa de miembros
     - loading: control de carga
     - msg: mensajes del sistema
     - editing: miembro en edición
     - affinitySummary: texto IA global
     - filtros: búsqueda, grupo, vínculo, país, cercanía, afinidad
  -------------------------------------------- */
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [affinitySummary, setAffinitySummary] = useState<string | null>(null);

  // 🔍 Filtros principales
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("Todos");
  const [subtype, setSubtype] = useState("Todos");
  const [country, setCountry] = useState("Todos");
  const [closeness, setCloseness] = useState("Todos");
  const [onlyAffinity, setOnlyAffinity] = useState(false);

  // 📦 Subtipos por grupo
  const subgroupOptions = useMemo(
    () => (group !== "Todos" ? DEFAULT_CONN[group] || [] : []),
    [group]
  );

  // 🌎 Lista dinámica de países detectados
  const countries = useMemo(() => {
    const s = new Set<string>();
    members.forEach((m) => m.country && s.add(m.country));
    return ["Todos", ...Array.from(s).sort()];
  }, [members]);

  /* --------------------------------------------
     🚀 CARGA DE MIEMBROS DESDE API (con afinidad)
     ------------------------------------------------
     - Trae los miembros de la comunidad
     - Consulta snapshots para convertir Heat135 → %
     - Actualiza afinidad sin recalcular IA
  -------------------------------------------- */
  async function fetchMembers() {
    setLoading(true);
    try {
      // 🔹 1. Obtener lista base de miembros
      const r = await fetch("/api/community/members", { cache: "no-store" });
      const j = await r.json();
      let list: Member[] = Array.isArray(j?.members) ? j.members : [];

      // 🔹 2. Enriquecer cada miembro con su snapshot de afinidad
      if (list.length > 0) {
        const enriched = await Promise.all(
          list.map(async (m) => {
            try {
              const res = await fetch(`/api/affinity/snapshots?memberId=${m.id}`, {
                cache: "no-store",
              });
              const snap = await res.json();
              const heat135 = snap?.snapshot?.lastHeat135 ?? null;
              return {
                ...m,
                affinity: heat135 ? Math.min(100, Math.round((heat135 / 135) * 100)) : null,
              };
            } catch {
              return { ...m, affinity: null };
            }
          })
        );
        list = enriched;
      }

      setMembers(list);
    } catch (err) {
      console.warn("❌ Error cargando miembros:", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  // 🔁 Efecto inicial y refresco automático al evento global
  useEffect(() => {
    fetchMembers();
    const onUpdated = () => fetchMembers();
    window.addEventListener("rowi:members-updated", onUpdated);
    return () => window.removeEventListener("rowi:members-updated", onUpdated);
  }, []);

  /* --------------------------------------------
     🧠 INTERPRETACIÓN GLOBAL DE AFINIDAD (IA)
     ------------------------------------------------
     - Llama /api/affinity/summary para obtener métricas
     - Usa /api/affinity/interpret/global para generar texto IA
     - Muestra insight breve y empático en la parte superior
  -------------------------------------------- */
  useEffect(() => {
    async function fetchInterpretation() {
      try {
        const res = await fetch("/api/affinity/summary", { cache: "no-store" });
        const data = await res.json();
        if (data?.ok && !data?.empty) {
          const ai = await fetch("/api/affinity/interpret/global", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userName: "Comunidad Rowi",
              summary: data,
              locale: "es",
            }),
          });
          const j = await ai.json();
          if (j.ok) setAffinitySummary(j.text);
        } else {
          setAffinitySummary(null);
        }
      } catch (err) {
        console.warn("⚠️ No se pudo obtener interpretación IA:", err);
        setAffinitySummary(null);
      }
    }

    fetchInterpretation();
  }, []);
  /* --------------------------------------------
     📤 SUBIDA CSV GLOBAL
  -------------------------------------------- */
  async function onUploadCSV(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setMsg("📤 Subiendo CSV...");
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload-csv/community", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Upload failed");
      await fetchMembers();
      setMsg("✅ CSV importado correctamente");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setMsg("❌ Error al subir CSV");
    } finally {
      if (e?.target instanceof HTMLInputElement) e.target.value = "";
    }
  }

  /* --------------------------------------------
     🌬️ EFECTO DE “RESPIRACIÓN EMOCIONAL”
  -------------------------------------------- */
  useEffect(() => {
    if (document.getElementById("rowi-breathe-style")) return;
    const style = document.createElement("style");
    style.id = "rowi-breathe-style";
    style.innerHTML = `
      @keyframes rowi-breathe {
        0%,100% { box-shadow: 0 0 0 0 rgba(215,151,207,0.2); transform: scale(1); }
        50% { box-shadow: 0 0 25px 10px rgba(215,151,207,0.12); transform: scale(1.015); }
      }
      .rowi-breathe { animation: rowi-breathe 6s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }, []);

  /* --------------------------------------------
     SELECCIÓN MÚLTIPLE
  -------------------------------------------- */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function isSelected(id: string) {
    return selectedIds.includes(id);
  }

  /* --------------------------------------------
     🎯 FILTRADO LOCAL COMPLETO
     --------------------------------------------
     Incluye:
     - Búsqueda por nombre o email
     - Grupo y subtipo (tipo de vínculo)
     - País
     - Cercanía (Cercano / Neutral / Lejano)
     - Solo con afinidad (checkbox)
  -------------------------------------------- */
  const filtered = useMemo(() => {
    return members.filter((m) => {
      // 🔍 Coincidencia por texto libre (nombre o email)
      const matchQ =
        !q ||
        m.name?.toLowerCase().includes(q.toLowerCase()) ||
        m.email?.toLowerCase().includes(q.toLowerCase());

      // 🧩 Filtro por grupo (Trabajo, Familia, etc.)
      const matchG = group === "Todos" ? true : m.group === group;

      // 🔗 Filtro por subtipo / tipo de vínculo
      const matchS =
        group === "Todos"
          ? true
          : subtype === "Todos"
          ? true
          : (m.connectionType || "—") === subtype;

      // 🌎 Filtro por país
      const matchCountry = country === "Todos" ? true : (m.country || "—") === country;

      // 💞 Filtro por cercanía (emocional / funcional)
      const matchC = closeness === "Todos" ? true : m.closeness === closeness;

      // 💓 Filtro “solo con afinidad calculada”
      const matchAff = onlyAffinity ? typeof m.affinity === "number" : true;

      return matchQ && matchG && matchS && matchCountry && matchC && matchAff;
    });
  }, [members, q, group, subtype, country, closeness, onlyAffinity]);
  /* --------------------------------------------
     🎨 RENDER PRINCIPAL
  -------------------------------------------- */
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* 🧠 Resumen emocional global */}
      <RowiCommunitySummary t={t} members={members} />

      {/* 💬 Interpretación IA global */}
      {affinitySummary && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-primary/5 to-secondary/5 p-4 text-sm italic text-gray-700 dark:text-gray-300 shadow-inner">
          💬 {affinitySummary}
        </div>
      )}

      {/* 👥 Encabezado */}
      <div className="rowi-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mi Comunidad</h1>
          <p className="text-sm rowi-muted">Gestiona miembros, vínculos y afinidad</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rowi-btn"
            onClick={() =>
              setEditing({
                id: "new",
                name: "",
                email: "",
                group: "Trabajo",
                closeness: "Neutral",
              } as Member)
            }
          >
            ➕ Nuevo miembro
          </button>
          <label className="rowi-btn cursor-pointer">
            📤 Subir CSV
            <input type="file" accept=".csv" className="hidden" onChange={onUploadCSV} />
          </label>
        </div>
      </div>

      {/* 🔍 FILTROS AVANZADOS DE COMUNIDAD */}
      <div className="rowi-card grid gap-3 md:grid-cols-6 items-center">
        {/* 🔎 Buscar */}
        <input
          className="rounded-md border px-3 py-2 bg-transparent md:col-span-2"
          placeholder="Buscar por nombre o email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {/* 🧩 Grupo */}
        <select
          className="rounded-md border px-3 py-2 bg-transparent"
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setSubtype("Todos");
          }}
        >
          <option>Todos</option>
          {GROUP_KEYS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>

        {/* 🔗 Tipo de vínculo / Subgrupo */}
        <select
          className="rounded-md border px-3 py-2 bg-transparent"
          value={subtype}
          onChange={(e) => setSubtype(e.target.value)}
          disabled={group === "Todos"}
        >
          {group === "Todos" ? (
            <option>Tipo de vínculo</option>
          ) : (
            <>
              <option>Todos</option>
              {(DEFAULT_CONN[group] || []).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </>
          )}
        </select>

        {/* 🌎 País */}
        <select
          className="rounded-md border px-3 py-2 bg-transparent"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* 💞 Cercanía */}
        <select
          className="rounded-md border px-3 py-2 bg-transparent"
          value={closeness}
          onChange={(e) => setCloseness(e.target.value)}
        >
          <option>Todos</option>
          <option value="Cercano">Cercano</option>
          <option value="Neutral">Neutral</option>
          <option value="Lejano">Lejano</option>
        </select>

        {/* 💓 Solo con afinidad */}
        <label className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={onlyAffinity}
            onChange={(e) => setOnlyAffinity(e.target.checked)}
          />
          Solo con afinidad
        </label>
      </div>
      
      {/* 💠 GRID CON AFINIDAD, VÍNCULO Y EMOCIÓN */}
      {loading ? (
        <div className="rowi-card text-sm rowi-muted">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="rowi-card text-sm rowi-muted">Sin miembros encontrados</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((m) => {
            const cleanName = decodeURIComponent(escape(m.name || "Sin nombre"));
            const affinity = m.affinity ?? null;

            // 🎨 Interpretación emocional según afinidad
            let barColor = "bg-gray-300";
            let label = "Sin conexión";
            let mood = "—";

            if (affinity != null) {
              if (affinity >= 85) {
                barColor = "bg-green-400";
                label = "Confianza plena";
                mood = "Relación sólida y sin fricciones 🌿";
              } else if (affinity >= 70) {
                barColor = "bg-lime-400";
                label = "Buena conexión";
                mood = "Energía positiva y mutua ☀️";
              } else if (affinity >= 55) {
                barColor = "bg-yellow-400";
                label = "Potencial medio";
                mood = "En crecimiento, comunicación abierta ✨";
              } else if (affinity >= 35) {
                barColor = "bg-orange-400";
                label = "Baja conexión";
                mood = "Requiere empatía y escucha activa 🔄";
              } else {
                barColor = "bg-red-400";
                label = "Distante";
                mood = "Distancia emocional, oportunidad de reconectar 💭";
              }
            }

            return (
              <div
                key={m.id}
                onClick={() => toggleSelect(m.id)}
                className={`rounded-2xl border bg-white dark:bg-zinc-900 p-4 shadow-sm transition-all duration-500 cursor-pointer ${
                  isSelected(m.id)
                    ? "ring-2 ring-blue-400 scale-[1.03]"
                    : "rowi-breathe hover:shadow-lg"
                }`}
              >
                {/* 🧩 CABECERA — Nombre + Grupo + País */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-gray-800 dark:text-gray-100">
                      {cleanName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {m.group} · {m.country || "—"} · {m.closeness}
                    </p>

                    {/* 🔗 Tipo de vínculo (si existe) */}
                    {m.connectionType && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        {m.connectionType}
                      </p>
                    )}
                  </div>

                  {/* ✏️ BOTÓN EDITAR */}
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(m);
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>

                {/* 🧠 PERFIL Y AFINIDAD */}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>🧠 {m.brainStyle || "Sin estilo"}</span>
                  <span>💓 {affinity != null ? `${affinity}%` : "—"}</span>
                </div>

                {/* 🌈 BARRA DE COLOR EMOCIONAL */}
                <div className="mt-2 group relative">
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
                      style={{
                        width: `${Math.min(100, affinity || 0)}%`,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>

                  {/* 🩵 Etiqueta bajo la barra */}
                  <div className="text-[11px] mt-1 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {label}
                  </div>

                  {/* 💬 Tooltip IA-style */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 absolute -top-9 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[11px] text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    {mood}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✏️ DRAWER DE EDICIÓN / CREACIÓN */}
      {editing && (
        <EditDrawer
          member={editing}
          onClose={() => setEditing(null)}
          onSave={async (m) => {
            await fetch("/api/community/members", {
              method: m.id === "new" ? "POST" : "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(m),
            });
            setEditing(null);
            fetchMembers();
          }}
          onDelete={async (id) => {
            await fetch(`/api/community/members/${id}`, { method: "DELETE" });
            setEditing(null);
            fetchMembers();
          }}
        />
      )}

      {/* 🔔 MENSAJE GLOBAL */}
      {msg && <div className="text-center text-xs text-gray-500">{msg}</div>}
    </div>
  );
}

/* =========================================================
   🧾 [4] DRAWER DE EDICIÓN / CREACIÓN
========================================================= */
function EditDrawer({
  member,
  onClose,
  onSave,
  onDelete,
}: {
  member: Member;
  onClose: () => void;
  onSave: (m: Member) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<Member>({ ...member });

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("memberId", form.id);
      const res = await fetch("/api/upload-csv/self", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      alert("✅ CSV cargado. Afinidad actualizada");
      window.dispatchEvent(new CustomEvent("rowi:members-updated"));
    } catch {
      alert("❌ Error subiendo CSV");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="rowi-card bg-white dark:bg-zinc-900 border border-rowi-card-border rounded-2xl shadow-2xl w-full max-w-lg">
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-lg">
            {form.id === "new" ? "Nuevo miembro" : "Editar miembro"}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* FORMULARIO */}
        <div className="p-4 space-y-3 text-sm">
          <input
            className="w-full rounded border px-2 py-1 bg-transparent"
            value={form.name || ""}
            placeholder="Nombre"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full rounded border px-2 py-1 bg-transparent"
            value={form.email || ""}
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="w-full rounded border px-2 py-1 bg-transparent"
            value={form.country || ""}
            placeholder="País"
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />

          {/* Grupo y cercanía */}
          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full rounded border px-2 py-1 bg-transparent"
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
            >
              {GROUP_KEYS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <select
              className="w-full rounded border px-2 py-1 bg-transparent"
              value={form.closeness}
              onChange={(e) =>
                setForm({ ...form, closeness: e.target.value as any })
              }
            >
              <option value="Cercano">Cercano</option>
              <option value="Neutral">Neutral</option>
              <option value="Lejano">Lejano</option>
            </select>
          </div>

          {/* 📈 Vista previa emocional de afinidad */}
          {form.affinity != null && (
            <div className="mt-4 border-t pt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>💓 Afinidad actual</span>
                <span>{form.affinity}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full ${
                    form.affinity >= 85
                      ? "bg-green-400"
                      : form.affinity >= 65
                      ? "bg-lime-400"
                      : form.affinity >= 45
                      ? "bg-yellow-400"
                      : form.affinity >= 25
                      ? "bg-orange-400"
                      : "bg-red-400"
                  }`}
                  style={{
                    width: `${Math.min(100, form.affinity || 0)}%`,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              {/* Etiqueta de interpretación simple */}
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 italic text-center">
                {form.affinity >= 85
                  ? "Relación sólida y confiable 🌿"
                  : form.affinity >= 65
                  ? "Conexión positiva ☀️"
                  : form.affinity >= 45
                  ? "Potencial de crecimiento ✨"
                  : form.affinity >= 25
                  ? "Necesita reconexión 🔄"
                  : "Distancia emocional 💭"}
              </p>
            </div>
          )}

          {/* 📤 Subida de CSV individual (SEI / Vital Signs) */}
          {form.id !== "new" && (
            <div className="pt-4 border-t mt-3">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                📤 Subir archivo SEI / Vital Signs (CSV)
              </label>
              <input
                type="file"
                accept=".csv"
                className="w-full text-xs mt-1"
                onChange={handleCsvUpload}
              />
            </div>
          )}
        </div>

        {/* FOOTER — Acciones principales */}
        <div className="p-4 border-t flex justify-between items-center">
          {/* 🗑️ Eliminar (solo si existe) */}
          {form.id !== "new" && (
            <button
              className="text-red-500 text-sm hover:underline"
              onClick={() => onDelete(form.id)}
            >
              🗑️ Eliminar
            </button>
          )}

          {/* 🎯 Guardar / Cancelar */}
          <div className="flex gap-2 ml-auto">
            <button
              className="rowi-btn border border-gray-300 hover:bg-gray-100"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="rowi-btn text-white font-medium"
              style={{ background: R.blue }}
              onClick={() => onSave(form)}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}