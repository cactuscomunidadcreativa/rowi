"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  UserCircle2,
  Brain,
  Calendar,
  Star,
  Target,
  HeartHandshake,
  Rocket,
} from "lucide-react";

/**
 * =========================================================
 * 🌟 Perfil SEI del Miembro (versión final refinada)
 * ---------------------------------------------------------
 * Limpio, legible y visualmente equilibrado.
 * =========================================================
 */

export default function MemberProfilePage() {
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const resMember = await fetch(`/api/hub/communities/members/${id}`);
        const m = await resMember.json();
        setMember(m);

        const resSnaps = await fetch(`/api/hub/eq/snapshots?memberId=${id}`);
        const snaps = await resSnaps.json();
        snaps.sort(
          (a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime()
        );
        setSnapshots(snaps);
      } catch (err) {
        console.error("❌ Error cargando perfil del miembro:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading)
    return (
      <div className="p-6 text-sm text-muted-foreground animate-pulse">
        Cargando perfil emocional...
      </div>
    );

  if (!member)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Miembro no encontrado.
      </div>
    );

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
      {/* CABECERA */}
      <header className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b pb-6">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt={member.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-rowi-blueDay/60 shadow-md"
          />
        ) : (
          <UserCircle2 className="w-28 h-28 text-gray-400" />
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-rowi-blueDay">{member.name}</h1>
          <p className="text-gray-500 text-sm">{member.email}</p>
          <p className="text-sm text-gray-400 mt-2">
            Comunidad:{" "}
            <strong className="text-gray-700">
              {member.community || "—"}
            </strong>{" "}
            · Rol: {member.role || "member"}
          </p>
        </div>
      </header>

      {/* SNAPSHOTS */}
      {snapshots.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900/50 border rounded-xl p-10 text-center text-sm text-muted-foreground">
          No se encontraron evaluaciones SEI para este miembro.
        </div>
      ) : (
        snapshots.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-8 hover:shadow-lg transition-all duration-300"
          >
            {/* ENCABEZADO */}
            <div className="flex justify-between flex-wrap gap-2 items-center border-b pb-3">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-rowi-blueDay">
                <Brain className="w-5 h-5" />
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

            {/* GRID PRINCIPAL */}
            <div className="grid md:grid-cols-2 gap-8">
              <CardBlock title="Competencias Principales (K·C·G)">
                <Bar label="Know Yourself" value={s.K} />
                <Bar label="Choose Yourself" value={s.C} />
                <Bar label="Give Yourself" value={s.G} />
              </CardBlock>

              {s.subfactors?.length > 0 && (
                <CardBlock title="Subfactores SEI">
                  {s.subfactors.map((sf: any) => (
                    <Bar key={sf.key} label={sf.label || sf.key} value={sf.score} />
                  ))}
                </CardBlock>
              )}

              {s.outcomes?.length > 0 && (
                <CardBlock title="Resultados (Outcomes)">
                  {s.outcomes.map((o: any) => (
                    <Bar key={o.key} label={o.label || o.key} value={o.score} />
                  ))}
                </CardBlock>
              )}

              {s.success?.length > 0 && (
                <CardBlock title="Factores de Éxito">
                  {s.success.map((x: any) => (
                    <Bar key={x.key} label={x.label || x.key} value={x.score} />
                  ))}
                </CardBlock>
              )}

              {s.talents?.length > 0 && (
                <CardBlock title="Talentos del Cerebro">
                  {s.talents.map((t: any) => (
                    <Bar key={t.key} label={t.label || t.key} value={t.score} />
                  ))}
                </CardBlock>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* =========================================================
   🔹 COMPONENTES VISUALES
========================================================= */

function CardBlock({ title, children }: { title: string; children: any }) {
  return (
    <div className="bg-rowi-blueDay/5 border border-rowi-blueDay/10 rounded-xl p-5 shadow-sm hover:shadow-md transition space-y-3">
      <h3 className="text-sm font-semibold uppercase text-rowi-blueDay tracking-wide">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

/**
 * Barra SEI con escala 0–135 + nivel visible
 */
function Bar({ label, value }: { label: string; value?: number }) {
  if (value == null) return null;

  const min = 0;
  const max = 135;
  const normalized = Math.min(Math.max(value, min), max);
  const percent = ((normalized - min) / (max - min)) * 100;

  let level = "Desafío";
  let color = "#f87171"; // rojo
  if (value >= 120) {
    level = "Experto";
    color = "#60a5fa";
  } else if (value >= 100) {
    level = "Competente";
    color = "#4ade80";
  } else if (value >= 80) {
    level = "Desarrollo";
    color = "#fbbf24";
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-[11px] text-gray-500 font-semibold">
          {Math.round(value)}
        </span>
      </div>

      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        ></div>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white uppercase tracking-wider">
          {level}
        </span>
      </div>
    </div>
  );
}