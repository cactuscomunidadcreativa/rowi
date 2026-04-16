"use client";

import { Suspense } from "react";
import HubRolesClient from "./roles-client"; // 👈 referencia al archivo separado
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function HubRolesPageWrapper() {
  const { lang } = useI18n();
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">{lang === "es" ? "Cargando roles..." : lang === "pt" ? "Carregando funções..." : lang === "it" ? "Caricamento ruoli..." : "Loading roles..."}</div>}>
      <HubRolesClient />
    </Suspense>
  );
}