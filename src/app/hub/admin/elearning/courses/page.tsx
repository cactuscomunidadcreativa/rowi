// src/app/hub/admin/elearning/courses/page.tsx
// ============================================================
// Courses Admin - Gestión de cursos de inteligencia emocional
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import { toast } from "sonner";
import {
  GraduationCap,
  Loader2,
  Users,
  Clock,
  Star,
  Plus,
  Search,
  BookOpen,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  Edit2,
  Eye,
  Trash2,
  X,
  Save,
  Image,
  FileText,
  Tag,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  lessons: number;
  enrollments: number;
  completionRate: number;
  rating: number;
  status: "draft" | "published" | "archived";
  thumbnail?: string;
}

// Demo data
const DEMO_COURSES: Course[] = [
  {
    id: "1",
    title: "Fundamentos de Inteligencia Emocional",
    description: "Aprende los conceptos básicos del modelo Six Seconds para el desarrollo de la IE",
    category: "Fundamentos",
    duration: 120,
    lessons: 8,
    enrollments: 234,
    completionRate: 78,
    rating: 4.8,
    status: "published",
  },
  {
    id: "2",
    title: "Navegando Emociones en el Trabajo",
    description: "Estrategias para manejar emociones en entornos profesionales",
    category: "Liderazgo",
    duration: 90,
    lessons: 6,
    enrollments: 156,
    completionRate: 65,
    rating: 4.6,
    status: "published",
  },
  {
    id: "3",
    title: "Liderazgo con Inteligencia Emocional",
    description: "Desarrolla habilidades de liderazgo basadas en IE",
    category: "Liderazgo",
    duration: 180,
    lessons: 12,
    enrollments: 89,
    completionRate: 45,
    rating: 4.9,
    status: "published",
  },
  {
    id: "4",
    title: "Brain Talents: Descubre tu Potencial",
    description: "Identifica y desarrolla tus talentos cerebrales únicos",
    category: "Brain Talents",
    duration: 60,
    lessons: 4,
    enrollments: 45,
    completionRate: 82,
    rating: 4.7,
    status: "draft",
  },
  {
    id: "5",
    title: "Comunicación Empática",
    description: "Mejora tus habilidades de comunicación con empatía",
    category: "Competencias",
    duration: 75,
    lessons: 5,
    enrollments: 178,
    completionRate: 72,
    rating: 4.5,
    status: "published",
  },
];

const CATEGORIES = [
  "Fundamentos",
  "Liderazgo",
  "Brain Talents",
  "Competencias",
  "Outcomes",
  "Bienestar",
];

