"use client";
import { useEffect, useMemo, useState } from "react";

type Member = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  brainStyle?: string;
  group: string;
  connectionType?: string;
  closeness: "Cercano" | "Neutral" | "Lejano";
  image?: string;
  affinityPercent?: number;
  affinityLevel?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  title?: string;
  subtitle?: string;
};

export default function MemberPickerDialog({
  open,
  onClose,
  selectedIds,
  onChange,
  title = "Selecciona personas",
  subtitle = "Puedes elegir varias",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("Todos");
  const [close, setClose] = useState<string>("Todos");
  const [localSel, setLocalSel] = useState<Record<string, boolean>>({});

  /* =========================================================
     🔹 Cargar miembros + afinidad desde backend
  ========================================================= */
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    (async () => {
      try {
        // 1️⃣ Obtener lista base de miembros
        const r = await fetch("/api/community/members", { cache: "no-store" });
        const j = await r.json();
        let list: Member[] = Array.isArray(j.members) ? j.members : [];

        // 2️⃣ En modo demo (fallback)
        if (!list.length) {
          const d = await fetch("/api/community/members?demo=1");
          const dj = await d.json();
          if (Array.isArray(dj.members)) list = dj.members;
        }

        // 3️⃣ Cargar afinidad para cada miembro individualmente
        const enriched = await Promise.all(
          list.map(async (m) => {
            try {
              const a = await fetch(`/api/affinity/snapshots?memberId=${m.id}`);
              const aj = await a.json();
              if (aj?.snapshot?.lastHeat135) {
                const heat = Math.round((aj.snapshot.lastHeat135 / 135) * 100);
                const level =
                  aj.snapshot.lastHeat135 >= 118
                    ? "Experto"
                    : aj.snapshot.lastHeat135 >= 108
                    ? "Diestro"
                    : aj.snapshot.lastHeat135 >= 92
                    ? "Funcional"
                    : aj.snapshot.lastHeat135 >= 82
                    ? "Emergente"
                    : "Desafío";
                return { ...m, affinityPercent: heat, affinityLevel: level };
              }
            } catch {}
            return { ...m };
          })
        );

        setMembers(enriched);
      } catch (err) {
        console.error("Error cargando miembros:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  /* =========================================================
     🔹 Init selección local
  ========================================================= */
  useEffect(() => {
    const m: Record<string, boolean> = {};
    selectedIds.forEach((id) => (m[id] = true));
    setLocalSel(m);
  }, [selectedIds, open]);

  /* =========================================================
     🔹 Filtros y búsqueda
  ========================================================= */
  const groups = useMemo(() => {
    const s = new Set<string>();
    members.forEach((m) => m.group && s.add(m.group));
    return ["Todos", ...Array.from(s)];
  }, [members]);

  const filtered = useMemo(() => {
    const qq = q.toLowerCase().trim();
    return members.filter((m) => {
      const matchQ = qq
        ? (m.name || "").toLowerCase().includes(qq) ||
          (m.email || "").toLowerCase().includes(qq) ||
          (m.country || "").toLowerCase().includes(qq)
        : true;
      const matchG = group === "Todos" ? true : m.group === group;
      const matchCl = close === "Todos" ? true : m.closeness === close;
      return matchQ && matchG && matchCl;
    });
  }, [members, q, group, close]);

  const allOnPage = filtered.length > 0 && filtered.every((m) => !!localSel[m.id]);
  const toggle = (id: string) => setLocalSel((s) => ({ ...s, [id]: !s[id] }));
  const toggleAllPage = () =>
    setLocalSel((s) => {
      const next = { ...s };
      if (!allOnPage) filtered.forEach((m) => (next[m.id] = true));
      else filtered.forEach((m) => delete next[m.id]);
      return next;
    });

  const confirm = () => {
    const ids = Object.keys(localSel).filter((k) => localSel[k]);
    onChange(ids);
  };

  if (!open) return null;

  /* =========================================================
     🧠 Render principal
  ========================================================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* contenedor principal */}
      <div
        className="
          relative w-full max-w-3xl h-[90vh]
          rounded-2xl shadow-2xl border border-gray-200 dark:border-white/15
          overflow-hidden flex flex-col
          bg-white dark:bg-[#121212]
          animate-fadeIn
        "
      >
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-rowi-blueDay/10 to-rowi-pinkDay/10">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <button
            className="px-4 py-1 rounded-full bg-gradient-to-r from-rowi-pinkDay to-rowi-blueDay text-white text-xs font-medium"
            onClick={onClose}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* filtros */}
        <div className="p-4 grid md:grid-cols-3 gap-3 bg-gray-50 dark:bg-[#181818]">
          <input
            className="rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-[#222] px-2 py-2 text-sm outline-none text-gray-800 dark:text-gray-100"
            placeholder="Buscar (nombre, email, país)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-[#222] px-2 py-2 text-sm text-gray-800 dark:text-gray-100"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select
            className="rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-[#222] px-2 py-2 text-sm text-gray-800 dark:text-gray-100"
            value={close}
            onChange={(e) => setClose(e.target.value)}
          >
            <option>Todos</option><option>Cercano</option><option>Neutral</option><option>Lejano</option>
          </select>
        </div>

        {/* lista de miembros */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-white dark:bg-[#121212]">
          {loading ? (
            <div className="text-sm text-gray-400">Cargando miembros...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-gray-200 dark:border-white/15 p-3 hover:shadow-md transition bg-gray-50 dark:bg-[#1a1a1a]"
                >
                  <div className="flex items-start gap-3">
                    {/* ✅ Imagen con fallback */}
                    <img
                      src={
                        m.image ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || "U")}`
                      }
                      alt={m.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-white/20"
                    />
                    <input
                      type="checkbox"
                      className="mt-1 accent-rowi-blueDay"
                      checked={!!localSel[m.id]}
                      onChange={() => toggle(m.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium truncate text-gray-800 dark:text-gray-100">
                          {m.name}
                        </div>
                        <span className="text-[11px] text-gray-500 truncate">{m.country || "—"}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {m.brainStyle || "—"} · {m.group || "—"} · {m.closeness || "—"}
                      </div>

                      {/* Afinidad visual */}
                      {m.affinityPercent ? (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                            <span>{m.affinityLevel}</span>
                            <span>{m.affinityPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${m.affinityPercent}%`,
                                background:
                                  m.affinityPercent >= 90
                                    ? "linear-gradient(90deg,#31a2e3,#5be3a0)"
                                    : m.affinityPercent >= 70
                                    ? "linear-gradient(90deg,#31a2e3,#d797cf)"
                                    : "linear-gradient(90deg,#999,#ccc)",
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-gray-400 italic">
                          Afinidad pendiente
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-4">
              Sin resultados con esos filtros.
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#181818] p-4 flex items-center justify-between">
          <button
            className="rounded-full border border-gray-300 dark:border-white/20 px-4 py-2 text-xs text-gray-700 dark:text-gray-200"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-full px-5 py-2 text-xs text-white font-medium bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay shadow-md"
            onClick={() => { confirm(); onClose(); }}
          >
            ✅ Usar selección
          </button>
        </div>
      </div>
    </div>
  );
}