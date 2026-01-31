"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Star,
  Calendar,
  User,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Target,
  MessageSquare,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Review {
  id: string;
  employeeName: string;
  employeePosition: string;
  employeeDepartment: string;
  reviewerName: string;
  reviewType: "annual" | "quarterly" | "probation" | "project";
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  scheduledDate: string;
  completedDate?: string;
  overallRating?: number;
  goals?: number;
  goalsAchieved?: number;
  feedback?: string;
}

const DEFAULT_REVIEWS: Review[] = [
  { id: "1", employeeName: "Juan García", employeePosition: "Senior Developer", employeeDepartment: "Tecnología", reviewerName: "María López", reviewType: "annual", status: "completed", scheduledDate: new Date(Date.now() - 86400000 * 30).toISOString(), completedDate: new Date(Date.now() - 86400000 * 25).toISOString(), overallRating: 4.5, goals: 5, goalsAchieved: 4, feedback: "Excelente desempeño técnico" },
  { id: "2", employeeName: "Carlos Ruiz", employeePosition: "UX Designer", employeeDepartment: "Diseño", reviewerName: "Ana Martínez", reviewType: "quarterly", status: "completed", scheduledDate: new Date(Date.now() - 86400000 * 15).toISOString(), completedDate: new Date(Date.now() - 86400000 * 10).toISOString(), overallRating: 4.0, goals: 4, goalsAchieved: 3 },
  { id: "3", employeeName: "Pedro Sánchez", employeePosition: "Sales Executive", employeeDepartment: "Ventas", reviewerName: "Laura Torres", reviewType: "quarterly", status: "in_progress", scheduledDate: new Date(Date.now() - 86400000 * 5).toISOString(), goals: 6, goalsAchieved: 4 },
  { id: "4", employeeName: "Roberto Méndez", employeePosition: "Junior Developer", employeeDepartment: "Tecnología", reviewerName: "María López", reviewType: "probation", status: "scheduled", scheduledDate: new Date(Date.now() + 86400000 * 15).toISOString(), goals: 3 },
  { id: "5", employeeName: "Sofía Herrera", employeePosition: "Content Writer", employeeDepartment: "Marketing", reviewerName: "Director Marketing", reviewType: "project", status: "overdue", scheduledDate: new Date(Date.now() - 86400000 * 10).toISOString(), goals: 4 },
  { id: "6", employeeName: "Laura Torres", employeePosition: "Sales Manager", employeeDepartment: "Ventas", reviewerName: "Director Comercial", reviewType: "annual", status: "scheduled", scheduledDate: new Date(Date.now() + 86400000 * 30).toISOString(), goals: 8 },
];

const STATUS_CONFIG = {
  scheduled: { label: "Programada", color: "bg-blue-500/20 text-blue-500", icon: Calendar },
  in_progress: { label: "En Progreso", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  completed: { label: "Completada", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  overdue: { label: "Vencida", color: "bg-red-500/20 text-red-500", icon: AlertCircle },
};

const TYPE_CONFIG = {
  annual: { label: "Anual", color: "text-purple-500" },
  quarterly: { label: "Trimestral", color: "text-blue-500" },
  probation: { label: "Periodo Prueba", color: "text-amber-500" },
  project: { label: "Proyecto", color: "text-green-500" },
};

export default function ReviewsPage() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hr/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || DEFAULT_REVIEWS);
      } else {
        setReviews(DEFAULT_REVIEWS);
      }
    } catch {
      setReviews(DEFAULT_REVIEWS);
    } finally {
      setLoading(false);
    }
  }

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch = r.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    completed: reviews.filter((r) => r.status === "completed").length,
    pending: reviews.filter((r) => r.status === "scheduled" || r.status === "in_progress").length,
    overdue: reviews.filter((r) => r.status === "overdue").length,
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`w-3 h-3 ${star <= rating ? "text-amber-500 fill-amber-500" : star - 0.5 <= rating ? "text-amber-500 fill-amber-500/50" : "text-[var(--rowi-muted)]"}`} />
        ))}
        <span className="ml-1 text-xs text-[var(--rowi-foreground)]">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-purple-500" />
            {t("admin.hr.reviews.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.hr.reviews.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadReviews()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.hr.reviews.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><ClipboardCheck className="w-4 h-4" /><span className="text-xs">{t("admin.hr.reviews.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.reviews.stats.completed")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.completed}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.hr.reviews.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pending}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2"><AlertCircle className="w-4 h-4" /><span className="text-xs">{t("admin.hr.reviews.stats.overdue")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.overdue}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.hr.reviews.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.hr.reviews.allStatus")}</option>
          <option value="scheduled">{t("admin.hr.reviews.statusScheduled")}</option>
          <option value="in_progress">{t("admin.hr.reviews.statusInProgress")}</option>
          <option value="completed">{t("admin.hr.reviews.statusCompleted")}</option>
          <option value="overdue">{t("admin.hr.reviews.statusOverdue")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const statusInfo = STATUS_CONFIG[review.status];
            const typeInfo = TYPE_CONFIG[review.reviewType];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={review.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{review.employeeName}</h3>
                      <span className={`text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)]">{review.employeePosition} • {review.employeeDepartment}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--rowi-muted)]">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{t("admin.hr.reviews.reviewer")}: {review.reviewerName}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(review.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[var(--rowi-muted)]/10">
                    <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                  </button>
                </div>

                {(review.status === "completed" || review.status === "in_progress") && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--rowi-border)]">
                    {review.overallRating && (
                      <div>
                        <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.hr.reviews.rating")}</p>
                        {renderStars(review.overallRating)}
                      </div>
                    )}
                    {review.goals && (
                      <div>
                        <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.hr.reviews.goals")}</p>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-[var(--rowi-muted)]" />
                          <span className="text-sm text-[var(--rowi-foreground)]">{review.goalsAchieved || 0}/{review.goals}</span>
                        </div>
                      </div>
                    )}
                    {review.feedback && (
                      <div className="flex-1">
                        <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.hr.reviews.feedback")}</p>
                        <p className="text-sm text-[var(--rowi-foreground)] italic">"{review.feedback}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
