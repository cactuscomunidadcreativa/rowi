"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Trash2,
  Plus,
  Loader2,
  Brain,
  Filter,
  Search,
  Layers3,
  Network,
  Building2,
  Tag,
  Link2,
  FolderOpenDot,
  Globe2,
} from "lucide-react";

export default function KnowledgeAdminPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState("all");
  const [filterHub, setFilterHub] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterSuperHub, setFilterSuperHub] = useState("");

  const [form, setForm] = useState({
    title: "",
    url: "",
    kind: "",
    tags: "",
    agents: [] as string[],
  });

  // 🔍 FETCH DATA
  async function fetchResources(query = "") {
    const res = await fetch(`/api/hub/knowledge?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    setResources(Array.isArray(json.data) ? json.data : []);
  }

  async function fetchAgents() {
    const res = await fetch(`/api/hub/agents`);
    const json = await res.json();
    setAgents(Array.isArray(json) ? json : []);
  }

  useEffect(() => {
    fetchResources();
    fetchAgents();
  }, []);

  // 🧠 FILTROS
  const filtered = resources.filter((r) => {
    const matchKind = filterKind === "all" || r.kind === filterKind;
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some((t: any) =>
        t.tag.name.toLowerCase().includes(search.toLowerCase())
      );
    const matchHub = !filterHub || r.hub?.name === filterHub;
    const matchTenant = !filterTenant || r.tenant?.name === filterTenant;
    const matchSuperHub =
      !filterSuperHub || r.superHub?.name === filterSuperHub;
    return matchKind && matchSearch && matchHub && matchTenant && matchSuperHub;
  });

  // 🧩 CREAR RECURSO
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/hub/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setForm({ title: "", url: "", kind: "", tags: "", agents: [] });
    await fetchResources();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este recurso permanentemente?")) return;
    await fetch(`/api/hub/knowledge?id=${id}`, { method: "DELETE" });
    await fetchResources();
  }

  // 🏗️ Agrupar Hubs / Tenants / SuperHubs
  const hubs = Array.from(new Set(resources.map((r) => r.hub?.name).filter(Boolean)));
  const tenants = Array.from(new Set(resources.map((r) => r.tenant?.name).filter(Boolean)));
  const superHubs = Array.from(new Set(resources.map((r) => r.superHub?.name).filter(Boolean)));

  return (
    <main className="p-8 space-y-8">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rowi-blueDay via-rowi-purpleDay to-rowi-pinkDay bg-clip-text text-transparent">
            Knowledge Hub Central
          </h1>
          <p className="text-gray-500 text-sm">
            Mapa vivo del conocimiento organizacional e inteligencia colectiva.
          </p>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <Sparkles className="text-rowi-pinkDay w-7 h-7" />
        </motion.div>
      </header>

      {/* FILTROS */}
      <section className="bg-white/80 dark:bg-gray-900/40 rounded-xl p-4 shadow backdrop-blur-md space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center bg-white/70 dark:bg-gray-800/60 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-rowi-blueDay mr-2" />
            <input
              placeholder="Buscar por título, etiqueta o agente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchResources(e.target.value);
              }}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            className={selectRowi}
          >
            <option value="all">Todos los tipos</option>
            <option value="manual">Manual</option>
            <option value="insight">Insight</option>
            <option value="ia">IA</option>
          </select>

          <select value={filterHub} onChange={(e) => setFilterHub(e.target.value)} className={selectRowi}>
            <option value="">Todos los Hubs</option>
            {hubs.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>

          <select value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)} className={selectRowi}>
            <option value="">Todos los Tenants</option>
            {tenants.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <select value={filterSuperHub} onChange={(e) => setFilterSuperHub(e.target.value)} className={selectRowi}>
            <option value="">Todos los SuperHubs</option>
            {superHubs.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </section>

      {/* FORMULARIO */}
      <motion.section
        layout
        className="p-6 border rounded-2xl bg-gradient-to-br from-white/80 to-rowi-blueDay/5 dark:from-gray-900/70 dark:to-rowi-pinkNight/10 shadow-lg backdrop-blur-md space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-rowi-blueDay" />
          Agregar conocimiento
        </h2>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputRowi} />
          <input placeholder="URL o fuente" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputRowi} />
          <input placeholder="Tipo (manual, insight, IA)" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputRowi} />
          <input placeholder="Etiquetas (coma)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputRowi} />

          {/* Vincular agentes */}
          <div className="col-span-full border rounded-xl p-3 bg-white/50 dark:bg-gray-800/40">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2 mb-2">
              <Brain className="w-3 h-3 text-rowi-blueDay" /> Vincular agentes
            </label>
            <div className="flex flex-wrap gap-2">
              {agents.map((a) => {
                const active = form.agents.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        agents: active
                          ? prev.agents.filter((id) => id !== a.id)
                          : [...prev.agents, a.id],
                      }))
                    }
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                      active
                        ? "bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    <Brain className="w-3 h-3" />
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-full flex justify-end">
            <button disabled={loading} className="px-6 py-2 bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white rounded-lg font-medium hover:opacity-90 transition">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </span>
              ) : (
                "Guardar Recurso"
              )}
            </button>
          </div>
        </form>
      </motion.section>

      {/* LISTADO */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-10 text-gray-500">
            <p>No hay recursos disponibles. 🌱</p>
          </motion.div>
        ) : (
          <motion.div layout key="grid" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((r) => (
              <motion.article key={r.id} layout whileHover={{ scale: 1.02 }} className="rounded-2xl border bg-white/60 dark:bg-gray-900/60 shadow-md hover:shadow-2xl transition-all p-4 backdrop-blur-md relative group">
                {/* Imagen */}
                <div className="h-36 rounded-xl mb-3 overflow-hidden bg-gradient-to-r from-rowi-blueDay/10 to-rowi-pinkDay/10 flex items-center justify-center">
                  <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(r.title)}`} alt={r.title} className="object-cover h-full w-full opacity-80 group-hover:opacity-100 transition" />
                </div>

                {/* CONTENIDO */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{r.title}</h3>
                  {r.url && <a href={r.url} target="_blank" className="text-rowi-blueDay text-xs truncate hover:underline">{r.url}</a>}
                  <p className="text-xs text-gray-500 italic">{r.kind}</p>

                  {/* JERARQUÍA */}
                  <div className="flex flex-wrap gap-1 mt-2 text-[11px] text-gray-500">
                    {r.superHub && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rowi-blueDay/10 to-rowi-pinkDay/10">
                        <Globe2 className="w-3 h-3" /> {r.superHub.name}
                      </span>
                    )}
                    {r.tenant && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <Building2 className="w-3 h-3" /> {r.tenant.name}
                      </span>
                    )}
                    {r.hub && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40">
                        <Layers3 className="w-3 h-3" /> {r.hub.name}
                      </span>
                    )}
                  </div>

                  {/* AGENTES */}
                  {r.agents?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.agents.map((a: any) => (
                        <span key={a.id} title={a.name} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-rowi-blueDay/10 to-rowi-pinkDay/10">
                          <Brain className="w-3 h-3" />
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* TAGS */}
                  {r.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.tags.map((t: any) => (
                        <span key={t.tag.id} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Tag className="w-3 h-3 inline-block mr-1" /> {t.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* DELETE */}
                <button onClick={() => handleDelete(r.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* 🌈 Input y Select */
const inputRowi =
  "border rounded-lg px-3 py-2 w-full bg-white/60 dark:bg-gray-800/60 focus:ring-2 focus:ring-rowi-blueDay outline-none transition";
const selectRowi =
  "border rounded-md px-2 py-1 text-sm focus:ring-rowi-blueDay bg-white/80 dark:bg-gray-800/60";