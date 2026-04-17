"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceAlertsPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<any[] | null>(null);

  async function load() {
    const res = await fetch(`/api/workspaces/${communityId}/alerts`);
    const data = await res.json();
    setAlerts(data.alerts || []);
  }

  useEffect(() => {
    load();
  }, [communityId]);

  async function act(alertId: string, action: "resolve" | "dismiss") {
    await fetch(`/api/workspaces/${communityId}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, action }),
    });
    await load();
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-4xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bell className="w-7 h-7 text-orange-500" />
          {t("workspace.modules.alerts")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.alerts.subtitle", "Smart AI alerts for EQ drops, mood patterns, anomalies")}
        </p>
      </div>

      {alerts === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <Check className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("workspace.alerts.empty", "No active alerts - all good!")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const severity =
              a.severity === "critical" ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
              a.severity === "warning" ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" :
              "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border-l-4 ${severity} p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{a.message}</p>
                      {a.actionSuggestion && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          💡 {a.actionSuggestion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => act(a.id, "resolve")}
                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                      title={t("workspace.alerts.resolve", "Resolve")}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => act(a.id, "dismiss")}
                      className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                      title={t("workspace.alerts.dismiss", "Dismiss")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
