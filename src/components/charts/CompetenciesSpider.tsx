"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   📊 Niveles traducidos
========================================================= */
const LEVEL_LABELS: Record<string, { es: string; en: string }> = {
  desafio: { es: "Desafío", en: "Challenge" },
  emergente: { es: "Emergente", en: "Emerging" },
  funcional: { es: "Funcional", en: "Functional" },
  diestro: { es: "Diestro", en: "Skilled" },
  experto: { es: "Experto", en: "Expert" },
};

/* =========================================================
   🎨 Paleta SEI (8 competencias)
   - Azul → Know Yourself (EL, RP)
   - Rojo → Choose Yourself (ACT, NE, IM, OP)
   - Verde → Give Yourself (EMP, NG)
========================================================= */
const COLOR_SEI: Record<string, string> = {
  EL: "#1E88E5", // Azul - Emotional Literacy
  RP: "#42A5F5", // Azul - Recognize Patterns
  ACT: "#E53935", // Rojo - Consequential Thinking
  NE: "#F4511E", // Rojo - Navigate Emotions
  IM: "#F44336", // Rojo - Intrinsic Motivation
  OP: "#EF5350", // Rojo - Optimism
  EMP: "#43A047", // Verde - Empathy
  NG: "#388E3C", // Verde - Noble Goals
};

/* =========================================================
   📖 Definiciones de las competencias SEI
========================================================= */
const COMPETENCY_INFO: Record<string, { name: { es: string; en: string }; definition: { es: string; en: string } }> = {
  EL: {
    name: { es: "Alfabetización Emocional", en: "Emotional Literacy" },
    definition: {
      es: "Identificar y nombrar las emociones propias y ajenas con precisión",
      en: "Accurately identifying and naming your own and others' emotions"
    },
  },
  RP: {
    name: { es: "Reconocer Patrones", en: "Recognize Patterns" },
    definition: {
      es: "Identificar patrones recurrentes en tus reacciones emocionales",
      en: "Identifying recurring patterns in your emotional reactions"
    },
  },
  ACT: {
    name: { es: "Aplicar Pensamiento Consecuente", en: "Apply Consequential Thinking" },
    definition: {
      es: "Evaluar los costos y beneficios de tus decisiones",
      en: "Evaluating the costs and benefits of your choices"
    },
  },
  NE: {
    name: { es: "Navegar Emociones", en: "Navigate Emotions" },
    definition: {
      es: "Regular y transformar las emociones como recurso estratégico",
      en: "Regulating and transforming emotions as a strategic resource"
    },
  },
  IM: {
    name: { es: "Motivación Intrínseca", en: "Intrinsic Motivation" },
    definition: {
      es: "Conectar con tus motivaciones internas para la acción sostenida",
      en: "Connecting with internal drivers for sustained action"
    },
  },
  OP: {
    name: { es: "Ejercitar el Optimismo", en: "Exercise Optimism" },
    definition: {
      es: "Mantener una perspectiva esperanzadora y proactiva ante los desafíos",
      en: "Maintaining a hopeful, proactive outlook when facing challenges"
    },
  },
  EMP: {
    name: { es: "Empatía", en: "Empathy" },
    definition: {
      es: "Comprender y conectar con las emociones de los demás",
      en: "Understanding and connecting with others' emotions"
    },
  },
  NG: {
    name: { es: "Perseguir Metas Nobles", en: "Pursue Noble Goals" },
    definition: {
      es: "Alinear tus acciones con un propósito más allá de ti mismo",
      en: "Aligning your actions with a purpose beyond yourself"
    },
  },
};

/* =========================================================
   🎯 Tooltip personalizado con nivel
========================================================= */
function CustomTooltip({ active, payload, lang }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const key = data.k as string;
  const score = data.present as number | null;
  const info = COMPETENCY_INFO[key];
  if (!info) return null;

  const name = info.name[lang as keyof typeof info.name] ?? info.name.en;
  const definition = info.definition[lang as keyof typeof info.definition] ?? info.definition.en;

  // Obtener nivel
  const level = getEqLevel(score ?? 0);
  const levelLabel = LEVEL_LABELS[level.key]?.[lang as "es" | "en"] ?? level.label;

  return (
    <div className="bg-black/90 backdrop-blur-sm rounded-xl p-3 max-w-xs shadow-xl border border-white/10">
      {/* Nombre de la competencia */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: COLOR_SEI[key] }}
        />
        <span className="font-semibold text-white text-sm">{name}</span>
      </div>

      {/* Nivel actual */}
      {score != null && (
        <div
          className="inline-flex items-center gap-2 px-2 py-1 rounded-lg mb-2"
          style={{ backgroundColor: `${level.color}20` }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: level.color }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: level.color }}
          >
            {levelLabel}
          </span>
        </div>
      )}

      {/* Definición */}
      <p className="text-gray-400 text-xs leading-relaxed">{definition}</p>
    </div>
  );
}

/* =========================================================
   🧠 Componente principal
========================================================= */
export default function CompetenciesSpider({
  comps,
  compare,
  datePresent,
  dateCompare,
  max = EQ_MAX,
}: {
  comps: Partial<Record<string, number | null>>;
  compare?: Partial<Record<string, number | null>> | null;
  datePresent?: string | null;
  dateCompare?: string | null;
  max?: number;
}) {
  const { lang } = useI18n();
  const keys = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

  const data = keys.map((k) => ({
    k,
    present: comps?.[k] ?? null,
    other: compare?.[k] ?? null,
  }));

  const hasPresent = Object.values(comps || {}).some(
    (v) => typeof v === "number" && v > 0
  );

  const hasCompare =
    compare &&
    Object.values(compare).some(
      (v) =>
        typeof v === "number" &&
        !isNaN(v) &&
        v !== null &&
        v !== 0 &&
        v > 0
    );

  if (!hasPresent && !hasCompare) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-400 border rounded-xl">
        <p>{lang === "es" ? "No hay datos para mostrar." : "No data to display."}</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#9AA0A6" strokeOpacity={0.25} />
          <PolarAngleAxis
            dataKey="k"
            tick={(props: any) => {
              const { x, y, payload } = props;
              const k = payload?.value as string;
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLOR_SEI[k] ?? "#ccc"}
                  fontWeight={600}
                  fontSize={13}
                >
                  {k}
                </text>
              );
            }}
          />
          {/* Sin números en el eje radial */}
          <PolarRadiusAxis domain={[65, max]} tick={false} axisLine={false} />

          {/* Tooltip con nombre y definición */}
          <Tooltip content={<CustomTooltip lang={lang} />} />

          {/* 🎯 Presente */}
          {hasPresent && (
            <Radar
              name={`Actual${datePresent ? ` · ${datePresent}` : ""}`}
              dataKey="present"
              stroke="#E53935"
              strokeWidth={2}
              fill="#E53935"
              fillOpacity={0.25}
            />
          )}

          {/* 🔁 Comparación */}
          {hasCompare && (
            <Radar
              name={`Comparación${dateCompare ? ` · ${dateCompare}` : ""}`}
              dataKey="other"
              stroke="#31A2E3"
              strokeWidth={2}
              fill="#31A2E3"
              fillOpacity={0.15}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}