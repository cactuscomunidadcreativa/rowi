"use client";

import { useI18n } from "@/lib/i18n/react";
import OutcomeCard from "./OutcomeCard";

export default function OutcomesPanel({
  present,
  compare,
}: {
  present: any;
  compare?: any | null;
}) {
  const { t } = useI18n();

  /* ============================================================
     1) SUCCESS FACTORS (Influence, Decision Making, etc.)
     ============================================================ */
  const success = present?.success ?? [];

  const findSuccess = (label: string) =>
    success.find((s: any) => s.key?.toLowerCase() === label.toLowerCase())
      ?.score ?? null;

  /* ============================================================
     2) MERGE PRESENT + SUCCESS
     ============================================================ */
  const P = {
    effectiveness: {
      score: present?.effectiveness?.score ?? null,
      influence:
        present?.effectiveness?.influence ?? findSuccess("Influence"),
      decisionMaking:
        present?.effectiveness?.decisionMaking ??
        findSuccess("Decision Making"),
    },

    relationships: {
      score: present?.relationships?.score ?? null,
      community:
        present?.relationships?.community ?? findSuccess("Community"),
      network:
        present?.relationships?.network ?? findSuccess("Network"),
    },

    wellbeing: {
      score: present?.wellbeing?.score ?? null,
      balance: present?.wellbeing?.balance ?? findSuccess("Balance"),
      health: present?.wellbeing?.health ?? findSuccess("Health"),
    },

    qualityOfLife: {
      score: present?.qualityOfLife?.score ?? null,
      achievement:
        present?.qualityOfLife?.achievement ?? findSuccess("Achievement"),
      satisfaction:
        present?.qualityOfLife?.satisfaction ?? findSuccess("Satisfaction"),
    },
  };

  /* ============================================================
     3) COMPARACIÓN (ghost)
     ============================================================ */
  const successGhost = compare?.success ?? [];

  const findSuccessGhost = (label: string) =>
    successGhost.find(
      (s: any) => s.key?.toLowerCase() === label.toLowerCase()
    )?.score ?? null;

  const C = compare
    ? {
        effectiveness: {
          score: compare?.effectiveness?.score ?? null,
          influence:
            compare?.effectiveness?.influence ??
            findSuccessGhost("Influence"),
          decisionMaking:
            compare?.effectiveness?.decisionMaking ??
            findSuccessGhost("Decision Making"),
        },

        relationships: {
          score: compare?.relationships?.score ?? null,
          community:
            compare?.relationships?.community ??
            findSuccessGhost("Community"),
          network:
            compare?.relationships?.network ??
            findSuccessGhost("Network"),
        },

        wellbeing: {
          score: compare?.wellbeing?.score ?? null,
          balance:
            compare?.wellbeing?.balance ?? findSuccessGhost("Balance"),
          health:
            compare?.wellbeing?.health ?? findSuccessGhost("Health"),
        },

        qualityOfLife: {
          score: compare?.qualityOfLife?.score ?? null,
          achievement:
            compare?.qualityOfLife?.achievement ??
            findSuccessGhost("Achievement"),
          satisfaction:
            compare?.qualityOfLife?.satisfaction ??
            findSuccessGhost("Satisfaction"),
        },
      }
    : null;

  /* ============================================================
     4) RENDER FINAL
     ============================================================ */
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* EFFECTIVENESS */}
      <OutcomeCard
        title={t("outcomes.effectiveness") || "Effectiveness"}
        score={P.effectiveness.score}
        subs={[
          {
            label: t("outcomes.influence") || "Influence",
            value: P.effectiveness.influence,
          },
          {
            label: t("outcomes.decisionMaking") || "Decision Making",
            value: P.effectiveness.decisionMaking,
          },
        ]}
        ghost={
          C
            ? {
                score: C.effectiveness.score,
                subs: [
                  {
                    label: t("outcomes.influence") || "Influence",
                    value: C.effectiveness.influence,
                  },
                  {
                    label: t("outcomes.decisionMaking") || "Decision Making",
                    value: C.effectiveness.decisionMaking,
                  },
                ],
              }
            : null
        }
      />

      {/* RELATIONSHIPS */}
      <OutcomeCard
        title={t("outcomes.relationships") || "Relationships"}
        score={P.relationships.score}
        subs={[
          {
            label: t("outcomes.community") || "Community",
            value: P.relationships.community,
          },
          {
            label: t("outcomes.network") || "Network",
            value: P.relationships.network,
          },
        ]}
        ghost={
          C
            ? {
                score: C.relationships.score,
                subs: [
                  {
                    label: t("outcomes.community") || "Community",
                    value: C.relationships.community,
                  },
                  {
                    label: t("outcomes.network") || "Network",
                    value: C.relationships.network,
                  },
                ],
              }
            : null
        }
      />

      {/* WELLBEING */}
      <OutcomeCard
        title={t("outcomes.wellbeing") || "Wellbeing"}
        score={P.wellbeing.score}
        subs={[
          {
            label: t("outcomes.balance") || "Balance",
            value: P.wellbeing.balance,
          },
          {
            label: t("outcomes.health") || "Health",
            value: P.wellbeing.health,
          },
        ]}
        ghost={
          C
            ? {
                score: C.wellbeing.score,
                subs: [
                  {
                    label: t("outcomes.balance") || "Balance",
                    value: C.wellbeing.balance,
                  },
                  {
                    label: t("outcomes.health") || "Health",
                    value: C.wellbeing.health,
                  },
                ],
              }
            : null
        }
      />

      {/* QUALITY OF LIFE */}
      <OutcomeCard
        title={t("outcomes.qualityOfLife") || "Quality of Life"}
        score={P.qualityOfLife.score}
        subs={[
          {
            label: t("outcomes.achievement") || "Achievement",
            value: P.qualityOfLife.achievement,
          },
          {
            label: t("outcomes.satisfaction") || "Satisfaction",
            value: P.qualityOfLife.satisfaction,
          },
        ]}
        ghost={
          C
            ? {
                score: C.qualityOfLife.score,
                subs: [
                  {
                    label: t("outcomes.achievement") || "Achievement",
                    value: C.qualityOfLife.achievement,
                  },
                  {
                    label: t("outcomes.satisfaction") || "Satisfaction",
                    value: C.qualityOfLife.satisfaction,
                  },
                ],
              }
            : null
        }
      />
    </div>
  );
}