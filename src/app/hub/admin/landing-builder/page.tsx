"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Layers,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Wand2,
  LayoutTemplate,
  Sparkles,
  ExternalLink,
  Settings2,
  Palette,
  Type,
  Image as ImageIcon,
  Code2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminEmpty,
} from "@/components/admin/AdminPage";

/* =========================================================
   🎨 Landing Page Builder — CMS Visual estilo Elementor
   ---------------------------------------------------------
   Editor visual para construir y personalizar la landing page.
========================================================= */

interface LandingSection {
  id: string;
  type: string;
  order: number;
  isVisible: boolean;
  config: Record<string, any>;
  content: Record<string, any>;
  name?: string;
  description?: string;
}

const SECTION_TYPES = [
  { value: "NAVBAR", label: "Navbar", icon: "🧭" },
  { value: "HERO", label: "Hero", icon: "🚀" },
  { value: "FEATURES", label: "Features", icon: "✨" },
  { value: "HOW_IT_WORKS", label: "Cómo Funciona", icon: "📋" },
  { value: "TESTIMONIALS", label: "Testimonios", icon: "💬" },
  { value: "PRICING", label: "Precios", icon: "💰" },
  { value: "CTA", label: "Call to Action", icon: "📢" },
  { value: "STATS", label: "Estadísticas", icon: "📊" },
  { value: "FAQ", label: "FAQ", icon: "❓" },
  { value: "LOGOS", label: "Logos", icon: "🏢" },
  { value: "FOOTER", label: "Footer", icon: "📍" },
  { value: "CUSTOM", label: "Personalizado", icon: "🔧" },
];

const LANGUAGES = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

