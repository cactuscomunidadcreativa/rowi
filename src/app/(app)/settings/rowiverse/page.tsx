"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import { useSession } from "next-auth/react";

interface UserContribution {
  id: string;
  sourceType: string;
  eqTotal: number | null;
  K: number | null;
  C: number | null;
  G: number | null;
  country: string | null;
  region: string | null;
  status: string;
  createdAt: string;
}

interface RowiverseStats {
  totalContributions: number;
  bySource: Record<string, number>;
  byCountry: Array<{ country: string; count: number }>;
  lastContribution: string | null;
}

export default function RowiverseSettingsPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [contributeEnabled, setContributeEnabled] = useState<boolean | null>(null);
  const [userContributions, setUserContributions] = useState<UserContribution[]>([]);
  const [globalStats, setGlobalStats] = useState<RowiverseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar configuración del usuario
        const userRes = await fetch("/api/user/me");
        const userData = await userRes.json();
        setContributeEnabled(userData.user?.contributeToRowiverse ?? true);

        // Cargar estadísticas globales
        const statsRes = await fetch("/api/rowiverse/stats");
        const statsData = await statsRes.json();
        if (statsData.ok) {
          setGlobalStats(statsData.stats);
        }

        // Cargar contribuciones del usuario
        if (userData.user?.id) {
          const contribRes = await fetch(`/api/rowiverse/stats?userId=${userData.user.id}`);
          const contribData = await contribRes.json();
          if (contribData.ok) {
            setUserContributions(contribData.contributions || []);
          }
        }
      } catch (error) {
        console.error("Error loading RowiVerse settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Guardar cambios
  const handleToggle = async (newValue: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributeToRowiverse: newValue }),
      });

      if (res.ok) {
        setContributeEnabled(newValue);
      }
    } catch (error) {
      console.error("Error saving RowiVerse settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="space-y-4">
        <header className="rowi-card">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            {t("settings.rowiverse.title")}
          </h1>
        </header>
        <div className="rowi-card flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--rowi-primary)] border-t-transparent rounded-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      {/* Header */}
      <header className="rowi-card">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🌐</span>
          {t("settings.rowiverse.title")}
        </h1>
        <p className="rowi-muted text-sm mt-1">
          {t("settings.rowiverse.pageDescription")}
        </p>
      </header>

      {/* Opt-in/Opt-out Card */}
      <section className="rowi-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-lg mb-2">
              {t("settings.rowiverse.contribute.title")}
            </h2>
            <p className="text-sm rowi-muted mb-4">
              {t("settings.rowiverse.contribute.description")}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t("settings.rowiverse.contribute.benefit1")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t("settings.rowiverse.contribute.benefit2")}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{t("settings.rowiverse.contribute.benefit3")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => handleToggle(!contributeEnabled)}
              disabled={saving}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                contributeEnabled
                  ? "bg-[var(--rowi-primary)]"
                  : "bg-[var(--rowi-muted)]/30"
              } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  contributeEnabled ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-xs rowi-muted">
              {contributeEnabled
                ? t("settings.rowiverse.contribute.enabled")
                : t("settings.rowiverse.contribute.disabled")}
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 p-3 rounded-lg bg-[var(--rowi-muted)]/10 border border-[var(--rowi-card-border)]">
          <div className="flex items-start gap-2">
            <span className="text-lg">🔒</span>
            <div>
              <p className="text-sm font-medium">
                {t("settings.rowiverse.privacy.title")}
              </p>
              <p className="text-xs rowi-muted mt-1">
                {t("settings.rowiverse.privacy.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Stats */}
      {globalStats && (
        <section className="rowi-card">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span>📊</span>
            {t("settings.rowiverse.globalStats.title")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-[var(--rowi-primary)]/10">
              <p className="text-2xl font-bold text-[var(--rowi-primary)]">
                {globalStats.totalContributions.toLocaleString()}
              </p>
              <p className="text-xs rowi-muted">
                {t("settings.rowiverse.globalStats.totalContributions")}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--rowi-success)]/10">
              <p className="text-2xl font-bold text-[var(--rowi-success)]">
                {globalStats.byCountry.length}
              </p>
              <p className="text-xs rowi-muted">
                {t("settings.rowiverse.globalStats.countries")}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--rowi-warning)]/10">
              <p className="text-2xl font-bold text-[var(--rowi-warning)]">
                {Object.keys(globalStats.bySource).length}
              </p>
              <p className="text-xs rowi-muted">
                {t("settings.rowiverse.globalStats.sources")}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--rowi-info)]/10">
              <p className="text-sm font-bold text-[var(--rowi-info)]">
                {globalStats.lastContribution
                  ? new Date(globalStats.lastContribution).toLocaleDateString()
                  : "-"}
              </p>
              <p className="text-xs rowi-muted">
                {t("settings.rowiverse.globalStats.lastContribution")}
              </p>
            </div>
          </div>

          {/* Top Countries */}
          {globalStats.byCountry.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                {t("settings.rowiverse.globalStats.topCountries")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {globalStats.byCountry.slice(0, 5).map((item) => (
                  <span
                    key={item.country}
                    className="px-2 py-1 text-xs rounded-full bg-[var(--rowi-muted)]/10"
                  >
                    {item.country}: {item.count.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Your Contributions */}
      <section className="rowi-card">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>📝</span>
          {t("settings.rowiverse.yourContributions.title")}
        </h2>

        {userContributions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🌱</p>
            <p className="rowi-muted text-sm">
              {t("settings.rowiverse.yourContributions.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm rowi-muted mb-3">
              {t("settings.rowiverse.yourContributions.count").replace(
                "{{count}}",
                String(userContributions.length)
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {userContributions.slice(0, 10).map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--rowi-muted)]/5 border border-[var(--rowi-card-border)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {contribution.sourceType === "csv_upload"
                        ? "📄"
                        : contribution.sourceType === "registration"
                        ? "👤"
                        : "📊"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {contribution.sourceType === "csv_upload"
                          ? t("settings.rowiverse.yourContributions.csvUpload")
                          : contribution.sourceType === "registration"
                          ? t("settings.rowiverse.yourContributions.registration")
                          : t("settings.rowiverse.yourContributions.eqSnapshot")}
                      </p>
                      <p className="text-xs rowi-muted">
                        {new Date(contribution.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {contribution.eqTotal && (
                      <p className="text-sm font-semibold text-[var(--rowi-primary)]">
                        EQ: {contribution.eqTotal}
                      </p>
                    )}
                    <p className="text-xs rowi-muted">{contribution.country || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Back Button */}
      <div className="pt-2">
        <a
          href="/settings"
          className="text-sm text-[var(--rowi-primary)] hover:underline"
        >
          ← {t("common.back")}
        </a>
      </div>
    </main>
  );
}
