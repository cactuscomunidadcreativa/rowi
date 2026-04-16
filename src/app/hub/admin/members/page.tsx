"use client";
import { Suspense } from "react";
import HubMembersClient from "./members-client"; // 👈 referencia al archivo separado
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function HubMembersPageWrapper() {
  const { lang } = useI18n();
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">{lang === "es" ? "Cargando miembros..." : lang === "pt" ? "Carregando membros..." : lang === "it" ? "Caricamento membri..." : "Loading members..."}</div>}>
      <HubMembersClient />
    </Suspense>
  );
}