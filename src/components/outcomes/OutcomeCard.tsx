"use client";

import { EQ_MAX } from "@/domains/eq/lib/eqLevels";

/**
 * OutcomeCard con soporte PARA SUCCESS FACTORS
 * - Si el valor viene nulo desde present.subs[x].value
 * - LO BUSCA en present.success[x]
 * - Y lo muestra correctamente
 */

export default function OutcomeCard({
  title,
  score,
  subs,
  ghost,
  success,       // 👈 NUEVO
  successGhost,  // 👈 NUEVO
}: {
  title: string;
  score: number | null;
  subs: { label: string; value: number | null }[];
  ghost?: { score: number | null; subs?: { label: string; value: number | null }[] } | null;

  // 👇 NUEVOS CAMPOS OPCIONALES
  success?: Array<{ key: string; score: number | null }> | null;
  successGhost?: Array<{ key: string; score: number | null }> | null;
}) {
  // ===== NORMALIZACIÓN =====
  const normalize = (v: number | null | undefined) =>
    typeof v === "number"
      ? Math.max(0, Math.min(EQ_MAX, v))
      : null;

  const mainScore = normalize(score);
  const ghostScore = ghost?.score ? normalize(ghost?.score) : null;

  const widthMain = mainScore ? (mainScore / EQ_MAX) * 100 : 0;
  const widthGhost = ghostScore ? (ghostScore / EQ_MAX) * 100 : 0;

  // ===== OBTENER SUB-FACTORES CON FALLBACK A success[] =====
  const getValue = (label: string, baseVal: number | null) => {
    if (baseVal != null) return normalize(baseVal);
    if (!success) return null;

    const found = success.find(
      (s) => s.key?.toLowerCase() === label.toLowerCase()
    );
    return normalize(found?.score ?? null);
  };

  const getGhostValue = (label: string, baseVal: number | null) => {
    if (baseVal != null) return normalize(baseVal);
    if (!successGhost) return null;

    const found = successGhost.find(
      (s) => s.key?.toLowerCase() === label.toLowerCase()
    );
    return normalize(found?.score ?? null);
  };

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-black/20">
      {/* TITLE + SCORE */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <div className="text-sm text-gray-400">
          {mainScore != null ? `${mainScore} / ${EQ_MAX}` : "—"}
        </div>
      </div>

      {/* MAIN BAR */}
      <div className="mt-2 h-2 w-full rounded-full bg-gray-800/30 relative overflow-hidden">
        {ghostScore != null && (
          <div
            className="absolute inset-y-0 left-0 rounded-full opacity-40"
            style={{
              width: `${widthGhost}%`,
              backgroundColor: "#9aa0a6",
            }}
          />
        )}
        <div
          className="h-full rounded-full relative"
          style={{
            width: `${widthMain}%`,
            backgroundColor: "#cfd8dc",
          }}
        />
      </div>

      {/* SUB-FACTORS */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {subs.map((s) => {
          // MAIN
          const val = getValue(s.label, s.value);
          const widthVal = val ? (val / EQ_MAX) * 100 : 0;

          // COMPARISON
          const gVal = getGhostValue(
            s.label,
            ghost?.subs?.find((x) => x.label === s.label)?.value ?? null
          );
          const widthGVal = gVal ? (gVal / EQ_MAX) * 100 : 0;

          return (
            <div key={s.label}>
              {/* Label + Number */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{s.label}</span>
                <span>{val != null ? `${val} / ${EQ_MAX}` : "—"}</span>
              </div>

              {/* Bar */}
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800/30 relative overflow-hidden">
                {gVal != null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full opacity-40"
                    style={{ width: `${widthGVal}%`, backgroundColor: "#9aa0a6" }}
                  />
                )}
                <div
                  className="h-full rounded-full relative"
                  style={{ width: `${widthVal}%`, backgroundColor: "#eceff1" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}