export default function LandingBuilderPage() {
  const { t, ready } = useI18n();
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<LandingSection | null>(null);
  const [editMode, setEditMode] = useState<"content" | "config">("content");
  const [currentLang, setCurrentLang] = useState("es");
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Cargar secciones
  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/landing-builder");
      const data = await res.json();
      if (data.ok) {
        setSections(data.sections || []);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || "Error loading sections");
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar landing si está vacía
  const initializeLanding = async () => {
    try {
      const res = await fetch("/api/admin/landing-builder/init", {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Landing inicializada con ${data.created || data.existing} secciones`);
        loadSections();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (ready) loadSections();
  }, [ready, loadSections]);

  // Guardar cambios de una sección
  const saveSection = async (section: LandingSection) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/landing-builder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Sección guardada");
      loadSections();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle visibilidad
  const toggleVisibility = async (section: LandingSection) => {
    await saveSection({ ...section, isVisible: !section.isVisible });
  };

  // Eliminar sección
  const deleteSection = async (id: string) => {
    if (!confirm("¿Eliminar esta sección?")) return;
    try {
      const res = await fetch("/api/admin/landing-builder", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Sección eliminada");
      setSelectedSection(null);
      loadSections();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Crear nueva sección
  const createSection = async (type: string) => {
    try {
      const typeInfo = SECTION_TYPES.find((t) => t.value === type);
      const res = await fetch("/api/admin/landing-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: typeInfo?.label || type,
          content: {
            es: {},
            en: {},
          },
          config: {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Sección creada");
      setShowAddModal(false);
      loadSections();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Reordenar secciones con drag & drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const draggedSection = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);

    setSections(newSections);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const orderedIds = sections.map((s) => s.id);
      await fetch("/api/admin/landing-builder/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      toast.success("Orden actualizado");
    } catch (e: any) {
      toast.error("Error al reordenar");
    }

    setDraggedIndex(null);
  };

  // Actualizar contenido del editor
  const updateContent = (key: string, value: any) => {
    if (!selectedSection) return;

    const updatedContent = {
      ...selectedSection.content,
      [currentLang]: {
        ...selectedSection.content[currentLang],
        [key]: value,
      },
    };

    setSelectedSection({
      ...selectedSection,
      content: updatedContent,
    });
  };

  // Actualizar config
  const updateConfig = (key: string, value: any) => {
    if (!selectedSection) return;

    setSelectedSection({
      ...selectedSection,
      config: {
        ...selectedSection.config,
        [key]: value,
      },
    });
  };

  const getSectionIcon = (type: string) => {
    return SECTION_TYPES.find((t) => t.value === type)?.icon || "📦";
  };

  return (
    <AdminPage
      titleKey="admin.landingBuilder.title"
      descriptionKey="admin.landingBuilder.description"
      icon={Layers}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Vista previa
          </a>
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadSections}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton
            variant="secondary"
            icon={Wand2}
            onClick={initializeLanding}
            size="sm"
          >
            Inicializar
          </AdminButton>
          <AdminButton
            icon={PlusCircle}
            onClick={() => setShowAddModal(true)}
            size="sm"
          >
            Nueva sección
          </AdminButton>
        </div>
      }
    >
      {sections.length === 0 ? (
        <AdminEmpty
          icon={LayoutTemplate}
          titleKey="admin.landingBuilder.empty"
          descriptionKey="admin.landingBuilder.emptyDescription"
        >
          <AdminButton icon={Wand2} onClick={initializeLanding} className="mt-4">
            Inicializar Landing Page
          </AdminButton>
        </AdminEmpty>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de secciones (izquierda) */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-[var(--rowi-muted)] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Secciones ({sections.length})
            </h3>

            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedSection(section)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${selectedSection?.id === section.id
                    ? "bg-[var(--rowi-primary)]/10 border-2 border-[var(--rowi-primary)]"
                    : "bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]/50"
                  }
                  ${!section.isVisible ? "opacity-50" : ""}
                  ${draggedIndex === index ? "scale-105 shadow-lg" : ""}
                `}
              >
                <div className="cursor-grab active:cursor-grabbing text-[var(--rowi-muted)]">
                  <GripVertical className="w-4 h-4" />
                </div>

                <span className="text-xl">{getSectionIcon(section.type)}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                    {section.name || section.type}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {section.type}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(section);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      section.isVisible
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
                    }`}
                  >
                    {section.isVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Editor de sección (derecha) */}
          <div className="lg:col-span-2">
            {selectedSection ? (
              <AdminCard>
                {/* Header del editor */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getSectionIcon(selectedSection.type)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--rowi-foreground)]">
                        {selectedSection.name || selectedSection.type}
                      </h3>
                      <p className="text-xs text-[var(--rowi-muted)]">
                        ID: {selectedSection.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteSection(selectedSection.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedSection(null)}
                      className="p-2 rounded-lg text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs: Contenido / Configuración */}
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={() => setEditMode("content")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editMode === "content"
                        ? "bg-[var(--rowi-primary)] text-white"
                        : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    Contenido
                  </button>
                  <button
                    onClick={() => setEditMode("config")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editMode === "config"
                        ? "bg-[var(--rowi-primary)] text-white"
                        : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                    }`}
                  >
                    <Settings2 className="w-4 h-4" />
                    Configuración
                  </button>

                  {/* Selector de idioma */}
                  {editMode === "content" && (
                    <div className="ml-auto flex items-center gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setCurrentLang(lang.code)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            currentLang === lang.code
                              ? "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] border border-[var(--rowi-primary)]"
                              : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] border border-transparent"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Editor de contenido */}
                {editMode === "content" && (
                  <div className="space-y-4">
                    <SectionContentEditor
                      section={selectedSection}
                      lang={currentLang}
                      onChange={updateContent}
                    />
                  </div>
                )}

                {/* Editor de configuración */}
                {editMode === "config" && (
                  <div className="space-y-4">
                    <SectionConfigEditor
                      section={selectedSection}
                      onChange={updateConfig}
                    />
                  </div>
                )}

                {/* Botón guardar */}
                <div className="flex justify-end mt-6 pt-6 border-t border-[var(--rowi-border)]">
                  <AdminButton
                    icon={Save}
                    onClick={() => saveSection(selectedSection)}
                    loading={saving}
                  >
                    Guardar cambios
                  </AdminButton>
                </div>
              </AdminCard>
            ) : (
              <AdminCard className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-[var(--rowi-muted)] mb-4" />
                  <p className="text-[var(--rowi-muted)]">
                    Selecciona una sección para editarla
                  </p>
                </div>
              </AdminCard>
            )}
          </div>
        </div>
      )}

      {/* Modal agregar sección */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--rowi-card)] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--rowi-foreground)]">
                Nueva Sección
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--rowi-muted)]/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SECTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => createSection(type.value)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--rowi-bg)] border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/5 transition-all text-left"
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

