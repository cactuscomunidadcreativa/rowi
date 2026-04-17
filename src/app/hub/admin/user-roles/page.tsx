"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Search, Loader2, Crown, Sparkles, Check, User as UserIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const ROLES = ["SUPERADMIN", "ADMIN", "MANAGER", "EDITOR", "VIEWER"] as const;

export default function UserRolesPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);

  async function load(q: string = "") {
    const res = await fetch(`/api/admin/user-roles${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(userId: string, role: string) {
    setSaving(userId);
    try {
      await fetch("/api/admin/user-roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, organizationRole: role }),
      });
      await load(search);
    } finally {
      setSaving(null);
    }
  }

  async function grantSuper() {
    if (!grantEmail.trim()) return;
    setGranting(true);
    try {
      const res = await fetch("/api/admin/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: grantEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setGrantEmail("");
        await load(search);
        alert(t("admin.userRoles.granted", "SUPERADMIN granted to user"));
      } else {
        alert(data.error || "Error");
      }
    } finally {
      setGranting(false);
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Shield className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("admin.userRoles.title", "User Roles")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("admin.userRoles.subtitle", "Manage global roles for all users")}
        </p>
      </div>

      {/* Grant super access */}
      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 rounded-2xl border border-violet-200 dark:border-violet-900 p-5">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-violet-600" />
          {t("admin.userRoles.grantSuper", "Grant SUPERADMIN access")}
        </h3>
        <p className="text-xs text-violet-700 dark:text-violet-300 mb-3">
          {t("admin.userRoles.grantSuperDesc", "Gives full access to all admin views, workspaces, and data")}
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-900 text-sm"
          />
          <button
            onClick={grantSuper}
            disabled={!grantEmail.trim() || granting}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t("admin.userRoles.grant", "Grant")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          placeholder={t("admin.userRoles.searchPlaceholder", "Search by name or email...")}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
        />
      </div>

      {/* Users table */}
      {users === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center">
          <p className="text-gray-500">{t("admin.userRoles.empty", "No users found")}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">{t("admin.userRoles.col.user", "User")}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">{t("admin.userRoles.col.email", "Email")}</th>
                  <th className="text-left px-4 py-3">{t("admin.userRoles.col.role", "Global Role")}</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">{t("admin.userRoles.col.memberships", "Memberships")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white text-xs font-semibold">
                          {u.name?.[0] || u.email?.[0] || "?"}
                        </div>
                        <span className="font-medium">{u.name || u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.organizationRole || "VIEWER"}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        disabled={saving === u.id}
                        className="px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {saving === u.id && (
                        <Loader2 className="inline ml-2 w-3 h-3 animate-spin" />
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {u.memberships?.slice(0, 2).map((m: any, mi: number) => (
                          <span key={mi} className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 rounded">
                            {m.role}
                          </span>
                        ))}
                        {u.rowiCommunities?.slice(0, 2).map((c: any, ci: number) => (
                          <span key={ci} className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 rounded" title={c.community?.name}>
                            {c.role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