export default function CoursesAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Fundamentos",
    duration: 60,
    lessons: 1,
    status: "draft" as Course["status"],
  });

  const txt = {
    title: locale === "en" ? "Courses" : "Cursos",
    subtitle: locale === "en" ? "Manage emotional intelligence courses" : "Gestiona los cursos de inteligencia emocional",
    loading: locale === "en" ? "Loading courses..." : "Cargando cursos...",
    search: locale === "en" ? "Search courses..." : "Buscar cursos...",
    newCourse: locale === "en" ? "New Course" : "Nuevo Curso",
    totalCourses: locale === "en" ? "Total Courses" : "Total Cursos",
    enrollments: locale === "en" ? "Enrollments" : "Inscripciones",
    avgCompletion: locale === "en" ? "Avg. Completion" : "Completado Prom.",
    avgRating: locale === "en" ? "Avg. Rating" : "Rating Promedio",
    all: locale === "en" ? "All" : "Todos",
    published: locale === "en" ? "Published" : "Publicados",
    draft: locale === "en" ? "Draft" : "Borrador",
    archived: locale === "en" ? "Archived" : "Archivados",
    lessons: locale === "en" ? "lessons" : "lecciones",
    min: locale === "en" ? "min" : "min",
    students: locale === "en" ? "students" : "estudiantes",
    completion: locale === "en" ? "completion" : "completado",
    edit: locale === "en" ? "Edit" : "Editar",
    view: locale === "en" ? "View" : "Ver",
    delete: locale === "en" ? "Delete" : "Eliminar",
    // Modal texts
    createTitle: locale === "en" ? "Create New Course" : "Crear Nuevo Curso",
    editTitle: locale === "en" ? "Edit Course" : "Editar Curso",
    viewTitle: locale === "en" ? "Course Details" : "Detalles del Curso",
    courseTitle: locale === "en" ? "Course Title" : "Título del Curso",
    description: locale === "en" ? "Description" : "Descripción",
    category: locale === "en" ? "Category" : "Categoría",
    duration: locale === "en" ? "Duration (minutes)" : "Duración (minutos)",
    numLessons: locale === "en" ? "Number of Lessons" : "Número de Lecciones",
    status: locale === "en" ? "Status" : "Estado",
    save: locale === "en" ? "Save" : "Guardar",
    cancel: locale === "en" ? "Cancel" : "Cancelar",
    close: locale === "en" ? "Close" : "Cerrar",
    created: locale === "en" ? "Course created successfully" : "Curso creado exitosamente",
    updated: locale === "en" ? "Course updated successfully" : "Curso actualizado exitosamente",
    deleted: locale === "en" ? "Course deleted successfully" : "Curso eliminado exitosamente",
    confirmDelete: locale === "en" ? "Are you sure you want to delete this course?" : "¿Estás seguro de que quieres eliminar este curso?",
    titlePlaceholder: locale === "en" ? "Enter course title..." : "Ingresa el título del curso...",
    descPlaceholder: locale === "en" ? "Describe what students will learn..." : "Describe lo que los estudiantes aprenderán...",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(DEMO_COURSES);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalCourses: courses.length,
    totalEnrollments: courses.reduce((sum, c) => sum + c.enrollments, 0),
    avgCompletionRate: courses.length > 0
      ? (courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length).toFixed(1)
      : 0,
    avgRating: courses.length > 0
      ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1)
      : 0,
  };

  const getStatusBadge = (status: Course["status"]) => {
    const styles = {
      published: "bg-[var(--rowi-success)]/10 text-[var(--rowi-success)]",
      draft: "bg-[var(--rowi-warning)]/10 text-[var(--rowi-warning)]",
      archived: "bg-[var(--rowi-muted)]/20 text-[var(--rowi-muted)]",
    };
    const labels = {
      published: locale === "en" ? "Published" : "Publicado",
      draft: locale === "en" ? "Draft" : "Borrador",
      archived: locale === "en" ? "Archived" : "Archivado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  function openCreateModal() {
    setForm({
      title: "",
      description: "",
      category: "Fundamentos",
      duration: 60,
      lessons: 1,
      status: "draft",
    });
    setSelectedCourse(null);
    setModalMode("create");
    setShowModal(true);
  }

  function openEditModal(course: Course) {
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      duration: course.duration,
      lessons: course.lessons,
      status: course.status,
    });
    setSelectedCourse(course);
    setModalMode("edit");
    setShowModal(true);
  }

  function openViewModal(course: Course) {
    setSelectedCourse(course);
    setModalMode("view");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error(locale === "en" ? "Title is required" : "El título es requerido");
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 500)); // Simulate API call

    if (modalMode === "create") {
      const newCourse: Course = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description,
        category: form.category,
        duration: form.duration,
        lessons: form.lessons,
        enrollments: 0,
        completionRate: 0,
        rating: 0,
        status: form.status,
      };
      setCourses([newCourse, ...courses]);
      toast.success(txt.created);
    } else if (modalMode === "edit" && selectedCourse) {
      setCourses(courses.map(c =>
        c.id === selectedCourse.id
          ? { ...c, ...form }
          : c
      ));
      toast.success(txt.updated);
    }

    setSaving(false);
    setShowModal(false);
  }

  function handleDelete(course: Course) {
    if (confirm(txt.confirmDelete)) {
      setCourses(courses.filter(c => c.id !== course.id));
      toast.success(txt.deleted);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--rowi-muted)]">
          <GraduationCap className="w-16 h-16 text-[var(--rowi-primary)] animate-pulse" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--rowi-primary)]/20">
            <GraduationCap className="w-7 h-7 text-[var(--rowi-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">{txt.title}</h1>
            <p className="text-[var(--rowi-muted)] text-sm">{txt.subtitle}</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] hover:opacity-90 transition-colors text-white text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {txt.newCourse}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-primary)]/10">
              <BookOpen className="w-5 h-5 text-[var(--rowi-primary)]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.totalCourses}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.totalCourses}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-success)]/10">
              <Users className="w-5 h-5 text-[var(--rowi-success)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +18%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.totalEnrollments}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.enrollments}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-secondary)]/10">
              <TrendingUp className="w-5 h-5 text-[var(--rowi-secondary)]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.avgCompletionRate}%</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.avgCompletion}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-warning)]/10">
              <Star className="w-5 h-5 text-[var(--rowi-warning)]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.avgRating}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.avgRating}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-muted)]" />
          <input
            type="text"
            placeholder={txt.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] text-[var(--rowi-foreground)] placeholder-[var(--rowi-muted)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "published", "draft", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-surface)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-background)] border border-[var(--rowi-border)]"
              }`}
            >
              {txt[status as keyof typeof txt]}
            </button>
          ))}
        </div>
      </div>

      {/* Courses List */}
      <div className="grid gap-4">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm hover:border-[var(--rowi-borderHover)] transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Thumbnail placeholder */}
              <div className="w-full md:w-48 h-28 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)]/20 to-[var(--rowi-secondary)]/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-12 h-12 text-[var(--rowi-primary)]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                        {course.title}
                      </h3>
                      {getStatusBadge(course.status)}
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)] mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--rowi-muted)]">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lessons} {txt.lessons}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration} {txt.min}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrollments} {txt.students}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {course.completionRate}% {txt.completion}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[var(--rowi-warning)]" />
                        {course.rating}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openViewModal(course)}
                      className="p-2 rounded-lg hover:bg-[var(--rowi-background)] transition-colors text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                      title={txt.view}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-2 rounded-lg hover:bg-[var(--rowi-background)] transition-colors text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                      title={txt.edit}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="p-2 rounded-lg hover:bg-[var(--rowi-error)]/10 transition-colors text-[var(--rowi-muted)] hover:text-[var(--rowi-error)]"
                      title={txt.delete}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 mx-auto text-[var(--rowi-muted)] mb-4" />
          <p className="text-[var(--rowi-muted)]">
            {locale === "en" ? "No courses found" : "No se encontraron cursos"}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-[var(--rowi-surface)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[var(--rowi-border)]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--rowi-border)]">
              <h2 className="text-xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-[var(--rowi-primary)]" />
                {modalMode === "create" ? txt.createTitle : modalMode === "edit" ? txt.editTitle : txt.viewTitle}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--rowi-background)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--rowi-muted)]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {modalMode === "view" && selectedCourse ? (
                // View Mode
                <div className="space-y-6">
                  <div className="w-full h-40 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)]/20 to-[var(--rowi-secondary)]/20 flex items-center justify-center">
                    <GraduationCap className="w-20 h-20 text-[var(--rowi-primary)]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-[var(--rowi-foreground)]">{selectedCourse.title}</h3>
                      {getStatusBadge(selectedCourse.status)}
                    </div>
                    <p className="text-[var(--rowi-muted)]">{selectedCourse.description}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[var(--rowi-background)] rounded-xl p-4 text-center">
                      <BookOpen className="w-6 h-6 mx-auto mb-2 text-[var(--rowi-primary)]" />
                      <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{selectedCourse.lessons}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{txt.lessons}</p>
                    </div>
                    <div className="bg-[var(--rowi-background)] rounded-xl p-4 text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-[var(--rowi-secondary)]" />
                      <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{selectedCourse.duration}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{txt.min}</p>
                    </div>
                    <div className="bg-[var(--rowi-background)] rounded-xl p-4 text-center">
                      <Users className="w-6 h-6 mx-auto mb-2 text-[var(--rowi-success)]" />
                      <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{selectedCourse.enrollments}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{txt.students}</p>
                    </div>
                    <div className="bg-[var(--rowi-background)] rounded-xl p-4 text-center">
                      <Star className="w-6 h-6 mx-auto mb-2 text-[var(--rowi-warning)]" />
                      <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{selectedCourse.rating}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">Rating</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] text-sm font-medium">
                      <Tag className="w-4 h-4 inline mr-1" />
                      {selectedCourse.category}
                    </span>
                    <span className="text-sm text-[var(--rowi-muted)]">
                      {selectedCourse.completionRate}% {txt.completion}
                    </span>
                  </div>
                </div>
              ) : (
                // Create/Edit Mode
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      {txt.courseTitle} *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder={txt.titlePlaceholder}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] placeholder-[var(--rowi-muted)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
                      {txt.description}
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder={txt.descPlaceholder}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] placeholder-[var(--rowi-muted)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20 resize-none"
                    />
                  </div>

                  {/* Category and Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
                        <Tag className="w-4 h-4 inline mr-2" />
                        {txt.category}
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
                        {txt.status}
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as Course["status"] })}
                        className="w-full px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                      >
                        <option value="draft">{txt.draft}</option>
                        <option value="published">{txt.published}</option>
                        <option value="archived">{txt.archived}</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration and Lessons */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        {txt.duration}
                      </label>
                      <input
                        type="number"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                        min={1}
                        className="w-full px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
                        <BookOpen className="w-4 h-4 inline mr-2" />
                        {txt.numLessons}
                      </label>
                      <input
                        type="number"
                        value={form.lessons}
                        onChange={(e) => setForm({ ...form, lessons: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="w-full px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--rowi-border)]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-background)] transition-colors font-medium"
              >
                {modalMode === "view" ? txt.close : txt.cancel}
              </button>
              {modalMode !== "view" && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] hover:opacity-90 disabled:opacity-50 transition-colors text-white font-medium"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {txt.save}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
