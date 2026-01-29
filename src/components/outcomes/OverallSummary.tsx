"use client";

import { useI18n } from "@/lib/i18n/useI18n";
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
    <div className="h-full flex flex-col items-center justify-center text-center">
      {/* Nivel prominente */}
      <div
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl mb-3"
        style={{ backgroundColor: `${lvl.color}15` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: lvl.color }}
        />
        <span
          className="text-xl font-bold"
          style={{ color: lvl.color }}
        >
          {t(`rowi.level.${lvl.key}`) || lvl.label}
        </span>
      </div>

      {/* Mensaje descriptivo */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        {message}
      </p>

      {/* Notas adicionales */}
      {notes?.length ? (
        <ul className="mt-3 list-disc list-inside text-xs text-gray-500 text-left space-y-1">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}