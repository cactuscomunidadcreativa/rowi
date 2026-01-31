"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  RefreshCcw,
  Search,
  Loader2,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  Award,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from "recharts";

interface ProductivityData {
  id: string;
  employeeName: string;
  employeePosition: string;
  employeeDepartment: string;
  tasksCompleted: number;
  tasksAssigned: number;
  hoursWorked: number;
  productivityScore: number;
  trend: "up" | "down" | "stable";
  topSkills: string[];
  weeklyData: number[];
}

interface DepartmentStats {
  department: string;
  avgScore: number;
  totalTasks: number;
  completedTasks: number;
  employees: number;
}

const DEFAULT_PRODUCTIVITY: ProductivityData[] = [
  { id: "1", employeeName: "Juan García", employeePosition: "Senior Developer", employeeDepartment: "Tecnología", tasksCompleted: 28, tasksAssigned: 30, hoursWorked: 168, productivityScore: 92, trend: "up", topSkills: ["React", "Node.js", "TypeScript"], weeklyData: [85, 88, 90, 92, 94] },
  { id: "2", employeeName: "María López", employeePosition: "Tech Lead", employeeDepartment: "Tecnología", tasksCompleted: 35, tasksAssigned: 38, hoursWorked: 180, productivityScore: 95, trend: "up", topSkills: ["Liderazgo", "Arquitectura", "Code Review"], weeklyData: [90, 92, 93, 94, 95] },
  { id: "3", employeeName: "Carlos Ruiz", employeePosition: "UX Designer", employeeDepartment: "Diseño", tasksCompleted: 22, tasksAssigned: 25, hoursWorked: 160, productivityScore: 88, trend: "stable", topSkills: ["Figma", "User Research", "Prototyping"], weeklyData: [87, 88, 86, 89, 88] },
  { id: "4", employeeName: "Pedro Sánchez", employeePosition: "Sales Executive", employeeDepartment: "Ventas", tasksCompleted: 45, tasksAssigned: 50, hoursWorked: 175, productivityScore: 90, trend: "up", topSkills: ["Negociación", "CRM", "Prospecting"], weeklyData: [82, 85, 88, 89, 90] },
  { id: "5", employeeName: "Laura Torres", employeePosition: "Sales Manager", employeeDepartment: "Ventas", tasksCompleted: 32, tasksAssigned: 35, hoursWorked: 185, productivityScore: 91, trend: "stable", topSkills: ["Team Management", "Strategy", "Reporting"], weeklyData: [90, 91, 90, 92, 91] },
  { id: "6", employeeName: "Roberto Méndez", employeePosition: "Junior Developer", employeeDepartment: "Tecnología", tasksCompleted: 18, tasksAssigned: 22, hoursWorked: 160, productivityScore: 78, trend: "up", topSkills: ["JavaScript", "CSS", "Git"], weeklyData: [70, 72, 75, 76, 78] },
  { id: "7", employeeName: "Sofía Herrera", employeePosition: "Content Writer", employeeDepartment: "Marketing", tasksCompleted: 40, tasksAssigned: 42, hoursWorked: 155, productivityScore: 94, trend: "up", topSkills: ["Copywriting", "SEO", "Research"], weeklyData: [88, 90, 92, 93, 94] },
];

const DEFAULT_DEPT_STATS: DepartmentStats[] = [
  { department: "Tecnología", avgScore: 88, totalTasks: 90, completedTasks: 81, employees: 3 },
  { department: "Diseño", avgScore: 88, totalTasks: 25, completedTasks: 22, employees: 1 },
  { department: "Ventas", avgScore: 90, totalTasks: 85, completedTasks: 77, employees: 2 },
  { department: "Marketing", avgScore: 94, totalTasks: 42, completedTasks: 40, employees: 1 },
];

