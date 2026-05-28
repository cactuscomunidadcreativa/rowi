"use client";

import { Briefcase } from "lucide-react";
import AgentChatPage from "@/components/rowi/AgentChatPage";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function VentasPage() {
  const { t } = useI18n();
  return (
    <AgentChatPage
      intent="sales"
      Icon={Briefcase}
      title={t("agents.ventas.title", "Rowi Ventas")}
      subtitle={t(
        "agents.ventas.subtitle",
        "Consultor comercial Six Seconds — del problema del cliente a la propuesta",
      )}
      intro={[
        t("agents.ventas.m1", "Clarificar"),
        t("agents.ventas.m2", "Iceberg"),
        t("agents.ventas.m3", "Diseño EAR"),
        t("agents.ventas.m4", "3 opciones"),
        t("agents.ventas.m5", "Propuesta"),
      ]}
      starters={[
        t(
          "agents.ventas.s1",
          "Tengo un prospecto de RR.HH. en una empresa de servicios con baja colaboración entre equipos híbridos.",
        ),
        t(
          "agents.ventas.s2",
          "Un cliente quiere desarrollar a sus mandos medios pero no sabe por dónde empezar.",
        ),
      ]}
    />
  );
}
