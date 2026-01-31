"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  HelpCircle,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  FileQuestion,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  Target,
  Award,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  questionsCount: number;
  timeLimit: number; // in minutes
  passingScore: number;
  attempts: number;
  avgScore: number;
  passRate: number;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_QUIZZES: Quiz[] = [
  { id: "1", title: "Evaluación Final - Inteligencia Emocional", description: "Evaluación completa del curso", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", questionsCount: 20, timeLimit: 30, passingScore: 70, attempts: 145, avgScore: 82, passRate: 85, isActive: true, createdAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: "2", title: "Quiz Módulo 1 - Autoconciencia", description: "Evaluación del primer módulo", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", questionsCount: 10, timeLimit: 15, passingScore: 60, attempts: 156, avgScore: 78, passRate: 92, isActive: true, createdAt: new Date(Date.now() - 86400000 * 175).toISOString() },
  { id: "3", title: "Evaluación Liderazgo", description: "Test de conocimientos de liderazgo", courseId: "c2", courseName: "Liderazgo Transformacional", questionsCount: 15, timeLimit: 20, passingScore: 70, attempts: 89, avgScore: 75, passRate: 78, isActive: true, createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
  { id: "4", title: "Test Comunicación Asertiva", description: "Evaluación de habilidades comunicativas", courseId: "c3", courseName: "Comunicación Asertiva", questionsCount: 12, timeLimit: 15, passingScore: 65, attempts: 234, avgScore: 86, passRate: 94, isActive: true, createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: "5", title: "Quiz Beta - Mindfulness", description: "Quiz en desarrollo", courseId: "c5", courseName: "Mindfulness Corporativo", questionsCount: 8, timeLimit: 10, passingScore: 60, attempts: 0, avgScore: 0, passRate: 0, isActive: false, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

export default function QuizzesPage() {
  const { t } = useI18n();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/education/quizzes");
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || DEFAULT_QUIZZES);
      } else {
        setQuizzes(DEFAULT_QUIZZES);
      }
    } catch {
      setQuizzes(DEFAULT_QUIZZES);
    } finally {
      setLoading(false);
    }
  }

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()) || q.courseName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: quizzes.length,
    active: quizzes.filter((q) => q.isActive).length,
    totalAttempts: quizzes.reduce((sum, q) => sum + q.attempts, 0),
    avgPassRate: quizzes.filter((q) => q.isActive && q.attempts > 0).reduce((sum, q, _, arr) => sum + q.passRate / arr.length, 0),
  };

  const toggleActive = (id: string) => {
    setQuizzes((prev) => prev.map((q) => (q.id === id ? { ...q, isActive: !q.isActive } : q)));
    toast.success(t("admin.education.quizzes.statusUpdated"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-amber-500" />
            {t("admin.education.quizzes.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.education.quizzes.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadQuizzes()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.education.quizzes.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><FileQuestion className="w-4 h-4" /><span className="text-xs">{t("admin.education.quizzes.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.education.quizzes.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.active}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.education.quizzes.stats.attempts")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.totalAttempts}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><Target className="w-4 h-4" /><span className="text-xs">{t("admin.education.quizzes.stats.passRate")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.avgPassRate.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.education.quizzes.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className={`bg-[var(--rowi-card)] rounded-xl border transition-all ${quiz.isActive ? "border-[var(--rowi-border)]" : "border-[var(--rowi-border)] opacity-60"}`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{quiz.title}</h3>
                      <button onClick={() => toggleActive(quiz.id)} className={`p-1 rounded ${quiz.isActive ? "text-green-500" : "text-[var(--rowi-muted)]"}`}>
                        {quiz.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)] mb-2">{quiz.description}</p>
                    <p className="text-xs text-[var(--rowi-muted)]">{quiz.courseName}</p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[var(--rowi-muted)]/10">
                    <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                  </button>
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--rowi-border)] text-sm">
                  <div className="flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-[var(--rowi-muted)]" />
                    <span className="text-[var(--rowi-foreground)]">{quiz.questionsCount} {t("admin.education.quizzes.questions")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--rowi-muted)]" />
                    <span className="text-[var(--rowi-foreground)]">{quiz.timeLimit} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[var(--rowi-muted)]" />
                    <span className="text-[var(--rowi-foreground)]">{quiz.passingScore}% {t("admin.education.quizzes.toPass")}</span>
                  </div>
                </div>

                {quiz.isActive && quiz.attempts > 0 && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--rowi-border)] text-sm">
                    <div>
                      <p className="text-xs text-[var(--rowi-muted)]">{t("admin.education.quizzes.attempts")}</p>
                      <p className="font-medium text-[var(--rowi-foreground)]">{quiz.attempts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--rowi-muted)]">{t("admin.education.quizzes.avgScore")}</p>
                      <p className="font-medium text-[var(--rowi-foreground)]">{quiz.avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--rowi-muted)]">{t("admin.education.quizzes.passRate")}</p>
                      <p className={`font-medium ${quiz.passRate >= 70 ? "text-green-500" : "text-amber-500"}`}>{quiz.passRate}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
