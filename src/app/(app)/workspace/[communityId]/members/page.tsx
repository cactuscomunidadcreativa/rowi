"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  UserPlus,
  Search,
  Users,
  Mail,
  MapPin,
  Brain,
  Trash2,
  Loader2,
  Circle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Member = {
  id: string;
  type: "community_member" | "rowi_user";
  name: string;
  email: string | null;
  country: string | null;
  brainStyle: string | null;
  role: string | null;
  status: string;
  source?: string | null;
  consentGiven?: boolean;
  snapshot: {
    id: string;
    at: string;
    overall4: number | null;
    K: number | null;
    C: number | null;
    G: number | null;
    brainStyle: string | null;
  } | null;
};

export default function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembers();
  }, [communityId]);

  async function loadMembers() {
    try {
      const res = await fetch(`/api/workspaces/${communityId}/members`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message);
      setMembers([]);
    }
  }

  async function removeMember(id: string, type: string) {
    if (!confirm(t("workspace.members.confirmRemove", "Remove this member?"))) return;
    try {
      const res = await fetch(
        `/api/workspaces/${communityId}/members?memberId=${id}&type=${type}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      await loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const filtered = members?.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.country?.toLowerCase().includes(q)
    );
  });

  const withSEI = filtered?.filter((m) => m.snapshot).length || 0;
  const total = filtered?.length || 0;

  return (
    <div className="min-h-screen py-6 px-4 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-[var(--rowi-g2)]" />
            {t("workspace.modules.members")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {t("workspace.list.members")} • {withSEI} {t("workspace.members.withSEI", "with SEI")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspace/${communityId}/members/invite`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:border-[var(--rowi-g2)] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t("workspace.members.invite", "Invite")}
          </Link>
          <Link
            href={`/workspace/${communityId}/members/upload`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" />
            {t("workspace.members.uploadCsv", "Upload CSV")}
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("workspace.members.searchPlaceholder", "Search by name, email, country...")}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent text-sm"
        />
      </div>

      {/* Loading */}
      {members === null && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      )}

      {/* Empty */}
      {members && members.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-1">
            {t("workspace.members.empty.title", "No members yet")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("workspace.members.empty.description", "Upload a CSV or invite members to begin")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link
              href={`/workspace/${communityId}/members/upload`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold"
            >
              <Upload className="w-4 h-4" />
              {t("workspace.members.uploadCsv", "Upload CSV")}
            </Link>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered && filtered.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("workspace.members.col.name", "Name")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t("workspace.members.col.email", "Email")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{t("workspace.members.col.country", "Country")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{t("workspace.members.col.brainStyle", "Brain Style")}</th>
                  <th className="text-left px-4 py-3 font-medium">EQ</th>
                  <th className="text-left px-4 py-3 font-medium">{t("workspace.members.col.status", "Status")}</th>
                  <th className="text-right px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filtered.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1">
                        {m.email ? <><Mail className="w-3 h-3" />{m.email}</> : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        {m.country ? <><MapPin className="w-3 h-3" />{m.country}</> : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {m.brainStyle ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                          <Brain className="w-3 h-3" />
                          {m.brainStyle}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {m.snapshot?.overall4 != null ? (
                        <span className="font-semibold text-[var(--rowi-g2)]">
                          {Math.round(m.snapshot.overall4)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Circle
                          className={`w-2 h-2 ${
                            m.status === "active" || m.status === "ACTIVE"
                              ? "fill-green-500 text-green-500"
                              : m.status === "invited"
                              ? "fill-yellow-500 text-yellow-500"
                              : "fill-gray-400 text-gray-400"
                          }`}
                        />
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeMember(m.id, m.type)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