/* =========================================================
   Editor de contenido específico por tipo de sección
========================================================= */
function SectionContentEditor({
  section,
  lang,
  onChange,
}: {
  section: LandingSection;
  lang: string;
  onChange: (key: string, value: any) => void;
}) {
  const content = section.content[lang] || {};

  // Helper para renderizar campos
  const renderField = (key: string, label: string, type: "text" | "textarea" | "json" = "text") => {
    const value = content[key] || "";

    if (type === "textarea") {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium text-[var(--rowi-foreground)]">
            {label}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-[var(--rowi-bg)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none text-sm"
          />
        </div>
      );
    }

    if (type === "json") {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium text-[var(--rowi-foreground)] flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            {label}
          </label>
          <textarea
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(key, parsed);
              } catch {
                // Keep as string if not valid JSON
              }
            }}
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-[var(--rowi-bg)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none font-mono text-xs"
          />
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <label className="text-sm font-medium text-[var(--rowi-foreground)]">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-[var(--rowi-bg)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none text-sm"
        />
      </div>
    );
  };

  // Renderizar campos según el tipo de sección
  switch (section.type) {
    case "NAVBAR":
      return (
        <div className="space-y-4">
          {renderField("brand", "Marca / Logo")}
          {renderField("loginText", "Texto Login")}
          {renderField("ctaText", "Texto CTA")}
          {renderField("links", "Links (JSON)", "json")}
        </div>
      );

    case "HERO":
      return (
        <div className="space-y-4">
          {renderField("badge", "Badge / Etiqueta")}
          {renderField("title1", "Título (parte 1)")}
          {renderField("title2", "Título (parte destacada)")}
          {renderField("subtitle", "Subtítulo", "textarea")}
          {renderField("ctaPrimary", "Botón primario")}
          {renderField("ctaSecondary", "Botón secundario")}
          {renderField("trustBadges", "Trust Badges (JSON)", "json")}
        </div>
      );

    case "FEATURES":
      return (
        <div className="space-y-4">
          {renderField("title1", "Título (parte 1)")}
          {renderField("title2", "Título (parte destacada)")}
          {renderField("subtitle", "Subtítulo", "textarea")}
          {renderField("features", "Features (JSON)", "json")}
        </div>
      );

    case "HOW_IT_WORKS":
      return (
        <div className="space-y-4">
          {renderField("title", "Título")}
          {renderField("subtitle", "Subtítulo")}
          {renderField("steps", "Pasos (JSON)", "json")}
        </div>
      );

    case "TESTIMONIALS":
      return (
        <div className="space-y-4">
          {renderField("title", "Título")}
          {renderField("testimonials", "Testimonios (JSON)", "json")}
        </div>
      );

    case "PRICING":
      return (
        <div className="space-y-4">
          {renderField("title", "Título")}
          {renderField("subtitle", "Subtítulo")}
          {renderField("plans", "Planes (JSON)", "json")}
        </div>
      );

    case "CTA":
      return (
        <div className="space-y-4">
          {renderField("title", "Título")}
          {renderField("subtitle", "Subtítulo", "textarea")}
          {renderField("buttonText", "Texto del botón")}
          {renderField("buttonIcon", "Icono del botón")}
        </div>
      );

    case "FOOTER":
      return (
        <div className="space-y-4">
          {renderField("brand", "Marca")}
          {renderField("copyright", "Copyright")}
          {renderField("links", "Links (JSON)", "json")}
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <p className="text-sm text-[var(--rowi-muted)]">
            Editor genérico. Edita el contenido como JSON:
          </p>
          <textarea
            value={JSON.stringify(content, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                Object.keys(parsed).forEach((key) => {
                  onChange(key, parsed[key]);
                });
              } catch {
                // Invalid JSON
              }
            }}
            rows={15}
            className="w-full px-4 py-3 rounded-lg bg-[var(--rowi-bg)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none font-mono text-xs"
          />
        </div>
      );
  }
}

