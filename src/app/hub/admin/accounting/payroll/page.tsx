"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  FileText,
  Calculator,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface PayrollPeriod {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  employeeCount: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  taxes: number;
  status: "draft" | "calculated" | "approved" | "paid";
  payDate?: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: "active" | "on_leave" | "terminated";
}

const DEFAULT_PERIODS: PayrollPeriod[] = [
  { id: "1", period: "Enero 2024", startDate: "2024-01-01", endDate: "2024-01-31", employeeCount: 25, grossPay: 62500, deductions: 12500, netPay: 50000, taxes: 8750, status: "paid", payDate: "2024-01-31" },
  { id: "2", period: "Febrero 2024", startDate: "2024-02-01", endDate: "2024-02-29", employeeCount: 26, grossPay: 65000, deductions: 13000, netPay: 52000, taxes: 9100, status: "paid", payDate: "2024-02-29" },
  { id: "3", period: "Marzo 2024", startDate: "2024-03-01", endDate: "2024-03-31", employeeCount: 26, grossPay: 65000, deductions: 13000, netPay: 52000, taxes: 9100, status: "approved", payDate: "2024-03-31" },
  { id: "4", period: "Abril 2024", startDate: "2024-04-01", endDate: "2024-04-30", employeeCount: 27, grossPay: 67500, deductions: 13500, netPay: 54000, taxes: 9450, status: "calculated" },
  { id: "5", period: "Mayo 2024", startDate: "2024-05-01", endDate: "2024-05-31", employeeCount: 27, grossPay: 0, deductions: 0, netPay: 0, taxes: 0, status: "draft" },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "1", name: "Juan García", position: "Senior Developer", department: "Tecnología", baseSalary: 4500, bonus: 500, deductions: 750, netPay: 4250, status: "active" },
  { id: "2", name: "María López", position: "Product Manager", department: "Producto", baseSalary: 5000, bonus: 600, deductions: 840, netPay: 4760, status: "active" },
  { id: "3", name: "Carlos Ruiz", position: "Designer", department: "Diseño", baseSalary: 3500, bonus: 300, deductions: 570, netPay: 3230, status: "active" },
  { id: "4", name: "Ana Martínez", position: "Sales Executive", department: "Ventas", baseSalary: 3000, bonus: 1200, deductions: 630, netPay: 3570, status: "active" },
  { id: "5", name: "Pedro Sánchez", position: "HR Manager", department: "RRHH", baseSalary: 4000, bonus: 400, deductions: 660, netPay: 3740, status: "on_leave" },
];

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-gray-500/20 text-gray-500", icon: FileText },
  calculated: { label: "Calculado", color: "bg-blue-500/20 text-blue-500", icon: Calculator },
  approved: { label: "Aprobado", color: "bg-purple-500/20 text-purple-500", icon: CheckCircle },
  paid: { label: "Pagado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
};

const EMPLOYEE_STATUS = {
  active: { label: "Activo", color: "bg-green-500/20 text-green-500" },
  on_leave: { label: "Licencia", color: "bg-amber-500/20 text-amber-500" },
  terminated: { label: "Baja", color: "bg-red-500/20 text-red-500" },
};

export default function PayrollPage() {
  const { t } = useI18n();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"periods" | "employees">("periods");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [periodsRes, employeesRes] = await Promise.all([
        fetch("/api/admin/accounting/payroll/periods"),
        fetch("/api/admin/accounting/payroll/employees"),
      ]);
      if (periodsRes.ok) {
        const data = await periodsRes.json();
        setPeriods(data.periods || DEFAULT_PERIODS);
      } else {
        setPeriods(DEFAULT_PERIODS);
      }
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || DEFAULT_EMPLOYEES);
      } else {
        setEmployees(DEFAULT_EMPLOYEES);
      }
    } catch {
      setPeriods(DEFAULT_PERIODS);
      setEmployees(DEFAULT_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }

  const filteredPeriods = periods.filter((p) =>
    p.period.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    employees: employees.filter((e) => e.status === "active").length,
    monthlyPayroll: periods.find((p) => p.status === "approved" || p.status === "calculated")?.netPay || 0,
    ytdPaid: periods.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.netPay, 0),
    pendingApproval: periods.filter((p) => p.status === "calculated").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Users className="w-7 h-7 text-violet-500" />
            {t("admin.accounting.payroll.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.payroll.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadData()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors">
            <Download className="w-4 h-4" />
            {t("admin.accounting.payroll.export")}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Calculator className="w-4 h-4" />
            {t("admin.accounting.payroll.runPayroll")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payroll.stats.employees")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.employees}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Wallet className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payroll.stats.monthlyPayroll")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.monthlyPayroll.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payroll.stats.ytdPaid")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.ytdPaid.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payroll.stats.pendingApproval")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pendingApproval}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--rowi-border)]">
        <button onClick={() => setActiveTab("periods")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "periods" ? "text-[var(--rowi-primary)] border-b-2 border-[var(--rowi-primary)]" : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"}`}>
          {t("admin.accounting.payroll.tabs.periods")}
        </button>
        <button onClick={() => setActiveTab("employees")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "employees" ? "text-[var(--rowi-primary)] border-b-2 border-[var(--rowi-primary)]" : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"}`}>
          {t("admin.accounting.payroll.tabs.employees")}
        </button>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.payroll.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : activeTab === "periods" ? (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.period")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.employees")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.grossPay")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.deductions")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.netPay")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPeriods.map((period) => {
                const statusInfo = STATUS_CONFIG[period.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={period.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{period.period}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--rowi-foreground)]">{period.employeeCount}</td>
                    <td className="px-4 py-3 text-right text-[var(--rowi-foreground)]">${period.grossPay.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-500">${period.deductions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--rowi-foreground)]">${period.netPay.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Eye className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Download className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.employee")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.department")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.baseSalary")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.bonus")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.deductions")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.netPay")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.payroll.status")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const statusInfo = EMPLOYEE_STATUS[employee.status];
                return (
                  <tr key={employee.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{employee.name}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{employee.position}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--rowi-muted)]">{employee.department}</td>
                    <td className="px-4 py-3 text-right text-[var(--rowi-foreground)]">${employee.baseSalary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-500">${employee.bonus.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-500">${employee.deductions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--rowi-foreground)]">${employee.netPay.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
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
