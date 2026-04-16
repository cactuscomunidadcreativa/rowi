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
const LEVEL_LABELS: Record<string, { es: string; en: string; pt: string; it: string }> = {
  desafio: { es: "Desafío", en: "Challenge", pt: "Desafio", it: "Sfida" },
  emergente: { es: "Emergente", en: "Emerging", pt: "Emergente", it: "Emergente" },
  funcional: { es: "Funcional", en: "Functional", pt: "Funcional", it: "Funzionale" },
  diestro: { es: "Diestro", en: "Skilled", pt: "Habilidoso", it: "Abile" },
  experto: { es: "Experto", en: "Expert", pt: "Especialista", it: "Esperto" },
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
const COMPETENCY_INFO: Record<string, { name: { es: string; en: string; pt: string; it: string }; definition: { es: string; en: string; pt: string; it: string } }> = {
  EL: {
    name: { es: "Alfabetización Emocional", en: "Emotional Literacy", pt: "Alfabetização Emocional", it: "Alfabetizzazione Emotiva" },
    definition: {
      es: "Identificar y nombrar las emociones propias y ajenas con precisión",
      en: "Accurately identifying and naming your own and others' emotions",
      pt: "Identificar e nomear as emoções próprias e alheias com precisão",
      it: "Identificare e nominare con precisione le proprie emozioni e quelle degli altri"
    },
  },
  RP: {
    name: { es: "Reconocer Patrones", en: "Recognize Patterns", pt: "Reconhecer Padrões", it: "Riconoscere Pattern" },
    definition: {
      es: "Identificar patrones recurrentes en tus reacciones emocionales",
      en: "Identifying recurring patterns in your emotional reactions",
      pt: "Identificar padrões recorrentes em suas reações emocionais",
      it: "Identificare pattern ricorrenti nelle tue reazioni emotive"
    },
  },
  ACT: {
    name: { es: "Aplicar Pensamiento Consecuente", en: "Apply Consequential Thinking", pt: "Aplicar Pensamento Consequente", it: "Applicare il Pensiero Consequenziale" },
    definition: {
      es: "Evaluar los costos y beneficios de tus decisiones",
      en: "Evaluating the costs and benefits of your choices",
      pt: "Avaliar os custos e benefícios das suas decisões",
      it: "Valutare i costi e i benefici delle tue decisioni"
    },
  },
  NE: {
    name: { es: "Navegar Emociones", en: "Navigate Emotions", pt: "Navegar Emoções", it: "Navigare le Emozioni" },
    definition: {
      es: "Regular y transformar las emociones como recurso estratégico",
      en: "Regulating and transforming emotions as a strategic resource",
      pt: "Regular e transformar as emoções como recurso estratégico",
      it: "Regolare e trasformare le emozioni come risorsa strategica"
    },
  },
  IM: {
    name: { es: "Motivación Intrínseca", en: "Intrinsic Motivation", pt: "Motivação Intrínseca", it: "Motivazione Intrinseca" },
    definition: {
      es: "Conectar con tus motivaciones internas para la acción sostenida",
      en: "Connecting with internal drivers for sustained action",
      pt: "Conectar-se com suas motivações internas para a ação sustentada",
      it: "Connettersi con le tue motivazioni interne per un'azione sostenuta"
    },
  },
  OP: {
    name: { es: "Ejercitar el Optimismo", en: "Exercise Optimism", pt: "Exercer o Otimismo", it: "Esercitare l'Ottimismo" },
    definition: {
      es: "Mantener una perspectiva esperanzadora y proactiva ante los desafíos",
      en: "Maintaining a hopeful, proactive outlook when facing challenges",
      pt: "Manter uma perspectiva esperançosa e proativa diante dos desafios",
      it: "Mantenere una prospettiva speranzosa e proattiva di fronte alle sfide"
    },
  },
  EMP: {
    name: { es: "Empatía", en: "Empathy", pt: "Empatia", it: "Empatia" },
    definition: {
      es: "Comprender y conectar con las emociones de los demás",
      en: "Understanding and connecting with others' emotions",
      pt: "Compreender e conectar-se com as emoções dos outros",
      it: "Comprendere e connettersi con le emozioni degli altri"
    },
  },
  NG: {
    name: { es: "Perseguir Metas Nobles", en: "Pursue Noble Goals", pt: "Perseguir Metas Nobres", it: "Perseguire Obiettivi Nobili" },
    definition: {
      es: "Alinear tus acciones con un propósito más allá de ti mismo",
      en: "Aligning your actions with a purpose beyond yourself",
      pt: "Alinhar suas ações com um propósito além de si mesmo",
      it: "Allineare le tue azioni con uno scopo al di là di te stesso"
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
  const levelLabel = LEVEL_LABELS[level.key]?.[lang as "es" | "en" | "pt" | "it"] ?? level.label;

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
        <p>{lang === "es" ? "No hay datos para mostrar." : lang === "pt" ? "Não há dados para exibir." : lang === "it" ? "Nessun dato da mostrare." : "No data to display."}</p>
      </div>
    );
  }

  const CURRENT_WORD = { es: "Actual", en: "Current", pt: "Atual", it: "Attuale" };
  const PREVIOUS_WORD = { es: "Anterior", en: "Previous", pt: "Anterior", it: "Precedente" };
  const cur = CURRENT_WORD[lang as keyof typeof CURRENT_WORD] ?? CURRENT_WORD.en;
  const prv = PREVIOUS_WORD[lang as keyof typeof PREVIOUS_WORD] ?? PREVIOUS_WORD.en;
  const presentLabel = `${cur}${datePresent ? ` · ${datePresent}` : ""}`;
  const compareLabel = `${prv}${dateCompare ? ` · ${dateCompare}` : ""}`;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-2">
        {hasPresent && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#E53935" }} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{presentLabel}</span>
          </div>
        )}
        {hasCompare && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#31A2E3" }} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{compareLabel}</span>
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 310 }}>
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

            {/* Presente */}
            {hasPresent && (
              <Radar
                name={presentLabel}
                dataKey="present"
                stroke="#E53935"
                strokeWidth={2}
                fill="#E53935"
                fillOpacity={0.25}
              />
            )}

            {/* Comparación */}
            {hasCompare && (
              <Radar
                name={compareLabel}
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
    </div>
  );
}