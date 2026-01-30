"use client";

import * as React from "react";
import { Command } from "cmdk";
import {
  Search,
  X,
  Globe,
  MapPin,
  Building2,
  Briefcase,
  Users,
  Calendar,
  GraduationCap,
  Filter,
  Check,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "@/core/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  options: FilterOption[];
  multiSelect?: boolean; // Permitir selección múltiple
}

// Soporte para filtros simples (string) y múltiples (string[])
export type FilterValue = string | string[];

interface SmartFilterCommandProps {
  categories: FilterCategory[];
  selectedFilters: Record<string, FilterValue>;
  onFilterChange: (key: string, value: FilterValue) => void;
  onClearAll: () => void;
  placeholder?: string;
  className?: string;
  multiSelectByDefault?: boolean; // Por defecto permitir multi-selección
}

/**
 * 🔍 Smart Filter Command
 * ----------------------
 * Un command palette inteligente para filtrar datos.
 * - Búsqueda fuzzy por texto
 * - Categorías con iconos
 * - Muestra conteo de registros
 * - Teclas rápidas (Ctrl+K para abrir)
 * - NUEVO: Selección múltiple por categoría
 */
export function SmartFilterCommand({
  categories,
  selectedFilters,
  onFilterChange,
  onClearAll,
  placeholder = "Buscar filtros... (Ctrl+K)",
  className,
  multiSelectByDefault = true,
}: SmartFilterCommandProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Helper para obtener valores seleccionados como array
  const getSelectedValues = (key: string): string[] => {
    const value = selectedFilters[key];
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  };

  // Contar filtros activos (total de valores seleccionados)
  const activeFilterCount = Object.entries(selectedFilters).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length;
    return count + (value ? 1 : 0);
  }, 0);

  // Abrir con Ctrl+K o Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus en input cuando se abre
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (categoryKey: string, value: string, isMultiSelect: boolean) => {
    const currentValues = getSelectedValues(categoryKey);

    if (isMultiSelect) {
      // Multi-selección: toggle del valor en el array
      if (currentValues.includes(value)) {
        // Remover
        const newValues = currentValues.filter(v => v !== value);
        onFilterChange(categoryKey, newValues);
      } else {
        // Agregar
        onFilterChange(categoryKey, [...currentValues, value]);
      }
    } else {
      // Selección simple: toggle o reemplazar
      if (currentValues.includes(value)) {
        onFilterChange(categoryKey, "");
      } else {
        onFilterChange(categoryKey, value);
      }
    }
    setSearch("");
  };

  // Remover un valor específico de una categoría
  const handleRemoveValue = (categoryKey: string, valueToRemove: string) => {
    const currentValues = getSelectedValues(categoryKey);
    if (currentValues.length <= 1) {
      onFilterChange(categoryKey, "");
    } else {
      onFilterChange(categoryKey, currentValues.filter(v => v !== valueToRemove));
    }
  };

  // Filtrar opciones basado en búsqueda
  const getFilteredCategories = () => {
    if (!search) return categories;

    const searchLower = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        options: cat.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(searchLower) ||
            opt.value.toLowerCase().includes(searchLower) ||
            cat.label.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((cat) => cat.options.length > 0);
  };

  const filteredCategories = getFilteredCategories();

  // Renderizar pills de filtros activos
  const renderActiveFilters = () => {
    const pills: React.ReactNode[] = [];

    Object.entries(selectedFilters).forEach(([key, value]) => {
      const category = categories.find((c) => c.key === key);
      if (!category) return;

      const Icon = category.icon || Filter;
      const values = Array.isArray(value) ? value : (value ? [value] : []);

      values.forEach((v) => {
        const option = category.options.find((o) => o.value === v);
        pills.push(
          <button
            key={`${key}-${v}`}
            onClick={() => handleRemoveValue(key, v)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors"
          >
            <Icon className="w-3 h-3" />
            <span className="max-w-[100px] truncate">{option?.label || v}</span>
            <X className="w-3 h-3" />
          </button>
        );
      });
    });

    return pills;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border transition-all",
          "bg-[var(--rowi-background)] border-[var(--rowi-card-border)]",
          "hover:border-[var(--rowi-primary)]/50 hover:shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20",
          activeFilterCount > 0 && "border-[var(--rowi-primary)]/30 bg-[var(--rowi-primary)]/5"
        )}
      >
        <Search className="w-4 h-4 text-[var(--rowi-muted)]" />
        <span className="flex-1 text-left text-sm text-[var(--rowi-muted)]">
          {placeholder}
        </span>
        {activeFilterCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--rowi-primary)] text-white">
            <Filter className="w-3 h-3" />
            {activeFilterCount}
          </span>
        )}
        <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono text-[var(--rowi-muted)] bg-[var(--rowi-card)] rounded border border-[var(--rowi-card-border)]">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Command Panel */}
          <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2 p-4">
            <Command
              className="rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] shadow-2xl overflow-hidden"
              shouldFilter={false}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--rowi-card-border)]">
                <Sparkles className="w-5 h-5 text-[var(--rowi-primary)]" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Escribe para buscar filtros... (multi-selección habilitada)"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--rowi-muted)]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="p-1 hover:bg-[var(--rowi-background)] rounded"
                  >
                    <X className="w-4 h-4 text-[var(--rowi-muted)]" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-[var(--rowi-background)] rounded"
                >
                  <kbd className="px-1.5 py-0.5 text-xs font-mono text-[var(--rowi-muted)] bg-[var(--rowi-background)] rounded border border-[var(--rowi-card-border)]">
                    ESC
                  </kbd>
                </button>
              </div>

              {/* Selected Filters Pills */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--rowi-card-border)] bg-[var(--rowi-background)]/50">
                  <span className="text-xs text-[var(--rowi-muted)] whitespace-nowrap">Activos ({activeFilterCount}):</span>
                  <div className="flex flex-wrap gap-1.5 flex-1 overflow-x-auto">
                    {renderActiveFilters()}
                  </div>
                  <button
                    onClick={() => {
                      onClearAll();
                      setSearch("");
                    }}
                    className="ml-2 text-xs text-red-500 hover:text-red-600 hover:underline whitespace-nowrap"
                  >
                    Limpiar todo
                  </button>
                </div>
              )}

              {/* Options List */}
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--rowi-muted)]">
                  No se encontraron filtros para "{search}"
                </Command.Empty>

                {filteredCategories.map((category) => {
                  const isMultiSelect = category.multiSelect ?? multiSelectByDefault;
                  const selectedValues = getSelectedValues(category.key);
                  const selectedCount = selectedValues.length;

                  return (
                    <Command.Group
                      key={category.key}
                      heading={
                        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                          <category.icon className="w-3.5 h-3.5" />
                          {category.label}
                          {isMultiSelect && (
                            <span className="text-[10px] font-normal text-[var(--rowi-primary)]">
                              (multi)
                            </span>
                          )}
                          {selectedCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--rowi-primary)] text-white">
                              {selectedCount}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] font-normal">
                            {category.options.length} opciones
                          </span>
                        </div>
                      }
                      className="mb-2"
                    >
                      {category.options.slice(0, search ? 50 : 10).map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                          <Command.Item
                            key={`${category.key}-${option.value}`}
                            value={`${category.key}-${option.value}-${option.label}`}
                            onSelect={() => handleSelect(category.key, option.value, isMultiSelect)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                              "hover:bg-[var(--rowi-primary)]/10",
                              isSelected && "bg-[var(--rowi-primary)]/10"
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                isSelected
                                  ? "bg-[var(--rowi-primary)] border-[var(--rowi-primary)]"
                                  : "border-[var(--rowi-card-border)]"
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="flex-1 text-sm">{option.label}</span>
                            {option.count !== undefined && (
                              <span className="text-xs text-[var(--rowi-muted)] tabular-nums">
                                {option.count.toLocaleString()}
                              </span>
                            )}
                          </Command.Item>
                        );
                      })}
                      {!search && category.options.length > 10 && (
                        <div className="px-3 py-1.5 text-xs text-[var(--rowi-muted)] text-center">
                          +{category.options.length - 10} más... (escribe para buscar)
                        </div>
                      )}
                    </Command.Group>
                  );
                })}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--rowi-card-border)] bg-[var(--rowi-background)]/50 text-xs text-[var(--rowi-muted)]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[var(--rowi-card)] border border-[var(--rowi-card-border)]">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[var(--rowi-card)] border border-[var(--rowi-card-border)]">↵</kbd>
                    {multiSelectByDefault ? "toggle" : "seleccionar"}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[var(--rowi-card)] border border-[var(--rowi-card-border)]">Esc</kbd>
                    cerrar
                  </span>
                </div>
                <span className="text-[var(--rowi-primary)]">Multi-selección activa</span>
              </div>
            </Command>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Helper para crear categorías de filtro estándar para benchmarks
 * Ahora con soporte para multi-selección
 */
