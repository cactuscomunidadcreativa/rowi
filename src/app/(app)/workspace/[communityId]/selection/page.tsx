"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Loader2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";

const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

export default function WorkspaceSelectionPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [members, setMembers] = useState<any[] | null>(null);
  const [targetProfile, setTargetProfile] = useState<Record<string, number>>({
    EL: 110, RP: 110, ACT: 115, NE: 110, IM: 115, OP: 110, EMP: 105, NG: 115,
  });

  useEffect(() => {
    fetch(`/api/workspaces/${communityId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members?.filter((m: any) => m.snapshot) || []))
      .catch(() => setMembers([]));
  }, [communityId]);

  // Compute fit score for each member vs target
  const scored = (members || []).map((m) => {
    const comps: any = m.snapshot || {};
    let totalDelta = 0;
    let count = 0;
    for (const k of COMPETENCIES) {
      const target = targetProfile[k];
      const actual = comps[k];
      if (actual != null && target != null) {
        // Fit: penalize if below target, less if above
        const delta = actual - target;
        const penalty = delta < 0 ? Math.abs(delta) * 2 : Math.abs(delta) * 0.5;
        totalDelta += penalty;
        count++;
      }
    }
    const avgPenalty = count > 0 ? totalDelta / count : 999;
    const fit = Math.max(0, Math.min(100, 100 - avgPenalty));
    return { ...m, fit: Math.round(fit) };
  });

  const ranked = [...scored].sort((a, b) => b.fit - a.fit);

  if (!members) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

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
          <Target className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.modules.selection")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.selection.subtitle", "Rank candidates against an ideal profile")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Target Profile */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--rowi-g2)]" />
            {t("workspace.selection.idealProfile", "Ideal Profile")}
          </h3>
          <div className="space-y-3">
            {COMPETENCIES.map((c) => (
              <div key={c}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c}</span>
                  <span className="text-gray-500">{targetProfile[c]}</span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={135}
                  value={targetProfile[c]}
                  onChange={(e) =>
                    setTargetProfile((p) => ({ ...p, [c]: Number(e.target.value) }))
                  }
                  className="w-full accent-[var(--rowi-g2)]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ranking */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-3">
            {t("workspace.selection.ranking", "Candidate Ranking")} ({ranked.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {ranked.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {t("workspace.dashboard.noData.description")}
              </p>
            ) : (
              ranked.map((m, i) => {
                const fitColor =
                  m.fit >= 80 ? "#10b981" : m.fit >= 60 ? "#f59e0b" : "#ef4444";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: `${fitColor}20`,
                        color: fitColor,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{m.name}</p>
                      {m.snapshot?.overall4 && (
                        <p className="text-xs text-gray-500">
                          EQ: {Math.round(m.snapshot.overall4)}{" "}
                          {m.brainStyle && `• ${m.brainStyle}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className="text-lg font-bold"
                        style={{ color: fitColor }}
                      >
                        {m.fit}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {t("workspace.selection.fit", "fit")}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
