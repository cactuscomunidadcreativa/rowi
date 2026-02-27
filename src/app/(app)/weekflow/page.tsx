"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Calendar,
  Users,
  ArrowRight,
  CheckSquare,
  Sparkles,
  Lock,
  Crown,
  Shield,
  Eye,
  Share2,
  Copy,
  Check,
  Plus,
  Megaphone,
  Target,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

/* =========================================================
   📅 WeekFlow Landing Page — Rowi SIA
   ---------------------------------------------------------
   Check-ins semanales para comunidades.
   - Dueños/admins pueden crear check-ins y compartir URL
   - Miembros ven check-ins de sus comunidades
========================================================= */

interface Hub {
  id: string;
  name: string;
  description?: string;
  image?: string;
  role?: string;
  memberCount?: number;
  _count?: { members?: number; memberships?: number };
}

export default function WeekFlowPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { data: session, status } = useSession();
  const authLoading = status === "loading";
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) fetchUserHubs();
  }, [authLoading, session]);

  const fetchUserHubs = async () => {
    try {
      const res = await fetch("/api/hubs/my");
      const data = await res.json();
      if (data.ok) setHubs(data.hubs || []);
    } catch (error) {
      console.error("Error fetching hubs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Plan access — currently open for all
  const hasTeamAccess = true;

  const isOwnerOrAdmin = (role?: string) => {
    const r = (role || "").toLowerCase();
    return ["owner", "admin", "coach", "superadmin"].includes(r);
  };

  const myCheckins = hubs.filter((h) => isOwnerOrAdmin(h.role));
  const memberCheckins = hubs.filter((h) => !isOwnerOrAdmin(h.role));

  const copyShareUrl = (hubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/weekflow/${hubId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(hubId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleInfo = (role?: string) => {
    const r = (role || "").toLowerCase();
    if (r === "owner") return { icon: Crown, label: t("weekflow.role.owner"), color: "text-amber-500", bg: "bg-amber-500/10" };
    if (r === "admin" || r === "superadmin") return { icon: Shield, label: t("weekflow.role.admin"), color: "text-blue-500", bg: "bg-blue-500/10" };
    if (r === "coach") return { icon: Target, label: t("weekflow.role.coach"), color: "text-purple-500", bg: "bg-purple-500/10" };
    return { icon: Eye, label: t("weekflow.role.member"), color: "text-gray-500", bg: "bg-gray-500/10" };
  };

  const tr = {
    title: t("weekflow.title"),
    subtitle: t("weekflow.landing.subtitle"),
    tasks: t("weekflow.tasks.title"),
    tasksDesc: t("weekflow.tasks.subtitle"),
    insights: t("weekflow.insights.title"),
    insightsDesc: t("weekflow.insights.subtitle"),
    myCheckins: t("weekflow.landing.myCheckins"),
    myCheckinsDesc: t("weekflow.landing.myCheckinsDesc"),
    communityCheckins: t("weekflow.landing.communityCheckins"),
    communityCheckinsDesc: t("weekflow.landing.communityCheckinsDesc"),
    createCheckin: t("weekflow.landing.createCheckin"),
    viewCheckin: t("weekflow.landing.viewCheckin"),
    shareUrl: t("weekflow.landing.shareUrl"),
    copied: t("weekflow.landing.copied"),
    members: t("common.members"),
    noHubs: t("weekflow.noHubs"),
    noHubsDesc: t("weekflow.noHubsDesc"),
    explore: t("weekflow.landing.explore"),
    planRequired: t("weekflow.landing.planRequired"),
    upgrade: t("weekflow.landing.upgrade"),
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-primary)]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--rowi-background)] pt-20 pb-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-[var(--rowi-foreground)] flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            {tr.title}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-2">{tr.subtitle}</p>
        </motion.div>

        {/* Quick access cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Personal Tasks */}
          <div
            onClick={() => router.push("/weekflow/tasks")}
            className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]/50 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--rowi-foreground)]">{tr.tasks}</h3>
              <p className="text-sm text-[var(--rowi-muted)] truncate">{tr.tasksDesc}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--rowi-muted)] group-hover:text-[var(--rowi-primary)] transition-colors shrink-0" />
          </div>

          {/* Insights */}
          <div
            onClick={() => router.push("/weekflow/tasks/insights")}
            className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]/50 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--rowi-foreground)]">{tr.insights}</h3>
              <p className="text-sm text-[var(--rowi-muted)] truncate">{tr.insightsDesc}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--rowi-muted)] group-hover:text-[var(--rowi-primary)] transition-colors shrink-0" />
          </div>
        </motion.div>

        {/* Plan gate */}
        {!hasTeamAccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 rounded-2xl border-2 border-dashed border-[var(--rowi-border)] bg-[var(--rowi-surface)]"
          >
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-semibold text-[var(--rowi-foreground)] mb-2">{tr.myCheckins}</h3>
            <p className="text-sm text-[var(--rowi-muted)] mb-4">{tr.planRequired}</p>
            <Link
              href="/settings/subscription"
              className="inline-flex px-6 py-2.5 rounded-xl border border-[var(--rowi-border)] text-sm font-medium text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)] transition-colors"
            >
              {tr.upgrade}
            </Link>
          </motion.div>
        ) : hubs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 rounded-2xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)]"
          >
            <Calendar className="w-16 h-16 text-[var(--rowi-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-2">{tr.noHubs}</h3>
            <p className="text-[var(--rowi-muted)] mb-6">{tr.noHubsDesc}</p>
            <Link
              href="/comunidades"
              className="inline-flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {tr.explore}
            </Link>
          </motion.div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════
               🏅 My Check-ins — Owner / Admin communities
            ═══════════════════════════════════════════════════ */}
            {myCheckins.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">{tr.myCheckins}</h2>
                    <p className="text-xs text-[var(--rowi-muted)]">{tr.myCheckinsDesc}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {myCheckins.map((hub, i) => {
                    const roleInfo = getRoleInfo(hub.role);
                    const RoleIcon = roleInfo.icon;
                    const count = hub.memberCount || hub._count?.memberships || hub._count?.members || 0;

                    return (
                      <motion.div
                        key={hub.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        onClick={() => router.push(`/weekflow/${hub.id}`)}
                        className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer group"
                      >
                        {hub.image ? (
                          <img src={hub.image} alt={hub.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                            <Megaphone className="w-7 h-7 text-amber-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[var(--rowi-foreground)] truncate">{hub.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${roleInfo.color} ${roleInfo.bg}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleInfo.label}
                            </span>
                          </div>
                          {hub.description && (
                            <p className="text-sm text-[var(--rowi-muted)] truncate">{hub.description}</p>
                          )}
                          <p className="text-xs text-[var(--rowi-muted)] mt-1">
                            <Users className="w-3 h-3 inline-block mr-1" />
                            {count} {tr.members}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Share URL button */}
                          <button
                            onClick={(e) => copyShareUrl(hub.id, e)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--rowi-background)] border border-[var(--rowi-border)] text-xs font-medium text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] hover:border-[var(--rowi-primary)]/50 transition-all"
                            title={tr.shareUrl}
                          >
                            {copiedId === hub.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-green-500">{tr.copied}</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{tr.shareUrl}</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/weekflow/${hub.id}/checkin`);
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                          >
                            {tr.createCheckin}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* ═══════════════════════════════════════════════════
               👥 Community Check-ins — Member communities
            ═══════════════════════════════════════════════════ */}
            {memberCheckins.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--rowi-foreground)]">{tr.communityCheckins}</h2>
                    <p className="text-xs text-[var(--rowi-muted)]">{tr.communityCheckinsDesc}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {memberCheckins.map((hub, i) => {
                    const roleInfo = getRoleInfo(hub.role);
                    const RoleIcon = roleInfo.icon;
                    const count = hub.memberCount || hub._count?.memberships || hub._count?.members || 0;

                    return (
                      <motion.div
                        key={hub.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        onClick={() => router.push(`/weekflow/${hub.id}`)}
                        className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
                      >
                        {hub.image ? (
                          <img src={hub.image} alt={hub.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[var(--rowi-foreground)] truncate">{hub.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${roleInfo.color} ${roleInfo.bg}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleInfo.label}
                            </span>
                          </div>
                          {hub.description && (
                            <p className="text-sm text-[var(--rowi-muted)] truncate">{hub.description}</p>
                          )}
                          <p className="text-xs text-[var(--rowi-muted)] mt-1">
                            <Users className="w-3 h-3 inline-block mr-1" />
                            {count} {tr.members}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/weekflow/${hub.id}/checkin`);
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
                          >
                            {tr.createCheckin}
                          </button>
                          <ArrowRight className="w-4 h-4 text-[var(--rowi-muted)] group-hover:text-blue-500 transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
