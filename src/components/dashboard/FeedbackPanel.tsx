"use client";

/** Conjunto de competencias que comparamos (8 SEI). */
type CompKeys = "EL"|"RP"|"ACT"|"NE"|"IM"|"OP"|"EMP"|"NG";
type Comp = Partial<Record<CompKeys, number|null>>;

/**
 * Panel de feedback:
 * - Muestra deltas (present - compare) por competencias.
 * - Encabezado con fechas (si llegan).
 * - Si no hay compare, muestra aviso.
 */
export default function FeedbackPanel({
  present,           // { competencias: Comp }
  refA,              // competencias de comparación (opcional)
  datePresent,       // fecha del presente (texto)
  dateCompare,       // fecha de la comparación (texto)
}: {
  present: { competencias: Comp };
  refA?: Comp | null;
  datePresent?: string | null;
  dateCompare?: string | null;
}) {
  const keys: CompKeys[] = ["EL","RP","ACT","NE","IM","OP","EMP","NG"];

  // Si no hay referencia, mostramos aviso
  if (!refA) {
    return (
      <div className="rounded-xl border p-4 shadow-sm">
        <div className="text-sm text-gray-500 mb-2">
          Feedback · {datePresent || "—"}{dateCompare ? ` vs ${dateCompare}` : ""}
        </div>
        <div className="text-xs text-gray-400">
          Selecciona “Pasado” o una “Fecha” para ver cambios por competencia.
        </div>
      </div>
    );
  }

  // Cálculo de deltas
  const deltas = keys.map((k) => {
    const a = Number(present.competencias?.[k] ?? 0);
    const b = Number(refA?.[k] ?? 0);
    return { k, d: Math.round((a - b) * 10) / 10 };
  });

  const ups   = deltas.filter(x => x.d > 0).slice(0, 3);
  const downs = deltas.filter(x => x.d < 0).slice(0, 3);

  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">
        Feedback · {datePresent || "—"}{dateCompare ? ` vs ${dateCompare}` : ""}
      </div>

      <ul className="text-sm text-gray-300 space-y-1">
        {ups.length > 0 && (
          <li className="text-green-400">
            ↑ {ups.map(u => `${u.k} (+${u.d})`).join(", ")}
          </li>
        )}
        {downs.length > 0 && (
          <li className="text-red-400">
            ↓ {downs.map(d => `${d.k} (${d.d})`).join(", ")}
          </li>
        )}
        {ups.length === 0 && downs.length === 0 && (
          <li className="text-gray-400">Cambios marginales o datos insuficientes.</li>
        )}
      </ul>
    </div>
  );
}