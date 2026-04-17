"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Search, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CompetenciesSpider from "@/components/charts/CompetenciesSpider";

export default function WorkspacePeoplePage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [members, setMembers] = useState<any[] | null>(null);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/workspaces/${communityId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members?.filter((m: any) => m.snapshot) || []))
      .catch(() => setMembers([]));
  }, [communityId]);

  const filtered = members?.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const memberA = members?.find((m) => m.id === selectedA);
  const memberB = members?.find((m) => m.id === selectedB);

  const extractComps = (m: any) => {
    if (!m?.snapshot) return {};
    return {
      EL: m.snapshot.EL, RP: m.snapshot.RP, ACT: m.snapshot.ACT,
      NE: m.snapshot.NE, IM: m.snapshot.IM, OP: m.snapshot.OP,
      EMP: m.snapshot.EMP, NG: m.snapshot.NG,
    };
  };

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
          <Users className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.modules.people")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.people.subtitle", "Compare individuals 1v1 across SEI competencies")}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("workspace.members.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Member list */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-3">{t("workspace.list.members")}</h3>
          <div className="space-y-1">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (!selectedA) setSelectedA(m.id);
                  else if (!selectedB && m.id !== selectedA) setSelectedB(m.id);
                  else {
                    setSelectedA(m.id);
                    setSelectedB(null);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  m.id === selectedA
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                    : m.id === selectedB
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                {m.name}
                {m.snapshot?.overall4 && (
                  <span className="ml-2 text-xs text-gray-500">
                    EQ: {Math.round(m.snapshot.overall4)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="lg:col-span-2">
          {memberA || memberB ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                {memberA && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">A</p>
                    <p className="font-semibold text-blue-600">{memberA.name}</p>
                  </div>
                )}
                {memberB && (
                  <>
                    <div className="text-gray-300">vs</div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">B</p>
                      <p className="font-semibold text-purple-600">{memberB.name}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="h-80">
                <CompetenciesSpider
                  comps={extractComps(memberA)}
                  compare={memberB ? extractComps(memberB) : null}
                />
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
              <p className="text-gray-500">
                {t("workspace.people.selectMembers", "Select 1 or 2 members to compare")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
