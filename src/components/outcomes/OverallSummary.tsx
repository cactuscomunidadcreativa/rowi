"use client";

import { useI18n } from "@/lib/i18n/react";
import { getEqLevel, EQ_MAX } from "@/domains/eq/lib/eqLevels";

type Props = {
  overall4: number | null;
  notes?: string[]; // Ejemplo: ["Fortaleza: Relationships", "Atención: Wellbeing"]
};

export default function OverallSummary({ overall4, notes }: Props) {
  const { t } = useI18n();
  const value = overall4 ?? null;
  const lvl = getEqLevel(value ?? 0);

  // Mensajes por nivel (ya internacionalizados)
  const messages: Record<string, string> = {
    desafio:
      t("rowi.levelMsg.desafio") ||
      "Nivel inicial: oportunidad para fortalecer habilidades clave.",
    emergente:
      t("rowi.levelMsg.emergente") ||
      "Comienzas a aplicar la inteligencia emocional en la práctica.",
    funcional:
      t("rowi.levelMsg.funcional") ||
      "Aplicación estable y consistente: buen equilibrio personal y profesional.",
    diestro:
      t("rowi.levelMsg.diestro") ||
      "Liderazgo emocional consciente, enfocado en impacto y colaboración.",
    experto:
      t("rowi.levelMsg.experto") ||
      "Maestría emocional: generas transformación en ti y en otros.",
  };

  const message = messages[lvl.key ?? "funcional"];

  return (
    <div className="rounded-xl border p-4 shadow-sm flex flex-col gap-3 text-center">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {t("rowi.overallTitle") || "Overall 4 Outcomes"}
        </span>
        <span className="text-xl font-semibold" style={{ color: lvl.color }}>
          {value != null ? value : "—"}
          <span className="text-sm text-gray-400"> / {EQ_MAX}</span>
        </span>
      </div>

      {/* Nivel */}
      <div className="text-sm font-medium" style={{ color: lvl.color }}>
        {t(`rowi.level.${lvl.key}`) || lvl.label}
      </div>

      {/* Mensaje o notas */}
      {notes?.length ? (
        <ul className="list-disc list-inside text-xs text-gray-500 text-left space-y-1">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-gray-500">{message}</div>
      )}
    </div>
  );
}