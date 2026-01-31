"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserCheck,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Calendar,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Enrollment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  status: "active" | "completed" | "dropped" | "pending";
  progress: number;
  startedAt: string;
  completedAt?: string;
  lastActivityAt: string;
  score?: number;
}

const DEFAULT_ENROLLMENTS: Enrollment[] = [
  { id: "1", userId: "u1", userName: "Juan García", userEmail: "juan@example.com", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", status: "active", progress: 65, startedAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastActivityAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "2", userId: "u2", userName: "María López", userEmail: "maria@example.com", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", status: "completed", progress: 100, startedAt: new Date(Date.now() - 86400000 * 60).toISOString(), completedAt: new Date(Date.now() - 86400000 * 15).toISOString(), lastActivityAt: new Date(Date.now() - 86400000 * 15).toISOString(), score: 92 },
  { id: "3", userId: "u3", userName: "Carlos Ruiz", userEmail: "carlos@example.com", courseId: "c2", courseName: "Liderazgo Transformacional", status: "active", progress: 40, startedAt: new Date(Date.now() - 86400000 * 20).toISOString(), lastActivityAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "4", userId: "u4", userName: "Ana Martínez", userEmail: "ana@example.com", courseId: "c3", courseName: "Comunicación Asertiva", status: "dropped", progress: 25, startedAt: new Date(Date.now() - 86400000 * 45).toISOString(), lastActivityAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "5", userId: "u5", userName: "Pedro Sánchez", userEmail: "pedro@example.com", courseId: "c2", courseName: "Liderazgo Transformacional", status: "pending", progress: 0, startedAt: new Date(Date.now() - 86400000 * 1).toISOString(), lastActivityAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "6", userId: "u6", userName: "Laura Torres", userEmail: "laura@example.com", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", status: "completed", progress: 100, startedAt: new Date(Date.now() - 86400000 * 90).toISOString(), completedAt: new Date(Date.now() - 86400000 * 45).toISOString(), lastActivityAt: new Date(Date.now() - 86400000 * 45).toISOString(), score: 88 },
];

const STATUS_CONFIG = {
  active: { label: "Activo", color: "bg-blue-500/20 text-blue-500", icon: Clock },
  completed: { label: "Completado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  dropped: { label: "Abandonado", color: "bg-red-500/20 text-red-500", icon: XCircle },
  pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-500", icon: Clock },
};

export default function EnrollmentsPage() {
  const { t } = useI18n();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadEnrollments();
  }, []);

  async function loadEnrollments() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/education/enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || DEFAULT_ENROLLMENTS);
      } else {
        setEnrollments(DEFAULT_ENROLLMENTS);
      }
    } catch {
      setEnrollments(DEFAULT_ENROLLMENTS);
    } finally {
      setLoading(false);
    }
  }

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch = e.userName.toLowerCase().includes(search.toLowerCase()) || e.courseName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === "active").length,
    completed: enrollments.filter((e) => e.status === "completed").length,
    avgProgress: enrollments.filter((e) => e.status !== "pending").reduce((sum, e, _, arr) => sum + e.progress / arr.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-green-500" />
            {t("admin.education.enrollments.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.education.enrollments.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadEnrollments()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.education.enrollments.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.education.enrollments.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.education.enrollments.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.active}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.education.enrollments.stats.completed")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.completed}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-xs">{t("admin.education.enrollments.stats.avgProgress")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.avgProgress.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.education.enrollments.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.education.enrollments.allStatus")}</option>
          <option value="active">{t("admin.education.enrollments.statusActive")}</option>
          <option value="completed">{t("admin.education.enrollments.statusCompleted")}</option>
          <option value="dropped">{t("admin.education.enrollments.statusDropped")}</option>
          <option value="pending">{t("admin.education.enrollments.statusPending")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.enrollments.student")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.enrollments.course")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.enrollments.status")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.enrollments.progress")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.enrollments.lastActivity")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.map((enrollment) => {
                const statusInfo = STATUS_CONFIG[enrollment.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={enrollment.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{enrollment.userName}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{enrollment.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--rowi-foreground)]">{enrollment.courseName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                          <div className={`h-full ${enrollment.status === "completed" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${enrollment.progress}%` }} />
                        </div>
                        <span className="text-xs text-[var(--rowi-foreground)]">{enrollment.progress}%</span>
                      </div>
                      {enrollment.score !== undefined && (
                        <p className="text-xs text-[var(--rowi-muted)] mt-1">{t("admin.education.enrollments.score")}: {enrollment.score}%</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">
                      {new Date(enrollment.lastActivityAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10">
                        <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
