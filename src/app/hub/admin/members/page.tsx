"use client";
import { Suspense } from "react";
import HubMembersClient from "./members-client"; // 👈 referencia al archivo separado
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function HubMembersPageWrapper() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">{t("admin.members.loading", "Cargando miembros...")}</div>}>
      <HubMembersClient />
    </Suspense>
  );
}