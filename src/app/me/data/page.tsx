// src/app/me/data/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type DatasetOpt = "actual" | "feedback";
type KeyScore = { key: string; score: number };

export default function MyDataPage() {
  const [msg, setMsg] = useState<string>("");
  const [mode, setMode] = useState<DatasetOpt>("actual");
  const [history, setHistory] = useState<{ id:string; at:string; dataset:string }[]>([]);
  const [current, setCurrent] = useState<any | null>(null);

  async function refreshSnapshots() {
    const r = await fetch("/api/eq/snapshots", { cache: "no-store" });
    const data = await r.json().catch(()=>({}));
    if (data?.ok) {
      setCurrent(data.current || null);
      setHistory(Array.isArray(data.history) ? data.history : []);
    }
  }

  useEffect(() => { refreshSnapshots(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setMsg("Subiendo CSV…");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dataset", mode);
      const r = await fetch("/api/upload-csv/self", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data?.ok) setMsg(data?.error || "Error subiendo CSV.");
      else {
        setMsg((data?.message || "CSV aplicado.") + (typeof data.inserted === "number" ? ` (insertados: ${data.inserted}, omitidos: ${data.skipped ?? 0})` : ""));
        await refreshSnapshots();
      }
      e.target.value = "";
      setTimeout(() => setMsg(""), 4000);
    } catch {
      setMsg("No se pudo subir el CSV.");
      setTimeout(() => setMsg(""), 4000);
    }
  }

  // utilidades de UI
  const topTalents = useMemo(() => {
    const ts: KeyScore[] = current?.talents || [];
    return [...ts].sort((a,b)=> (b.score ?? 0) - (a.score ?? 0)).slice(0,5);
  }, [current]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Mis datos (CSV)</h1>
        <p className="text-sm text-gray-400">
          Sube tu CSV personal (SEI). Marca como <b>Mi Perfil</b> o <b>Feedback 360</b>. No borramos: guardamos histórico.
        </p>
      </header>

      {/* Selector + Upload */}
      <div className="rounded-xl border p-4 shadow-sm space-y-3">
        <div className="text-sm text-gray-400">Aplicar como</div>
        <div className="flex flex-wrap gap-2">
          <button className={`px-3 py-2 text-xs rounded-md border ${mode==="actual" ? "bg-white/10 border-white" : "border-white/20"}`} onClick={()=>setMode("actual")}>Mi Perfil</button>
          <button className={`px-3 py-2 text-xs rounded-md border ${mode==="feedback" ? "bg-white/10 border-white" : "border-white/20"}`} onClick={()=>setMode("feedback")}>Feedback 360</button>
        </div>
        <label className="rounded-md border px-3 py-2 text-sm cursor-pointer inline-block">
          Subir CSV ({mode === "actual" ? "Mi Perfil" : "Feedback 360"})
          <input type="file" accept=".csv" className="hidden" onChange={onUpload} />
        </label>
        {msg && <div className="text-xs text-gray-400">{msg}</div>}
      </div>

      {/* Actual (con todo) */}
      <div className="rounded-xl border p-4 shadow-sm space-y-3">
        <div className="text-sm text-gray-400">Actual</div>
        {!current ? (
          <div className="text-xs text-gray-500">Aún no hay datos actuales.</div>
        ) : (
          <>
            {current.brainStyle ? (
              <div className="text-sm">
                <span className="text-gray-400 mr-2">Brain:</span>
                <span className="font-medium">{current.brainStyle}</span>
              </div>
            ) : null}

            {/* K/C/G + 8 competencias (igual que antes) */}
            <MiniTable data={current} />

            {/* Outcomes */}
            {Array.isArray(current.outcomes) && current.outcomes.length ? (
              <Block title="Factores de éxito">
                <BarList items={current.outcomes} />
              </Block>
            ) : null}

            {/* Subfactores */}
            {Array.isArray(current.subfactors) && current.subfactors.length ? (
              <Block title="Subfactores">
                <BarList items={current.subfactors} />
              </Block>
            ) : null}

            {/* Talentos (Top 5) */}
            {Array.isArray(current.talents) && current.talents.length ? (
              <Block title="Talentos (Top 5)">
                <BarList items={topTalents} />
              </Block>
            ) : null}
          </>
        )}
      </div>

      {/* Histórico (solo meta) */}
      <div className="rounded-xl border p-4 shadow-sm space-y-3">
        <div className="text-sm text-gray-400">Histórico de cargas</div>
        {!history.length ? (
          <div className="text-xs text-gray-500">Sin histórico aún.</div>
        ) : (
          <ul className="space-y-2 text-xs">
            {history.map((h) => (
              <li key={h.id} className="rounded-md border px-3 py-2">
                {new Date(h.at).toLocaleString()} · {h.dataset}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* UI helpers */

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}

function BarList({ items }: { items: KeyScore[] }) {
  return (
    <div className="space-y-1">
      {items.map((it) => (
        <div key={it.key} className="grid grid-cols-5 items-center gap-2">
          <div className="col-span-2 text-gray-400">{it.key}</div>
          <div className="col-span-3 h-2 bg-gray-800/30 rounded-full overflow-hidden">
            <div className="h-full bg-white/20" style={{ width: `${Math.min(100, Math.max(0, it.score))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniTable({ data }: { data: any }) {
  const cells: Array<{ k: string; v: any }> = [
    { k: "K", v: data.K }, { k: "C", v: data.C }, { k: "G", v: data.G },
    { k: "EL", v: data.EL }, { k: "RP", v: data.RP }, { k: "ACT", v: data.ACT }, { k: "NE", v: data.NE },
    { k: "IM", v: data.IM }, { k: "OP", v: data.OP }, { k: "EMP", v: data.EMP }, { k: "NG", v: data.NG },
  ];
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs">
      {cells.map(c => (
        <div key={c.k} className="rounded-md border px-2 py-1 flex items-center justify-between">
          <span className="text-gray-400">{c.k}</span>
          <span className="font-medium">{typeof c.v === "number" ? c.v : "—"}</span>
        </div>
      ))}
    </div>
  );
}