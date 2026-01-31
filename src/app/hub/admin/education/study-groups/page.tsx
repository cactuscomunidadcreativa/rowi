"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UsersRound,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Users,
  BookOpen,
  Calendar,
  MoreVertical,
  MessageSquare,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseName: string;
  facilitator: string;
  facilitatorEmail: string;
  membersCount: number;
  maxMembers: number;
  sessionsCount: number;
  avgProgress: number;
  avgRating: number;
  status: "active" | "completed" | "scheduled" | "paused";
  startDate: string;
  endDate: string;
  createdAt: string;
}

const DEFAULT_GROUPS: StudyGroup[] = [
  { id: "1", name: "IE Cohorte Enero 2024", description: "Grupo de estudio intensivo de inteligencia emocional", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", facilitator: "Dr. María González", facilitatorEmail: "maria@rowi.com", membersCount: 12, maxMembers: 15, sessionsCount: 8, avgProgress: 75, avgRating: 4.8, status: "active", startDate: new Date(Date.now() - 86400000 * 30).toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString(), createdAt: new Date(Date.now() - 86400000 * 45).toISOString() },
  { id: "2", name: "Liderazgo Q1 2024", description: "Programa de desarrollo de líderes", courseId: "c2", courseName: "Liderazgo Transformacional", facilitator: "Carlos Méndez", facilitatorEmail: "carlos@rowi.com", membersCount: 8, maxMembers: 10, sessionsCount: 6, avgProgress: 100, avgRating: 4.5, status: "completed", startDate: new Date(Date.now() - 86400000 * 90).toISOString(), endDate: new Date(Date.now() - 86400000 * 30).toISOString(), createdAt: new Date(Date.now() - 86400000 * 100).toISOString() },
  { id: "3", name: "Comunicación Equipo Ventas", description: "Mejora de habilidades comunicativas para el equipo comercial", courseId: "c3", courseName: "Comunicación Asertiva", facilitator: "Ana Ruiz", facilitatorEmail: "ana@rowi.com", membersCount: 15, maxMembers: 15, sessionsCount: 4, avgProgress: 50, avgRating: 4.9, status: "active", startDate: new Date(Date.now() - 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 45).toISOString(), createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: "4", name: "Productividad RRHH", description: "Grupo de gestión del tiempo para recursos humanos", courseId: "c4", courseName: "Gestión del Tiempo", facilitator: "Roberto Torres", facilitatorEmail: "roberto@rowi.com", membersCount: 0, maxMembers: 12, sessionsCount: 5, avgProgress: 0, avgRating: 0, status: "scheduled", startDate: new Date(Date.now() + 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 75).toISOString(), createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const STATUS_CONFIG = {
  active: { label: "Activo", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  completed: { label: "Completado", color: "bg-blue-500/20 text-blue-500", icon: CheckCircle },
  scheduled: { label: "Programado", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  paused: { label: "Pausado", color: "bg-gray-500/20 text-gray-500", icon: Clock },
};

export default function StudyGroupsPage() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/education/study-groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || DEFAULT_GROUPS);
      } else {
        setGroups(DEFAULT_GROUPS);
      }
    } catch {
      setGroups(DEFAULT_GROUPS);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) || g.courseName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: groups.length,
    active: groups.filter((g) => g.status === "active").length,
    totalMembers: groups.reduce((sum, g) => sum + g.membersCount, 0),
    avgProgress: groups.filter((g) => g.status === "active" || g.status === "completed").reduce((sum, g, _, arr) => sum + g.avgProgress / arr.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <UsersRound className="w-7 h-7 text-blue-500" />
            {t("admin.education.studyGroups.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.education.studyGroups.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadGroups()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.education.studyGroups.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><UsersRound className="w-4 h-4" /><span className="text-xs">{t("admin.education.studyGroups.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.education.studyGroups.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.active}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.education.studyGroups.stats.members")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.totalMembers}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-xs">{t("admin.education.studyGroups.stats.avgProgress")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.avgProgress.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.education.studyGroups.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => {
            const statusInfo = STATUS_CONFIG[group.status];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={group.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <UsersRound className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{group.name}</h3>
                      <p className="text-xs text-[var(--rowi-muted)]">{group.courseName}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />{statusInfo.label}
                  </span>
                </div>

                <p className="text-sm text-[var(--rowi-muted)] mb-3">{group.description}</p>

                <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)] mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.membersCount}/{group.maxMembers}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{group.sessionsCount} {t("admin.education.studyGroups.sessions")}</span>
                  {group.avgRating > 0 && (
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{group.avgRating.toFixed(1)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)] mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</span>
                </div>

                {(group.status === "active" || group.status === "completed") && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--rowi-muted)]">{t("admin.education.studyGroups.progress")}</span>
                      <span className="text-[var(--rowi-foreground)] font-medium">{group.avgProgress}%</span>
                    </div>
                    <div className="h-2 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                      <div className={`h-full ${group.status === "completed" ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${group.avgProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[var(--rowi-border)]">
                  <div className="text-xs text-[var(--rowi-muted)]">
                    <span className="font-medium text-[var(--rowi-foreground)]">{group.facilitator}</span>
                  </div>
                  <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10">
                    <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
