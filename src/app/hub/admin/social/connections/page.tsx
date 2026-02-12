// src/app/hub/admin/social/connections/page.tsx
// ============================================================
// Connections Management - Social Admin Panel
// ============================================================

"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import useSWR from "swr";
import {
  Link2,
  Search,
  Loader2,
  Filter,
  UserCheck,
  UserX,
  Clock,
  ShieldOff,
  RefreshCcw,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatusFilter = "all" | "active" | "pending" | "blocked";

export default function ConnectionsAdminPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const apiUrl = statusFilter === "all"
    ? "/api/social/connections"
    : `/api/social/connections?status=${statusFilter}`;

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const connections = data?.connections || [];

  // Client-side search filter
  const filtered = search
    ? connections.filter((c: any) =>
        c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : connections;

  const counts = data?.counts || { active: 0, pending_sent: 0, pending_received: 0, blocked: 0 };
  const totalConnections = data?.total ?? 0;

  const statusFilters: { key: StatusFilter; label: string; icon: any; count: number; color: string }[] = [
    { key: "all", label: t("admin.social.connections.all", "All"), icon: Link2, count: totalConnections, color: "text-gray-500" },
    { key: "active", label: t("admin.social.connections.active", "Active"), icon: UserCheck, count: counts.active, color: "text-green-500" },
    { key: "pending", label: t("admin.social.connections.pending", "Pending"), icon: Clock, count: (counts.pending_sent || 0) + (counts.pending_received || 0), color: "text-amber-500" },
    { key: "blocked", label: t("admin.social.connections.blocked", "Blocked"), icon: ShieldOff, count: counts.blocked, color: "text-red-500" },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      blocked: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
      rejected: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.rejected}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/hub/admin/social")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
          <Link2 className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {t("admin.social.connections.title", "Connections Management")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.connections.subtitle", "View and manage all user connections")}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setStatusFilter(sf.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === sf.key
                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30"
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <sf.icon className={`w-4 h-4 ${sf.color}`} />
            {sf.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === sf.key
                ? "bg-violet-200 dark:bg-violet-500/30 text-violet-800 dark:text-violet-200"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
              {sf.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.social.connections.searchPlaceholder", "Search by user name or email...")}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50">
          <Link2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.noData", "No data available")}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.connections.initiator", "Initiator")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.connections.receiver", "Connected User")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.connections.status", "Status")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.connections.direction", "Direction")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.connections.createdAt", "Created")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((conn: any) => (
                  <tr
                    key={conn.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {conn.user?.image ? (
                          <img
                            src={conn.user.image}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-600 dark:text-violet-400">
                            {conn.user?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {conn.user?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {conn.user?.email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {conn.user?.headline || "--"}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(conn.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        conn.direction === "sent" ? "text-blue-500" : "text-green-500"
                      }`}>
                        {conn.direction === "sent"
                          ? t("admin.social.connections.sent", "Sent")
                          : t("admin.social.connections.received", "Received")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {formatDate(conn.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