export default function ProductivityPage() {
  const { t } = useI18n();
  const [productivity, setProductivity] = useState<ProductivityData[]>([]);
  const [deptStats, setDeptStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState<"individual" | "department">("individual");

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hr/productivity?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setProductivity(data.productivity || DEFAULT_PRODUCTIVITY);
        setDeptStats(data.deptStats || DEFAULT_DEPT_STATS);
      } else {
        setProductivity(DEFAULT_PRODUCTIVITY);
        setDeptStats(DEFAULT_DEPT_STATS);
      }
    } catch {
      setProductivity(DEFAULT_PRODUCTIVITY);
      setDeptStats(DEFAULT_DEPT_STATS);
    } finally {
      setLoading(false);
    }
  }

  const filteredProductivity = productivity.filter((p) =>
    p.employeeName.toLowerCase().includes(search.toLowerCase()) || p.employeeDepartment.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    avgScore: productivity.length > 0 ? productivity.reduce((sum, p) => sum + p.productivityScore, 0) / productivity.length : 0,
    totalTasks: productivity.reduce((sum, p) => sum + p.tasksAssigned, 0),
    completedTasks: productivity.reduce((sum, p) => sum + p.tasksCompleted, 0),
    topPerformers: productivity.filter((p) => p.productivityScore >= 90).length,
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-blue-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // Prepare data for charts
  const deptChartData = deptStats.map((d) => ({
    name: d.department,
    score: d.avgScore,
    tasks: d.completedTasks,
    employees: d.employees,
  }));

  const weeklyTrendData = [
    { day: t("admin.hr.time.weekly.mon"), score: 85 },
    { day: t("admin.hr.time.weekly.tue"), score: 88 },
    { day: t("admin.hr.time.weekly.wed"), score: 87 },
    { day: t("admin.hr.time.weekly.thu"), score: 91 },
    { day: t("admin.hr.time.weekly.fri"), score: 89 },
  ];

  // Radar data for skills distribution
  const skillsRadarData = [
    { skill: "Técnico", value: 88 },
    { skill: "Comunicación", value: 82 },
    { skill: "Liderazgo", value: 75 },
    { skill: "Creatividad", value: 90 },
    { skill: "Colaboración", value: 85 },
    { skill: "Gestión", value: 78 },
  ];

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-[var(--rowi-muted)]" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            {t("admin.hr.productivity.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.hr.productivity.description")}</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
            <option value="week">{t("admin.hr.productivity.week")}</option>
            <option value="month">{t("admin.hr.productivity.month")}</option>
            <option value="quarter">{t("admin.hr.productivity.quarter")}</option>
          </select>
          <button onClick={() => loadData()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><BarChart3 className="w-4 h-4" /><span className="text-xs">{t("admin.hr.productivity.stats.avgScore")}</span></div>
          <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore.toFixed(0)}%</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Target className="w-4 h-4" /><span className="text-xs">{t("admin.hr.productivity.stats.completionRate")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(0) : 0}%</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.productivity.stats.tasksCompleted")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.completedTasks}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Award className="w-4 h-4" /><span className="text-xs">{t("admin.hr.productivity.stats.topPerformers")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.topPerformers}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Bar Chart */}
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{t("admin.hr.productivity.byDepartment")}</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--rowi-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-card)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number) => [`${value}%`, t("admin.hr.productivity.score")]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#31A2E3" />
                    <stop offset="50%" stopColor="#E53935" />
                    <stop offset="100%" stopColor="#D797CF" />
                  </linearGradient>
                </defs>
                <Bar dataKey="score" fill="url(#barGradient)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend Line Chart */}
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{t("admin.hr.productivity.weeklyTrend")}</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-card)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number) => [`${value}%`, t("admin.hr.productivity.score")]}
                />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#31A2E3" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#31A2E3" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="#31A2E3" strokeWidth={2} fill="url(#areaGradient)" dot={{ fill: "#E53935", strokeWidth: 2, stroke: "#31A2E3", r: 4 }} activeDot={{ r: 6, fill: "#D797CF", stroke: "#31A2E3", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skills Radar Chart */}
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{t("admin.hr.productivity.skillsOverview")}</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillsRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--rowi-muted)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--rowi-muted)", fontSize: 10 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-card)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                />
                <defs>
                  <radialGradient id="radarFill" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor="#31A2E3" stopOpacity={0.45} />
                    <stop offset="70%" stopColor="#E53935" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D797CF" stopOpacity={0.25} />
                  </radialGradient>
                </defs>
                <Radar name={t("admin.hr.productivity.score")} dataKey="value" stroke="#E53935" fill="url(#radarFill)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Stats Cards */}
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{t("admin.hr.productivity.departmentDetails")}</h3>
          <div className="space-y-3">
            {deptStats.map((dept) => (
              <div key={dept.department} className="p-3 rounded-lg bg-[var(--rowi-muted)]/5 hover:bg-[var(--rowi-muted)]/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--rowi-foreground)]">{dept.department}</span>
                  <span className={`text-lg font-bold ${getScoreColor(dept.avgScore)}`}>{dept.avgScore}%</span>
                </div>
                <div className="h-2 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${getScoreBg(dept.avgScore)} transition-all duration-500`} style={{ width: `${dept.avgScore}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{dept.employees} {t("admin.hr.productivity.employees")}</span>
                  <span>{dept.completedTasks}/{dept.totalTasks} {t("admin.hr.productivity.tasks")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.hr.productivity.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProductivity.map((emp) => (
            <div key={emp.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5 hover:border-[var(--rowi-primary)]/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center text-white font-bold">
                    {emp.employeeName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--rowi-foreground)]">{emp.employeeName}</h3>
                    <p className="text-xs text-[var(--rowi-muted)]">{emp.employeePosition} • {emp.employeeDepartment}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(emp.productivityScore)}`}>{emp.productivityScore}%</p>
                  <span className="flex items-center justify-end gap-1 text-xs">
                    <TrendIcon trend={emp.trend} />
                    <span className={emp.trend === "up" ? "text-green-500" : emp.trend === "down" ? "text-red-500" : "text-[var(--rowi-muted)]"}>
                      {t(`admin.hr.productivity.trend.${emp.trend}`)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1 text-[var(--rowi-muted)]">
                  <CheckCircle className="w-4 h-4" />
                  <span>{emp.tasksCompleted}/{emp.tasksAssigned} {t("admin.hr.productivity.tasks")}</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--rowi-muted)]">
                  <Clock className="w-4 h-4" />
                  <span>{emp.hoursWorked}h</span>
                </div>
              </div>

              {/* Mini trend chart using recharts */}
              <div className="h-16 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emp.weeklyData.map((v, i) => ({ day: i + 1, value: v }))}>
                    <defs>
                      <linearGradient id={`miniGrad-${emp.id}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#31A2E3" />
                        <stop offset="100%" stopColor="#D797CF" />
                      </linearGradient>
                    </defs>
                    <Line type="monotone" dataKey="value" stroke={`url(#miniGrad-${emp.id})`} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-1">
                {emp.topSkills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 text-xs rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