/* =========================================================
   Editor de configuración visual
========================================================= */
function SectionConfigEditor({
  section,
  onChange,
}: {
  section: LandingSection;
  onChange: (key: string, value: any) => void;
}) {
  const config = section.config || {};

  const renderToggle = (key: string, label: string) => {
    const value = config[key] ?? false;
    return (
      <div key={key} className="flex items-center justify-between py-2">
        <span className="text-sm text-[var(--rowi-foreground)]">{label}</span>
        <button
          onClick={() => onChange(key, !value)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            value ? "bg-[var(--rowi-primary)]" : "bg-[var(--rowi-muted)]/30"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              value ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>
    );
  };

  const renderSelect = (key: string, label: string, options: { value: string; label: string }[]) => {
    const value = config[key] || options[0]?.value;
    return (
      <div key={key} className="space-y-2">
        <label className="text-sm font-medium text-[var(--rowi-foreground)]">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-[var(--rowi-bg)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none text-sm"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderNumber = (key: string, label: string, min = 1, max = 6) => {
    const value = config[key] || min;
    return (
      <div key={key} className="space-y-2">
        <label className="text-sm font-medium text-[var(--rowi-foreground)]">
          {label}: {value}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(key, parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    );
  };

  // Configuraciones comunes
  const commonConfigs = (
    <>
      <div className="border-b border-[var(--rowi-border)] pb-4 mb-4">
        <h4 className="text-sm font-semibold text-[var(--rowi-muted)] mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Visual
        </h4>
        {renderToggle("gradient", "Fondo degradado")}
        {renderSelect("animation", "Animación", [
          { value: "none", label: "Sin animación" },
          { value: "fade-up", label: "Fade Up" },
          { value: "fade-in", label: "Fade In" },
          { value: "slide-in", label: "Slide In" },
        ])}
      </div>
    </>
  );

  // Configuraciones específicas por tipo
  switch (section.type) {
    case "NAVBAR":
      return (
        <div className="space-y-4">
          {renderToggle("fixed", "Fijo en scroll")}
          {renderToggle("transparent", "Fondo transparente")}
          {renderToggle("blur", "Efecto blur")}
        </div>
      );

    case "HERO":
      return (
        <div className="space-y-4">
          {commonConfigs}
          {renderSelect("layout", "Layout", [
            { value: "centered", label: "Centrado" },
            { value: "left", label: "Izquierda" },
            { value: "split", label: "Dividido" },
          ])}
          {renderToggle("showBadge", "Mostrar badge")}
          {renderToggle("showTrustBadges", "Mostrar trust badges")}
        </div>
      );

    case "FEATURES":
      return (
        <div className="space-y-4">
          {commonConfigs}
          {renderNumber("columns", "Columnas", 2, 4)}
          {renderSelect("layout", "Layout", [
            { value: "cards", label: "Cards" },
            { value: "list", label: "Lista" },
            { value: "grid", label: "Grid" },
          ])}
          {renderToggle("showIcons", "Mostrar iconos")}
        </div>
      );

    case "HOW_IT_WORKS":
      return (
        <div className="space-y-4">
          {commonConfigs}
          {renderNumber("columns", "Columnas", 2, 4)}
          {renderToggle("showNumbers", "Mostrar números")}
        </div>
      );

    case "TESTIMONIALS":
      return (
        <div className="space-y-4">
          {commonConfigs}
          {renderNumber("columns", "Columnas", 1, 4)}
          {renderToggle("showRating", "Mostrar estrellas")}
        </div>
      );

    case "PRICING":
      return (
        <div className="space-y-4">
          {commonConfigs}
          {renderNumber("columns", "Columnas", 2, 4)}
          {renderToggle("highlightPro", "Destacar plan Pro")}
        </div>
      );

    case "CTA":
      return (
        <div className="space-y-4">
          {commonConfigs}
          {renderSelect("layout", "Layout", [
            { value: "centered", label: "Centrado" },
            { value: "left", label: "Izquierda" },
          ])}
        </div>
      );

    case "FOOTER":
      return (
        <div className="space-y-4">
          {renderToggle("showSocial", "Mostrar redes sociales")}
          {renderNumber("columns", "Columnas", 2, 5)}
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          {commonConfigs}
          <p className="text-sm text-[var(--rowi-muted)]">
            Configuración genérica. Edita como JSON:
          </p>
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                Object.keys(parsed).forEach((key) => {
                  onChange(key, parsed[key]);
                });
              } catch {
                // Invalid JSON
              }
            }}
            rows={10}
            className="w-full px-4 py-3 rounded-lg bg-[var(--rowi-bg)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none font-mono text-xs"
          />
        </div>
      );
  }
}
