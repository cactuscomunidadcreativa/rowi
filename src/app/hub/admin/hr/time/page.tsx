"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  RefreshCcw,
  Search,
  Loader2,
  Calendar,
  User,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Download,
  Play,
  Pause,
  LogIn,
  LogOut,
  Coffee,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface TimeEntry {
  id: string;
  employeeName: string;
  employeePosition: string;
  employeeDepartment: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakTime: number; // minutes
  totalHours: number;
  status: "present" | "late" | "absent" | "half_day" | "remote";
  overtime: number;
}

interface DailySummary {
  date: string;
  present: number;
  late: number;
  absent: number;
  remote: number;
  avgHours: number;
}

const DEFAULT_ENTRIES: TimeEntry[] = [
  { id: "1", employeeName: "Juan García", employeePosition: "Senior Developer", employeeDepartment: "Tecnología", date: new Date().toISOString(), clockIn: "08:55", clockOut: "18:15", breakTime: 60, totalHours: 8.33, status: "present", overtime: 0.33 },
  { id: "2", employeeName: "María López", employeePosition: "Tech Lead", employeeDepartment: "Tecnología", date: new Date().toISOString(), clockIn: "08:30", clockOut: "19:00", breakTime: 60, totalHours: 9.5, status: "present", overtime: 1.5 },
  { id: "3", employeeName: "Carlos Ruiz", employeePosition: "UX Designer", employeeDepartment: "Diseño", date: new Date().toISOString(), clockIn: "09:15", status: "late", breakTime: 0, totalHours: 0, overtime: 0 },
  { id: "4", employeeName: "Pedro Sánchez", employeePosition: "Sales Executive", employeeDepartment: "Ventas", date: new Date().toISOString(), clockIn: "08:00", clockOut: "17:00", breakTime: 60, totalHours: 8, status: "present", overtime: 0 },
  { id: "5", employeeName: "Laura Torres", employeePosition: "Sales Manager", employeeDepartment: "Ventas", date: new Date().toISOString(), clockIn: "09:00", clockOut: "18:00", breakTime: 60, totalHours: 8, status: "remote", overtime: 0 },
  { id: "6", employeeName: "Roberto Méndez", employeePosition: "Junior Developer", employeeDepartment: "Tecnología", date: new Date().toISOString(), status: "absent", breakTime: 0, totalHours: 0, overtime: 0 },
  { id: "7", employeeName: "Sofía Herrera", employeePosition: "Content Writer", employeeDepartment: "Marketing", date: new Date().toISOString(), clockIn: "10:00", clockOut: "14:00", breakTime: 0, totalHours: 4, status: "half_day", overtime: 0 },
];

const DEFAULT_SUMMARY: DailySummary[] = [
  { date: new Date(Date.now() - 86400000 * 4).toISOString(), present: 22, late: 3, absent: 2, remote: 5, avgHours: 8.2 },
  { date: new Date(Date.now() - 86400000 * 3).toISOString(), present: 24, late: 2, absent: 1, remote: 4, avgHours: 8.5 },
  { date: new Date(Date.now() - 86400000 * 2).toISOString(), present: 20, late: 4, absent: 3, remote: 6, avgHours: 7.9 },
  { date: new Date(Date.now() - 86400000 * 1).toISOString(), present: 23, late: 2, absent: 2, remote: 5, avgHours: 8.3 },
  { date: new Date().toISOString(), present: 18, late: 3, absent: 1, remote: 5, avgHours: 8.1 },
];

const STATUS_CONFIG = {
  present: { label: "Presente", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  late: { label: "Tardanza", color: "bg-amber-500/20 text-amber-500", icon: AlertCircle },
  absent: { label: "Ausente", color: "bg-red-500/20 text-red-500", icon: AlertCircle },
  half_day: { label: "Medio Día", color: "bg-blue-500/20 text-blue-500", icon: Clock },
  remote: { label: "Remoto", color: "bg-purple-500/20 text-purple-500", icon: CheckCircle },
};

export default function TimePage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hr/time?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || DEFAULT_ENTRIES);
        setSummary(data.summary || DEFAULT_SUMMARY);
      } else {
        setEntries(DEFAULT_ENTRIES);
        setSummary(DEFAULT_SUMMARY);
      }
    } catch {
      setEntries(DEFAULT_ENTRIES);
      setSummary(DEFAULT_SUMMARY);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter((e) =>
    e.employeeName.toLowerCase().includes(search.toLowerCase()) || e.employeeDepartment.toLowerCase().includes(search.toLowerCase())
  );

  const todayStats = {
    present: entries.filter((e) => e.status === "present" || e.status === "remote").length,
    late: entries.filter((e) => e.status === "late").length,
    absent: entries.filter((e) => e.status === "absent").length,
    avgHours: entries.filter((e) => e.totalHours > 0).reduce((sum, e, _, arr) => sum + e.totalHours / arr.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-500" />
            {t("admin.hr.time.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.hr.time.description")}</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
          <button onClick={() => loadData()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            {t("admin.hr.time.export")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.time.stats.present")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{todayStats.present}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><AlertCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.time.stats.late")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{todayStats.late}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2"><AlertCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.time.stats.absent")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{todayStats.absent}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.hr.time.stats.avgHours")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{todayStats.avgHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Weekly Summary Chart */}
      <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{t("admin.hr.time.weeklySummary")}</h3>
        <div className="flex items-end gap-4 h-32">
          {summary.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1" style={{ height: "100%" }}>
                <div className="flex-1 bg-green-500/80 rounded-t" style={{ height: `${(day.present / 30) * 100}%` }} />
                <div className="bg-amber-500/80" style={{ height: `${(day.late / 30) * 100}%` }} />
                <div className="bg-red-500/80 rounded-b" style={{ height: `${(day.absent / 30) * 100}%` }} />
              </div>
              <span className="text-xs text-[var(--rowi-muted)]">{new Date(day.date).toLocaleDateString("es", { weekday: "short" })}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-[var(--rowi-muted)]">{t("admin.hr.time.present")}</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500" /><span className="text-xs text-[var(--rowi-muted)]">{t("admin.hr.time.late")}</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-xs text-[var(--rowi-muted)]">{t("admin.hr.time.absent")}</span></div>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.hr.time.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.hr.time.employee")}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.hr.time.clockIn")}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.hr.time.clockOut")}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.hr.time.break")}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.hr.time.total")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.hr.time.status")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const statusInfo = STATUS_CONFIG[entry.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={entry.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{entry.employeeName}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{entry.employeeDepartment}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.clockIn ? (
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--rowi-foreground)]">
                          <LogIn className="w-3 h-3 text-green-500" />{entry.clockIn}
                        </span>
                      ) : <span className="text-[var(--rowi-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.clockOut ? (
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--rowi-foreground)]">
                          <LogOut className="w-3 h-3 text-red-500" />{entry.clockOut}
                        </span>
                      ) : <span className="text-[var(--rowi-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.breakTime > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--rowi-muted)]">
                          <Coffee className="w-3 h-3" />{entry.breakTime}m
                        </span>
                      ) : <span className="text-[var(--rowi-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.totalHours > 0 ? (
                        <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                          {entry.totalHours.toFixed(1)}h
                          {entry.overtime > 0 && <span className="text-green-500 ml-1">(+{entry.overtime.toFixed(1)})</span>}
                        </span>
                      ) : <span className="text-[var(--rowi-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
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
