"use client";

import { Suspense } from "react";
import HubRolesClient from "./roles-client"; // 👈 referencia al archivo separado
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function HubRolesPageWrapper() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">{t("admin.roles.loading", "Cargando roles...")}</div>}>
      <HubRolesClient />
    </Suspense>
  );
}