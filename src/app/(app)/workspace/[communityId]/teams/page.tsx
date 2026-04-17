"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";

export default function WorkspaceTeamsPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [members, setMembers] = useState<any[] | null>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${communityId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => setMembers([]));
  }, [communityId]);

  if (!members) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  // Group by 'role' or fallback to country
  const groups: Record<string, any[]> = {};
  for (const m of members) {
    const g = m.role || m.country || t("workspace.teams.ungrouped", "Ungrouped");
    if (!groups[g]) groups[g] = [];
    groups[g].push(m);
  }

  const groupStats = Object.entries(groups).map(([name, items]) => {
    const withSei = items.filter((m) => m.snapshot?.overall4);
    const avg = withSei.length > 0
      ? withSei.reduce((a, m) => a + m.snapshot.overall4, 0) / withSei.length
      : null;
    return { name, count: items.length, withSei: withSei.length, avgEQ: avg };
  });

  return (
    <div className="min-h-screen py-6 px-4 max-w-6xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.modules.teams")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.teams.subtitle", "Sub-groups analytics within the workspace")}
        </p>
      </div>

      {groupStats.length === 0 || members.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-gray-500">{t("workspace.dashboard.noData.description")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupStats.map((g, i) => {
            const lvl = g.avgEQ ? getEqLevel(g.avgEQ) : null;
            return (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
              >
                <h3 className="font-semibold text-lg mb-2">{g.name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {g.count} {t("workspace.list.members")}
                  </span>
                  {g.avgEQ && lvl && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${lvl.color}20`,
                        color: lvl.color,
                      }}
                    >
                      EQ {Math.round(g.avgEQ)} · {lvl.label}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {g.withSei} / {g.count} {t("workspace.members.withSEI")}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