export function createBenchmarkFilterCategories(filtersData: {
  regions?: FilterOption[];
  countries?: FilterOption[];
  sectors?: FilterOption[];
  jobFunctions?: FilterOption[];
  jobRoles?: FilterOption[];
  ageRanges?: FilterOption[];
  genders?: FilterOption[];
  educations?: FilterOption[];
  years?: FilterOption[];
  months?: FilterOption[];
  quarters?: FilterOption[];
}): FilterCategory[] {
  const categories: FilterCategory[] = [];

  if (filtersData.regions?.length) {
    categories.push({
      key: "region",
      label: "Región",
      icon: Globe,
      options: filtersData.regions,
      multiSelect: true,
    });
  }

  if (filtersData.countries?.length) {
    categories.push({
      key: "country",
      label: "País",
      icon: MapPin,
      options: filtersData.countries,
      multiSelect: true,
    });
  }

  if (filtersData.sectors?.length) {
    categories.push({
      key: "sector",
      label: "Sector",
      icon: Building2,
      options: filtersData.sectors,
      multiSelect: true,
    });
  }

  if (filtersData.jobFunctions?.length) {
    categories.push({
      key: "jobFunction",
      label: "Función",
      icon: Briefcase,
      options: filtersData.jobFunctions,
      multiSelect: true,
    });
  }

  if (filtersData.jobRoles?.length) {
    categories.push({
      key: "jobRole",
      label: "Rol",
      icon: Users,
      options: filtersData.jobRoles,
      multiSelect: true,
    });
  }

  if (filtersData.ageRanges?.length) {
    categories.push({
      key: "ageRange",
      label: "Edad",
      icon: Users,
      options: filtersData.ageRanges,
      multiSelect: true,
    });
  }

  if (filtersData.genders?.length) {
    categories.push({
      key: "gender",
      label: "Género",
      icon: Users,
      options: filtersData.genders,
      multiSelect: true,
    });
  }

  if (filtersData.educations?.length) {
    categories.push({
      key: "education",
      label: "Educación",
      icon: GraduationCap,
      options: filtersData.educations,
      multiSelect: true,
    });
  }

  if (filtersData.years?.length) {
    categories.push({
      key: "year",
      label: "Año",
      icon: Calendar,
      options: filtersData.years,
      multiSelect: true,
    });
  }

  if (filtersData.months?.length) {
    categories.push({
      key: "month",
      label: "Mes",
      icon: Calendar,
      options: filtersData.months,
      multiSelect: true,
    });
  }

  if (filtersData.quarters?.length) {
    categories.push({
      key: "quarter",
      label: "Trimestre",
      icon: Calendar,
      options: filtersData.quarters,
      multiSelect: true,
    });
  }

  return categories;
}
