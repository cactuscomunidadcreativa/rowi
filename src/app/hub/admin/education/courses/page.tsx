"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Users,
  Clock,
  MoreVertical,
  Eye,
  EyeOff,
  Play,
  CheckCircle,
  Star,
  BarChart3,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  duration: number; // in minutes
  lessons: number;
  enrollments: number;
  completionRate: number;
  rating: number;
  isPublished: boolean;
  createdAt: string;
  thumbnail?: string;
}

const DEFAULT_COURSES: Course[] = [
  { id: "1", title: "Inteligencia Emocional en el Trabajo", description: "Aprende a gestionar tus emociones y las de tu equipo", instructor: "Dr. María González", category: "Soft Skills", duration: 240, lessons: 12, enrollments: 156, completionRate: 78, rating: 4.8, isPublished: true, createdAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: "2", title: "Liderazgo Transformacional", description: "Desarrolla habilidades de liderazgo moderno", instructor: "Carlos Méndez", category: "Liderazgo", duration: 180, lessons: 8, enrollments: 89, completionRate: 65, rating: 4.5, isPublished: true, createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
  { id: "3", title: "Comunicación Asertiva", description: "Mejora tu comunicación interpersonal", instructor: "Ana Ruiz", category: "Comunicación", duration: 120, lessons: 6, enrollments: 234, completionRate: 82, rating: 4.9, isPublished: true, createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: "4", title: "Gestión del Tiempo", description: "Optimiza tu productividad diaria", instructor: "Roberto Torres", category: "Productividad", duration: 90, lessons: 5, enrollments: 312, completionRate: 71, rating: 4.6, isPublished: true, createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: "5", title: "Mindfulness Corporativo", description: "Técnicas de atención plena para el trabajo", instructor: "Laura Sánchez", category: "Bienestar", duration: 150, lessons: 10, enrollments: 0, completionRate: 0, rating: 0, isPublished: false, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Soft Skills": "bg-purple-500/20 text-purple-500",
  "Liderazgo": "bg-blue-500/20 text-blue-500",
  "Comunicación": "bg-green-500/20 text-green-500",
  "Productividad": "bg-amber-500/20 text-amber-500",
  "Bienestar": "bg-pink-500/20 text-pink-500",
};

export default function CoursesPage() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/education/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || DEFAULT_COURSES);
      } else {
        setCourses(DEFAULT_COURSES);
      }
    } catch {
      setCourses(DEFAULT_COURSES);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.isPublished).length,
    totalEnrollments: courses.reduce((sum, c) => sum + c.enrollments, 0),
    avgCompletion: courses.filter((c) => c.isPublished && c.enrollments > 0).reduce((sum, c, _, arr) => sum + c.completionRate / arr.length, 0),
  };

  const togglePublish = (id: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, isPublished: !c.isPublished } : c)));
    toast.success(t("admin.education.courses.statusUpdated"));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            {t("admin.education.courses.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.education.courses.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadCourses()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.education.courses.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><BookOpen className="w-4 h-4" /><span className="text-xs">{t("admin.education.courses.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.education.courses.stats.published")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.published}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.education.courses.stats.enrollments")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.totalEnrollments}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><BarChart3 className="w-4 h-4" /><span className="text-xs">{t("admin.education.courses.stats.avgCompletion")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.avgCompletion.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.education.courses.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className={`bg-[var(--rowi-card)] rounded-xl border transition-all ${course.isPublished ? "border-[var(--rowi-border)]" : "border-[var(--rowi-border)] opacity-60"}`}>
              <div className="h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-t-xl flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-indigo-500/50" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[course.category] || "bg-gray-500/20 text-gray-500"}`}>
                    {course.category}
                  </span>
                  <button onClick={() => togglePublish(course.id)} className={`p-1 rounded ${course.isPublished ? "text-green-500" : "text-[var(--rowi-muted)]"}`}>
                    {course.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <h3 className="font-semibold text-[var(--rowi-foreground)] mb-1">{course.title}</h3>
                <p className="text-xs text-[var(--rowi-muted)] mb-3 line-clamp-2">{course.description}</p>
                <p className="text-xs text-[var(--rowi-muted)] mb-3">{course.instructor}</p>

                <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)] mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(course.duration)}</span>
                  <span className="flex items-center gap-1"><Play className="w-3 h-3" />{course.lessons} {t("admin.education.courses.lessons")}</span>
                </div>

                {course.isPublished && course.enrollments > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--rowi-border)]">
                    <span className="text-xs text-[var(--rowi-muted)]">{course.enrollments} {t("admin.education.courses.enrolled")}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-[var(--rowi-foreground)]">{course.rating.toFixed(1)}</span>
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
