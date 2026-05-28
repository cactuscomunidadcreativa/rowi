"use client";

import { Microscope } from "lucide-react";
import AgentChatPage from "@/components/rowi/AgentChatPage";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ResearchChatPage() {
  const { t } = useI18n();
  return (
    <AgentChatPage
      intent="research"
      Icon={Microscope}
      title={t("agents.research.title", "Rowi Investigación")}
      subtitle={t(
        "agents.research.subtitle",
        "Analiza correlaciones VS/SEI y calibración BE2GROW conversando",
      )}
      starters={[
        t(
          "agents.research.s1",
          "¿Qué correlaciones VS internas son más fuertes y qué podrían significar?",
        ),
        t(
          "agents.research.s2",
          "¿Qué N necesito para que una correlación VS↔SEI a nivel cohorte sea significativa?",
        ),
      ]}
    />
  );
}
