"use client";

import { useI18n } from "@/lib/i18n/useI18n";
import OutcomeCard from "./OutcomeCard";

export default function OutcomesPanel({
  present,
}: {
  present: any;
  compare?: any | null;
}) {
  const { t } = useI18n();

  // Extraer los 4 outcomes principales
  const outcomes = [
    {
      key: "effectiveness",
      title: t("outcomes.effectiveness") || "Effectiveness",
      score: present?.effectiveness?.score ?? null,
    },
    {
      key: "relationships",
      title: t("outcomes.relationships") || "Relationships",
      score: present?.relationships?.score ?? null,
    },
    {
      key: "wellbeing",
      title: t("outcomes.wellbeing") || "Wellbeing",
      score: present?.wellbeing?.score ?? null,
    },
    {
      key: "qualityOfLife",
      title: t("outcomes.qualityOfLife") || "Quality of Life",
      score: present?.qualityOfLife?.score ?? null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {outcomes.map((o) => (
        <OutcomeCard key={o.key} title={o.title} score={o.score} />
      ))}
    </div>
  );
}
