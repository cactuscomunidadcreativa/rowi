"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Plus, Loader2, Sparkles, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspacePlansPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [plans, setPlans] = useState<any[] | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [plansRes, membersRes] = await Promise.all([
      fetch(`/api/workspaces/${communityId}/plans`).then((r) => r.json()),
      fetch(`/api/workspaces/${communityId}/members`).then((r) => r.json()),
    ]);
    setPlans(plansRes.plans || []);
    setMembers(membersRes.members || []);
  }

  useEffect(() => {
    load();
  }, [communityId]);

  async function createPlan() {
    if (!memberId || !title.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${communityId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, title: title.trim(), description: description.trim(), goals: [] }),
      });
      setShowForm(false);
      setTitle("");
      setDescription("");
      setMemberId("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function generateAI(targetMemberId: string) {
    const member = members.find((m) => m.id === targetMemberId);
    if (!member || !member.snapshot) return;

    setSaving(true);
    try {
      // Derive strengths and gaps from SEI
      const comps = member.snapshot;
      const all = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
      const strengths = all.filter((k) => comps[k] != null && comps[k] >= 115);
      const gaps = all.filter((k) => comps[k] != null && comps[k] < 100);

      const goals = gaps.slice(0, 3).map((g) => ({
        competency: g,
        target: 105,
        description: `Improve ${g} from ${comps[g]} to 105+`,
      }));

      await fetch(`/api/workspaces/${communityId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: targetMemberId,
          title: `Development plan for ${member.name}`,
          description: `Auto-generated plan based on SEI profile`,
          goals,
          strengths,
          gaps,
          aiGenerated: true,
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-5xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-purple-500" />
            {t("workspace.modules.plans")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("workspace.plans.subtitle", "Development plans for each member")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          {t("workspace.plans.new", "New plan")}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 space-y-3"
        >
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            <option value="">{t("workspace.plans.selectMember", "Select member")}...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("workspace.plans.titlePlaceholder", "Plan title")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("workspace.plans.descriptionPlaceholder", "Description")}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setMemberId("");
                setTitle("");
                setDescription("");
              }}
              className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              onClick={createPlan}
              disabled={!memberId || !title.trim() || saving}
              className="px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("workspace.plans.create", "Create plan")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Members with SEI but no plan - quick AI gen */}
      {members.filter((m) => m.snapshot && !plans?.some((p) => p.memberId === m.id)).length > 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-200 dark:border-violet-900 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            {t("workspace.plans.aiGenerate", "Auto-generate with AI")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {members
              .filter((m) => m.snapshot && !plans?.some((p) => p.memberId === m.id))
              .slice(0, 5)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => generateAI(m.id)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium hover:bg-violet-100 disabled:opacity-50"
                >
                  ✨ {m.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Plans list */}
      {plans === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("workspace.plans.empty", "No plans yet")}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((p, i) => {
            const member = members.find((m) => m.id === p.memberId);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  {p.aiGenerated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </div>
                {member && (
                  <p className="text-xs text-gray-500 mb-2">→ {member.name}</p>
                )}
                {p.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {p.description}
                  </p>
                )}
                {Array.isArray(p.goals) && p.goals.length > 0 && (
                  <div className="space-y-1">
                    {p.goals.slice(0, 3).map((g: any, gi: number) => (
                      <div key={gi} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Check className="w-3 h-3 text-green-500" />
                        {g.description || g.competency}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
