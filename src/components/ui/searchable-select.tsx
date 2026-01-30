"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/core/utils";

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
  group?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  showCount?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  disabled = false,
  className,
  showCount = true,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrar opciones
  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.value.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Agrupar por grupo si existe
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    for (const opt of filteredOptions) {
      const group = opt.group || "";
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    }
    return groups;
  }, [filteredOptions]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-[var(--rowi-primary)]"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-[var(--rowi-muted)]")}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.label}
              {showCount && selectedOption.count !== undefined && (
                <span className="text-xs text-[var(--rowi-muted)]">({selectedOption.count})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="h-4 w-4 text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn("h-4 w-4 text-[var(--rowi-muted)] transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] shadow-lg">
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b border-[var(--rowi-card-border)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--rowi-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--rowi-muted)]"
            />
            {search && (
              <X
                className="h-4 w-4 text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] cursor-pointer"
                onClick={() => setSearch("")}
              />
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--rowi-muted)]">{emptyMessage}</div>
            ) : (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group || "default"}>
                  {group && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm",
                        "hover:bg-[var(--rowi-primary)]/10 cursor-pointer",
                        value === option.value && "bg-[var(--rowi-primary)]/10"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      <div className="flex items-center gap-2">
                        {showCount && option.count !== undefined && (
                          <span className="text-xs text-[var(--rowi-muted)]">{option.count}</span>
                        )}
                        {value === option.value && <Check className="h-4 w-4 text-[var(--rowi-primary)]" />}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
