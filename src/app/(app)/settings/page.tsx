"use client";

import { useI18n } from "@/lib/i18n/react";

export default function SettingsIndex() {
  const { t } = useI18n();

  return (
    <main className="space-y-4">
      <header className="rowi-card">
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="rowi-muted text-sm">{t("settings.chooseSection")}</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/settings/profile" className="rowi-card">
          <div className="font-medium">{t("settings.profile")}</div>
          <div className="rowi-muted text-sm">{t("settings.editProfile")}</div>
        </a>
        <a href="/settings/invites" className="rowi-card">
          <div className="font-medium">{t("settings.invites")}</div>
          <div className="rowi-muted text-sm">{t("settings.manageInvites")}</div>
        </a>
        <a href="/settings/rowiverse" className="rowi-card border-[var(--rowi-primary)]/30">
          <div className="font-medium flex items-center gap-2">
            <span className="text-lg">🌐</span>
            {t("settings.rowiverse.title")}
          </div>
          <div className="rowi-muted text-sm">{t("settings.rowiverse.description")}</div>
        </a>
      </section>
    </main>
  );
}
