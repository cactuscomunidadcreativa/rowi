"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Calendar,
  User,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Plane,
  Heart,
  Baby,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeePosition: string;
  employeeDepartment: string;
  type: "vacation" | "sick" | "personal" | "maternity" | "training";
  status: "pending" | "approved" | "rejected" | "cancelled";
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  approverName?: string;
  approvedDate?: string;
}

const DEFAULT_LEAVES: LeaveRequest[] = [
  { id: "1", employeeName: "Juan García", employeePosition: "Senior Developer", employeeDepartment: "Tecnología", type: "vacation", status: "approved", startDate: new Date(Date.now() + 86400000 * 30).toISOString(), endDate: new Date(Date.now() + 86400000 * 44).toISOString(), days: 14, reason: "Vacaciones familiares", approverName: "María López", approvedDate: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "2", employeeName: "Carlos Ruiz", employeePosition: "UX Designer", employeeDepartment: "Diseño", type: "sick", status: "approved", startDate: new Date(Date.now() - 86400000 * 3).toISOString(), endDate: new Date(Date.now() - 86400000 * 1).toISOString(), days: 2, reason: "Gripe", approverName: "Ana Martínez", approvedDate: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "3", employeeName: "Ana Martínez", employeePosition: "Design Lead", employeeDepartment: "Diseño", type: "maternity", status: "approved", startDate: new Date(Date.now() - 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 75).toISOString(), days: 90, approverName: "Director RRHH" },
  { id: "4", employeeName: "Pedro Sánchez", employeePosition: "Sales Executive", employeeDepartment: "Ventas", type: "personal", status: "pending", startDate: new Date(Date.now() + 86400000 * 10).toISOString(), endDate: new Date(Date.now() + 86400000 * 11).toISOString(), days: 1, reason: "Trámites personales" },
  { id: "5", employeeName: "Sofía Herrera", employeePosition: "Content Writer", employeeDepartment: "Marketing", type: "training", status: "pending", startDate: new Date(Date.now() + 86400000 * 20).toISOString(), endDate: new Date(Date.now() + 86400000 * 24).toISOString(), days: 4, reason: "Curso de certificación" },
  { id: "6", employeeName: "Roberto Méndez", employeePosition: "Junior Developer", employeeDepartment: "Tecnología", type: "vacation", status: "rejected", startDate: new Date(Date.now() + 86400000 * 5).toISOString(), endDate: new Date(Date.now() + 86400000 * 12).toISOString(), days: 7, reason: "Viaje planificado" },
];

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  approved: { label: "Aprobada", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  rejected: { label: "Rechazada", color: "bg-red-500/20 text-red-500", icon: XCircle },
  cancelled: { label: "Cancelada", color: "bg-gray-500/20 text-gray-500", icon: XCircle },
};

const TYPE_CONFIG = {
  vacation: { label: "Vacaciones", color: "bg-blue-500/20 text-blue-500", icon: Plane },
  sick: { label: "Enfermedad", color: "bg-red-500/20 text-red-500", icon: Heart },
  personal: { label: "Personal", color: "bg-purple-500/20 text-purple-500", icon: Briefcase },
  maternity: { label: "Maternidad/Paternidad", color: "bg-pink-500/20 text-pink-500", icon: Baby },
  training: { label: "Capacitación", color: "bg-green-500/20 text-green-500", icon: GraduationCap },
};

export default function LeavesPage() {
  const { t } = useI18n();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadLeaves();
  }, []);

  async function loadLeaves() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hr/leaves");
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || DEFAULT_LEAVES);
      } else {
        setLeaves(DEFAULT_LEAVES);
      }
    } catch {
      setLeaves(DEFAULT_LEAVES);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch = l.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    daysThisMonth: leaves.filter((l) => l.status === "approved").reduce((sum, l) => sum + l.days, 0),
  };

  const approveLeave = (id: string) => {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: "approved" as const, approverName: "Admin", approvedDate: new Date().toISOString() } : l)));
    toast.success(t("admin.hr.leaves.approved"));
  };

  const rejectLeave = (id: string) => {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: "rejected" as const } : l)));
    toast.success(t("admin.hr.leaves.rejected"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-green-500" />
            {t("admin.hr.leaves.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.hr.leaves.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadLeaves()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.hr.leaves.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><CalendarDays className="w-4 h-4" /><span className="text-xs">{t("admin.hr.leaves.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.hr.leaves.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pending}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.leaves.stats.approved")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.approved}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Calendar className="w-4 h-4" /><span className="text-xs">{t("admin.hr.leaves.stats.daysUsed")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.daysThisMonth}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.hr.leaves.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.hr.leaves.allStatus")}</option>
          <option value="pending">{t("admin.hr.leaves.statusPending")}</option>
          <option value="approved">{t("admin.hr.leaves.statusApproved")}</option>
          <option value="rejected">{t("admin.hr.leaves.statusRejected")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-4">
          {filteredLeaves.map((leave) => {
            const statusInfo = STATUS_CONFIG[leave.status];
            const typeInfo = TYPE_CONFIG[leave.type];
            const StatusIcon = statusInfo.icon;
            const TypeIcon = typeInfo.icon;
            return (
              <div key={leave.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{leave.employeeName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3" />{typeInfo.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)]">{leave.employeePosition} • {leave.employeeDepartment}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--rowi-muted)]">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                      <span className="font-medium text-[var(--rowi-foreground)]">{leave.days} {t("admin.hr.leaves.days")}</span>
                    </div>
                    {leave.reason && <p className="text-sm text-[var(--rowi-muted)] mt-2 italic">"{leave.reason}"</p>}
                  </div>
                  <div className="text-right">
                    {leave.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => approveLeave(leave.id)} className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:opacity-90">
                          {t("admin.hr.leaves.approve")}
                        </button>
                        <button onClick={() => rejectLeave(leave.id)} className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:opacity-90">
                          {t("admin.hr.leaves.reject")}
                        </button>
                      </div>
                    ) : leave.approverName && (
                      <p className="text-xs text-[var(--rowi-muted)]">{t("admin.hr.leaves.approvedBy")}: {leave.approverName}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
