"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Mail, Check, Loader2, Copy, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function InviteMemberPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function send() {
    if (!email.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${communityId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    if (result?.inviteUrl) {
      navigator.clipboard.writeText(result.inviteUrl);
    }
  }

  const ROLE_OPTIONS = [
    { value: "member", label: t("workspace.members.invite.role.member", "Member") },
    { value: "client", label: t("workspace.members.invite.role.client", "Client") },
    { value: "coach", label: t("workspace.members.invite.role.coach", "Coach") },
    { value: "mentor", label: t("workspace.members.invite.role.mentor", "Mentor") },
  ];

  return (
    <div className="min-h-screen py-6 px-4 max-w-2xl mx-auto">
      <Link
        href={`/workspace/${communityId}/members`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.modules.members")}
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
        <UserPlus className="w-7 h-7 text-[var(--rowi-g2)]" />
        {t("workspace.members.invite.title", "Invite member")}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("workspace.members.invite.description", "Send an invitation to join this workspace. If they already have a Rowi account, they'll be added directly.")}
      </p>

      {!result ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("workspace.members.invite.emailLabel", "Email")} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("workspace.members.invite.nameLabel", "Name (optional)")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("workspace.members.invite.namePlaceholder", "Full name")}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("workspace.members.invite.roleLabel", "Role in workspace")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      role === r.value
                        ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
                        : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={send}
              disabled={!email.trim() || sending}
              className="w-full py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("workspace.members.invite.sending", "Sending...")}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {t("workspace.members.invite.send", "Send invitation")}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {result.existing
              ? t("workspace.members.invite.addedTitle", "Member added!")
              : t("workspace.members.invite.sentTitle", "Invitation sent!")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {result.existing
              ? t("workspace.members.invite.addedDesc", "This user already has a Rowi account and has been added to the workspace.")
              : t("workspace.members.invite.sentDesc", "They'll receive a link to create their account and join.")}
          </p>

          {result.inviteUrl && (
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-left mb-4">
              <p className="text-xs text-gray-500 mb-1">
                {t("workspace.members.invite.inviteLink", "Invite link:")}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs truncate">{result.inviteUrl}</code>
                <button
                  onClick={copyLink}
                  className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setResult(null);
                setEmail("");
                setName("");
              }}
              className="flex-1 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-medium text-sm"
            >
              {t("workspace.members.invite.another", "Invite another")}
            </button>
            <Link
              href={`/workspace/${communityId}/members`}
              className="flex-1 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-semibold text-sm"
            >
              {t("workspace.members.upload.viewMembers", "View members")}
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
