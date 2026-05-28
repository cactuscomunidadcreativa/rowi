"use client";

import { Compass } from "lucide-react";
import AgentChatPage from "@/components/rowi/AgentChatPage";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function AsesorPage() {
  const { t } = useI18n();
  return (
    <AgentChatPage
      intent="asesor"
      Icon={Compass}
      title={t("agents.asesor.title", "Rowi Asesor")}
      subtitle={t(
        "agents.asesor.subtitle",
        "Consultor de implementación Six Seconds — diseña, entrega y sostiene programas",
      )}
      starters={[
        t(
          "agents.asesor.s1",
          "Tengo que diseñar un programa de liderazgo EQ de 6 meses para 40 managers.",
        ),
        t(
          "agents.asesor.s2",
          "¿Cómo mido el impacto de una intervención de cultura con Vital Signs?",
        ),
      ]}
    />
  );
}
