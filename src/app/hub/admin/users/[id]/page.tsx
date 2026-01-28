"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { UserCircle2, Calendar, Brain, Sparkles } from "lucide-react";

/**
 * =========================================================
 * 👤 Perfil del Usuario — Línea de Tiempo Emocional SEI
 * ---------------------------------------------------------
 * - Muestra todas las evaluaciones SEI (EqSnapshots)
 * - Cada snapshot incluye competencias, subfactores,
 *   outcomes, factores de éxito y reflexiones EqProgress
 * =========================================================
 */

export default function UserTimelineProfile() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Usuario
        const resUser = await fetch(`/api/users/${id}`);
        const u = await resUser.json();
        setUser(u);

        // Snapshots SEI
        const resSnaps = await fetch(`/api/hub/eq/snapshots?userId=${id}`);
        const snaps = await resSnaps.json();

        // Orden cronológico
        snaps.sort(
          (a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime()
        );
        setSnapshots(snaps);

        // Progress (reflexiones / insights)
        const resProg = await fetch(`/api/hub/eq/progress?userId=${id}`);
        const prog = await resProg.json();
        setProgress(prog);
      } catch (err) {
        console.error("❌ Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading)
    return <p className="p-6 text-sm text-muted-foreground">Cargando perfil...</p>;
  if (!user)
    return <p className="p-6 text-sm text-muted-foreground">Usuario no encontrado.</p>;

  return (
    <div className="p-8 space-y-8">
      {/* CABECERA */}
      <div className="flex items-center gap-4 border-b pb-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-rowi-blueDay"
          />
        ) : (
          <UserCircle2 className="w-20 h-20 text-gray-400" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400">
            Última conexión:{" "}
            {user.lastLogin
              ? new Date(user.lastLogin).toLocaleString("es-PE")
              : "—"}
          </p>
          <p className="text-xs text-gray-400">
            {user.country || "—"} · {user.education || "Sin educación registrada"}
          </p>
        </div>
      </div>

      {/* LÍNEA DE TIEMPO */}
      <div className="relative border-l-2 border-rowi-blueDay/30 pl-6 space-y-10">
        {snapshots.length === 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            No se encontraron evaluaciones SEI para este usuario.
          </p>
        )}

        {snapshots.map((s, index) => {
          const snapProgress = progress.filter((p) => p.snapshotId === s.id);

          return (
            <div key={s.id} className="relative">
              <span className="absolute -left-[11px] top-2 w-5 h-5 rounded-full bg-rowi-blueDay border-2 border-white shadow"></span>

              <div className="bg-white dark:bg-gray-900/50 border border-gray-200 rounded-lg p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4 text-rowi-blueDay" />
                    {s.project || "Evaluación SEI"}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(s.at).toLocaleDateString("es-PE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* KCG */}
                <div className="space-y-2 mt-2">
                  <Bar label="Know Yourself" value={s.K} color="#3B82F6" />
                  <Bar label="Choose Yourself" value={s.C} color="#EC4899" />
                  <Bar label="Give Yourself" value={s.G} color="#10B981" />
                </div>

                {/* Subfactores */}
                <SectionTitle title="Subfactores" />
                <GridBars
                  data={[
                    ["EL", s.EL],
                    ["RP", s.RP],
                    ["ACT", s.ACT],
                    ["NE", s.NE],
                    ["IM", s.IM],
                    ["OP", s.OP],
                    ["EMP", s.EMP],
                    ["NG", s.NG],
                  ]}
                />

                {/* Outcomes */}
                <SectionTitle title="Outcomes" />
                <GridBars
                  data={[
                    ["Effectiveness", s.effectiveness],
                    ["Relationship", s.relationship],
                    ["Quality of Life", s.qualityOfLife],
                    ["Wellbeing", s.wellbeing],
                  ]}
                />

                {/* Factores de Éxito */}
                <SectionTitle title="Factores de Éxito" />
                <GridBars
                  data={[
                    ["Influence", s.Influence],
                    ["Decision Making", s.DecisionMaking],
                    ["Community", s.Community],
                    ["Network", s.Network],
                    ["Achievement", s.Achievement],
                    ["Satisfaction", s.Satisfaction],
                    ["Balance", s.Balance],
                    ["Health", s.Health],
                  ]}
                />

                {/* Reflexiones / Progress */}
                {snapProgress.length > 0 && (
                  <>
                    <SectionTitle title="Reflexiones y Progreso" />
                    <div className="mt-2 border-t pt-3 space-y-4">
                      {snapProgress.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-rowi-blueDay/5 rounded-lg border border-rowi-blueDay/10"
                        >
                          <div className="flex items-center gap-2 mb-2 text-rowi-blueDay text-sm font-semibold">
                            <Sparkles className="w-4 h-4" />
                            {new Date(p.createdAt).toLocaleDateString("es-PE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>

                          {p.reflection && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              💭 <strong>Reflexión:</strong> {p.reflection}
                            </p>
                          )}
                          {p.insight && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              ✨ <strong>Insight:</strong> {p.insight}
                            </p>
                          )}
                          {p.actionPlan && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              🚀 <strong>Plan de acción:</strong> {p.actionPlan}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   🔹 Subcomponentes visuales
========================================================= */
function SectionTitle({ title }: { title: string }) {
  return (
    <p className="mt-3 mb-1 text-xs font-semibold uppercase text-gray-500 tracking-wider">
      {title}
    </p>
  );
}

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value?: number | null;
  color: string;
}) {
  if (!value) return null;
  const normalized = Math.min(Math.max(value, 50), 150);
  const percent = ((normalized - 50) / 100) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="w-32 text-xs font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
      <span className="text-[10px] text-gray-500 w-6 text-right">
        {Math.round(normalized)}
      </span>
    </div>
  );
}

function GridBars({ data }: { data: [string, number | null | undefined][] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
      {data.map(([key, val]) => (
        <Bar key={key} label={key} value={val || 0} color={colorByKey(key)} />
      ))}
    </div>
  );
}

/* =========================================================
   🔹 Paleta de colores Six Seconds
========================================================= */
function colorByKey(key: string) {
  const map: Record<string, string> = {
    // Competencias principales
    K: "#3B82F6",
    C: "#EC4899",
    G: "#10B981",
    // Subfactores
    EL: "#60A5FA",
    RP: "#2563EB",
    ACT: "#9333EA",
    NE: "#06B6D4",
    IM: "#E879F9",
    OP: "#A855F7",
    EMP: "#14B8A6",
    NG: "#84CC16",
    // Outcomes
    Effectiveness: "#0EA5E9",
    Relationship: "#EC4899",
    "Quality of Life": "#8B5CF6",
    Wellbeing: "#10B981",
    // Success
    Influence: "#1E40AF",
    "Decision Making": "#BE123C",
    Community: "#22C55E",
    Network: "#9333EA",
    Achievement: "#0EA5E9",
    Satisfaction: "#E879F9",
    Balance: "#F59E0B",
    Health: "#10B981",
  };
  return map[key] || "#94A3B8";
}