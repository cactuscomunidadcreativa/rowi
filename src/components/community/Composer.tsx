// src/app/(app)/community/page.tsx
import { Suspense } from "react";

async function getMembers(searchParams: { demo?: string }) {
  const isDemo = searchParams?.demo === "1";
  if (!isDemo) return { members: [], totalAffinity: null };
  const res = await fetch("/api/community/members?demo=1", { cache: "no-store" });
  if (!res.ok) return { members: [], totalAffinity: null };
  return res.json();
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams?: { demo?: string };
}) {
  const data = await getMembers(searchParams || {});
  const isDemo = searchParams?.demo === "1";

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Community</h1>
          {isDemo ? (
            <p className="text-sm text-gray-500">
              Vista demo · Afinidad total estimada:{" "}
              {data.totalAffinity != null ? `${data.totalAffinity}%` : "—"}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Aún no has configurado tu comunidad. Esto quedará vacío por ahora.
            </p>
          )}
        </div>
      </header>

      {/* Estado vacío por defecto */}
      {!isDemo && (
        <div className="rounded-xl border p-8 text-center text-gray-400">
          <p className="mb-2">No hay miembros para mostrar.</p>
          <p className="text-xs">
            (Para previsualizar una demo temporal agrega <code>?demo=1</code> a la URL)
          </p>
        </div>
      )}

      {/* Demo opcional */}
      {isDemo && (
        <Suspense fallback={<div className="text-gray-400">Cargando miembros…</div>}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Miembros: {data.members?.length ?? 0}
            </div>
            {/* Placeholder de filtros (grupos), deshabilitado por ahora */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Grupo:</label>
              <select className="rounded-md border bg-transparent px-2 py-1 text-sm" disabled>
                <option>Todos</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-3">
            {(data.members ?? []).map((m: any) => (
              <div key={m.id} className="rounded-xl border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.country}</div>
                  </div>
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {m.brainStyle}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Afinidad</span>
                    <span>{m.affinity}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-800/30 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.affinity}%`, background: "linear-gradient(90deg,#d797cf,#31a2e3,#7a59c9)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Suspense>
      )}
    </div>
  );
}