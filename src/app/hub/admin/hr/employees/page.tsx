"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit2,
  UserPlus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  position: string;
  department: string;
  manager?: string;
  status: "active" | "on_leave" | "terminated" | "probation";
  employmentType: "full_time" | "part_time" | "contractor";
  startDate: string;
  location: string;
}

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "1", name: "Juan García", email: "juan@rowi.com", phone: "+1 555-0101", position: "Senior Developer", department: "Tecnología", manager: "María López", status: "active", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 730).toISOString(), location: "Ciudad de México" },
  { id: "2", name: "María López", email: "maria@rowi.com", phone: "+1 555-0102", position: "Tech Lead", department: "Tecnología", status: "active", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 1095).toISOString(), location: "Ciudad de México" },
  { id: "3", name: "Carlos Ruiz", email: "carlos@rowi.com", phone: "+1 555-0103", position: "UX Designer", department: "Diseño", manager: "Ana Martínez", status: "active", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 365).toISOString(), location: "Bogotá" },
  { id: "4", name: "Ana Martínez", email: "ana@rowi.com", phone: "+1 555-0104", position: "Design Lead", department: "Diseño", status: "on_leave", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 900).toISOString(), location: "Lima" },
  { id: "5", name: "Pedro Sánchez", email: "pedro@rowi.com", phone: "+1 555-0105", position: "Sales Executive", department: "Ventas", manager: "Laura Torres", status: "active", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 180).toISOString(), location: "Santiago" },
  { id: "6", name: "Laura Torres", email: "laura@rowi.com", phone: "+1 555-0106", position: "Sales Manager", department: "Ventas", status: "active", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 600).toISOString(), location: "Buenos Aires" },
  { id: "7", name: "Roberto Méndez", email: "roberto@rowi.com", phone: "+1 555-0107", position: "Junior Developer", department: "Tecnología", manager: "María López", status: "probation", employmentType: "full_time", startDate: new Date(Date.now() - 86400000 * 45).toISOString(), location: "Ciudad de México" },
  { id: "8", name: "Sofía Herrera", email: "sofia@rowi.com", phone: "+1 555-0108", position: "Content Writer", department: "Marketing", status: "active", employmentType: "contractor", startDate: new Date(Date.now() - 86400000 * 120).toISOString(), location: "Remoto" },
];

const STATUS_CONFIG = {
  active: { label: "Activo", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  on_leave: { label: "Licencia", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  terminated: { label: "Baja", color: "bg-red-500/20 text-red-500", icon: XCircle },
  probation: { label: "Prueba", color: "bg-blue-500/20 text-blue-500", icon: Clock },
};

const EMPLOYMENT_TYPE = {
  full_time: "Tiempo Completo",
  part_time: "Medio Tiempo",
  contractor: "Contratista",
};

export default function EmployeesPage() {
  const { t } = useI18n();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || DEFAULT_EMPLOYEES);
      } else {
        setEmployees(DEFAULT_EMPLOYEES);
      }
    } catch {
      setEmployees(DEFAULT_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }

  const departments = [...new Set(employees.map((e) => e.department))];

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === "all" || e.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    onLeave: employees.filter((e) => e.status === "on_leave").length,
    probation: employees.filter((e) => e.status === "probation").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            {t("admin.hr.employees.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.hr.employees.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadEmployees()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <UserPlus className="w-4 h-4" />
            {t("admin.hr.employees.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.hr.employees.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.employees.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.active}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.hr.employees.stats.onLeave")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.onLeave}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.hr.employees.stats.probation")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.probation}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.hr.employees.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.hr.employees.allDepartments")}</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => {
            const statusInfo = STATUS_CONFIG[employee.status];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={employee.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-lg">
                      {employee.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{employee.name}</h3>
                      <p className="text-xs text-[var(--rowi-muted)]">{employee.position}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />{statusInfo.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-[var(--rowi-muted)]"><Building2 className="w-4 h-4" />{employee.department}</div>
                  <div className="flex items-center gap-2 text-[var(--rowi-muted)]"><Mail className="w-4 h-4" />{employee.email}</div>
                  <div className="flex items-center gap-2 text-[var(--rowi-muted)]"><MapPin className="w-4 h-4" />{employee.location}</div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--rowi-border)]">
                  <div className="text-xs text-[var(--rowi-muted)]">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(employee.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Eye className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                    <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Edit2 className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                    <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
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
