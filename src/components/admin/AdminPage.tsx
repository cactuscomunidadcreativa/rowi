"use client";

import { ReactNode, useState } from "react";
import { LucideIcon, Loader2, List, LayoutGrid } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🎨 Rowi Admin Components — Theme-Aware Design System
   ---------------------------------------------------------
   Usa CSS variables de /lib/theme para personalización
   Compacto, limpio, con toggle lista/grid
========================================================= */

/* =========================================================
   📄 AdminPage — Page wrapper
========================================================= */

interface AdminPageProps {
  titleKey: string;
  descriptionKey?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export function AdminPage({
  titleKey,
  descriptionKey,
  icon: Icon,
  actions,
  children,
  loading = false,
}: AdminPageProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
              {t(titleKey)}
            </h1>
            {descriptionKey && (
              <p className="text-xs text-[var(--rowi-muted)]">
                {t(descriptionKey)}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[var(--rowi-primary)] animate-spin" />
            <span className="text-sm text-[var(--rowi-muted)]">{t("common.loading")}</span>
          </div>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}

/* =========================================================
   🔄 AdminViewToggle — Toggle lista/grid
========================================================= */

interface AdminViewToggleProps {
  view: "list" | "grid";
  onChange: (view: "list" | "grid") => void;
}

export function AdminViewToggle({ view, onChange }: AdminViewToggleProps) {
  return (
    <div className="flex p-0.5 bg-[var(--rowi-border)] rounded-lg">
      <button
        onClick={() => onChange("list")}
        className={`p-1.5 rounded-md transition-all ${
          view === "list"
            ? "bg-[var(--rowi-surface)] shadow-sm text-[var(--rowi-foreground)]"
            : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
        }`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={`p-1.5 rounded-md transition-all ${
          view === "grid"
            ? "bg-[var(--rowi-surface)] shadow-sm text-[var(--rowi-foreground)]"
            : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
}

/* =========================================================
   🃏 AdminCard — Compact card
========================================================= */

interface AdminCardProps {
  titleKey?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function AdminCard({
  titleKey,
  icon: Icon,
  actions,
  children,
  className = "",
  compact = false,
  hover = true,
  onClick,
}: AdminCardProps) {
  const { t } = useI18n();
  const padding = compact ? "p-3" : "p-4";

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl bg-[var(--rowi-surface)]
        border border-[var(--rowi-border)]
        transition-all duration-200
        ${hover ? "hover:border-[var(--rowi-borderHover)] hover:shadow-sm" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {titleKey && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--rowi-border)]">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[var(--rowi-primary)]" />}
            <h2 className="text-sm font-medium text-[var(--rowi-foreground)]">
              {t(titleKey)}
            </h2>
          </div>
          {actions}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  );
}

/* =========================================================
   📊 AdminGrid — Responsive grid
========================================================= */

interface AdminGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
}

export function AdminGrid({ children, cols = 3 }: AdminGridProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[cols];

  return <div className={`grid ${colsClass} gap-3`}>{children}</div>;
}

/* =========================================================
   📋 AdminList — List view
========================================================= */

interface AdminListProps {
  children: ReactNode;
}

export function AdminList({ children }: AdminListProps) {
  return (
    <div className="rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] overflow-hidden divide-y divide-[var(--rowi-border)]">
      {children}
    </div>
  );
}

interface AdminListItemProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

export function AdminListItem({
  icon: Icon,
  title,
  subtitle,
  badge,
  meta,
  actions,
  onClick,
}: AdminListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-3 px-4 py-3
        hover:bg-[var(--rowi-background)] transition-colors
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-[var(--rowi-primary)]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[var(--rowi-primary)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
            {title}
          </span>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--rowi-muted)] truncate">{subtitle}</p>
        )}
      </div>
      {meta && (
        <div className="flex-shrink-0 text-xs text-[var(--rowi-muted)]">{meta}</div>
      )}
      {actions && (
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   📋 AdminTable — Table view
========================================================= */

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--rowi-border)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function AdminTableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[var(--rowi-background)] text-xs text-[var(--rowi-muted)] uppercase tracking-wider">
      {children}
    </thead>
  );
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[var(--rowi-border)] bg-[var(--rowi-surface)]">{children}</tbody>;
}

export function AdminTableRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[var(--rowi-background)] transition-colors ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

/* =========================================================
   🏷️ AdminBadge — Status badge
========================================================= */

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary";

interface AdminBadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  size?: "sm" | "md";
}

export function AdminBadge({ variant = "neutral", children, size = "sm" }: AdminBadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: "bg-[var(--rowi-success)]/10 text-[var(--rowi-success)]",
    warning: "bg-[var(--rowi-warning)]/10 text-[var(--rowi-warning)]",
    error: "bg-[var(--rowi-error)]/10 text-[var(--rowi-error)]",
    info: "bg-[var(--rowi-info)]/10 text-[var(--rowi-info)]",
    neutral: "bg-[var(--rowi-border)] text-[var(--rowi-muted)]",
    primary: "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

/* =========================================================
   🔘 AdminButton — Button
========================================================= */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "xs" | "sm" | "md";

interface AdminButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
  type?: "button" | "submit";
}

export function AdminButton({
  variant = "primary",
  size = "sm",
  icon: Icon,
  iconOnly = false,
  disabled = false,
  loading = false,
  onClick,
  children,
  className = "",
  type = "button",
}: AdminButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[var(--rowi-primary)] text-white hover:opacity-90 shadow-sm",
    secondary: "bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-background)]",
    danger: "bg-[var(--rowi-error)] text-white hover:opacity-90 shadow-sm",
    ghost: "text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)] hover:text-[var(--rowi-foreground)]",
  };

  const sizes: Record<ButtonSize, string> = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-1.5 font-medium rounded-lg
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${iconOnly ? `p-1.5` : sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : Icon ? (
        <Icon className={iconSizes[size]} />
      ) : null}
      {!iconOnly && children}
    </button>
  );
}

/* =========================================================
   🔘 AdminIconButton — Icon-only button
========================================================= */

interface AdminIconButtonProps {
  icon: LucideIcon;
  variant?: "ghost" | "danger";
  onClick?: () => void;
  title?: string;
}

export function AdminIconButton({
  icon: Icon,
  variant = "ghost",
  onClick,
  title,
}: AdminIconButtonProps) {
  const variants = {
    ghost: "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]",
    danger: "text-[var(--rowi-muted)] hover:text-[var(--rowi-error)] hover:bg-[var(--rowi-error)]/10",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${variants[variant]}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/* =========================================================
   📝 AdminInput — Input field
========================================================= */

interface AdminInputProps {
  label?: string;
  labelKey?: string;
  placeholder?: string;
  placeholderKey?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "number" | "url";
  disabled?: boolean;
  error?: string;
  className?: string;
  size?: "sm" | "md";
}

export function AdminInput({
  label,
  labelKey,
  placeholder,
  placeholderKey,
  value,
  onChange,
  type = "text",
  disabled = false,
  error,
  className = "",
  size = "sm",
}: AdminInputProps) {
  const { t } = useI18n();

  const displayLabel = labelKey ? t(labelKey) : label;
  const displayPlaceholder = placeholderKey ? t(placeholderKey) : placeholder;

  const sizes = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
  };

  return (
    <div className={className}>
      {displayLabel && (
        <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1 uppercase tracking-wide">
          {displayLabel}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        disabled={disabled}
        className={`
          w-full rounded-lg border
          bg-[var(--rowi-background)]
          text-[var(--rowi-foreground)]
          placeholder-[var(--rowi-muted)]
          focus:ring-2 focus:ring-[var(--rowi-primary)]/20 focus:border-[var(--rowi-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${error ? "border-[var(--rowi-error)]" : "border-[var(--rowi-border)]"}
          ${sizes[size]}
        `}
      />
      {error && <p className="mt-1 text-xs text-[var(--rowi-error)]">{error}</p>}
    </div>
  );
}

/* =========================================================
   📝 AdminSelect — Select field
========================================================= */

interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  label?: string;
  labelKey?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  placeholderKey?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function AdminSelect({
  label,
  labelKey,
  value,
  onChange,
  options,
  placeholder,
  placeholderKey,
  disabled = false,
  className = "",
  size = "sm",
}: AdminSelectProps) {
  const { t } = useI18n();

  const displayLabel = labelKey ? t(labelKey) : label;
  const displayPlaceholder = placeholderKey ? t(placeholderKey) : placeholder;

  const sizes = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-3 py-2 text-sm",
  };

  return (
    <div className={className}>
      {displayLabel && (
        <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1 uppercase tracking-wide">
          {displayLabel}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full rounded-lg border
          bg-[var(--rowi-background)]
          text-[var(--rowi-foreground)]
          border-[var(--rowi-border)]
          focus:ring-2 focus:ring-[var(--rowi-primary)]/20 focus:border-[var(--rowi-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${sizes[size]}
        `}
      >
        {displayPlaceholder && <option value="">{displayPlaceholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   📝 AdminTextarea — Textarea field
========================================================= */

interface AdminTextareaProps {
  label?: string;
  labelKey?: string;
  placeholder?: string;
  placeholderKey?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function AdminTextarea({
  label,
  labelKey,
  placeholder,
  placeholderKey,
  value,
  onChange,
  rows = 3,
  disabled = false,
  className = "",
}: AdminTextareaProps) {
  const { t } = useI18n();

  const displayLabel = labelKey ? t(labelKey) : label;
  const displayPlaceholder = placeholderKey ? t(placeholderKey) : placeholder;

  return (
    <div className={className}>
      {displayLabel && (
        <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1 uppercase tracking-wide">
          {displayLabel}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        rows={rows}
        disabled={disabled}
        className="
          w-full px-2.5 py-2 rounded-lg border text-sm resize-none
          bg-[var(--rowi-background)]
          text-[var(--rowi-foreground)]
          placeholder-[var(--rowi-muted)]
          border-[var(--rowi-border)]
          focus:ring-2 focus:ring-[var(--rowi-primary)]/20 focus:border-[var(--rowi-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
        "
      />
    </div>
  );
}

/* =========================================================
   🔄 AdminEmpty — Empty state
========================================================= */

interface AdminEmptyProps {
  icon?: LucideIcon;
  titleKey: string;
  descriptionKey?: string;
  action?: ReactNode;
}

export function AdminEmpty({
  icon: Icon,
  titleKey,
  descriptionKey,
  action,
}: AdminEmptyProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[var(--rowi-border)] flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-[var(--rowi-muted)]" />
        </div>
      )}
      <h3 className="text-sm font-medium text-[var(--rowi-foreground)]">
        {t(titleKey)}
      </h3>
      {descriptionKey && (
        <p className="mt-1 text-xs text-[var(--rowi-muted)] max-w-xs">
          {t(descriptionKey)}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* =========================================================
   🔀 AdminTabs — Tab navigation
========================================================= */

interface AdminTabsProps {
  tabs: { id: string; labelKey: string; icon?: LucideIcon }[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function AdminTabs({ tabs, activeTab, onChange }: AdminTabsProps) {
  const { t } = useI18n();

  return (
    <div className="flex p-0.5 bg-[var(--rowi-border)] rounded-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
              transition-all
              ${isActive
                ? "bg-[var(--rowi-surface)] text-[var(--rowi-foreground)] shadow-sm"
                : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
              }
            `}
          >
            {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   🔄 AdminToggle — Toggle switch
========================================================= */

interface AdminToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelKey?: string;
  disabled?: boolean;
}

export function AdminToggle({
  checked,
  onChange,
  label,
  labelKey,
  disabled = false,
}: AdminToggleProps) {
  const { t } = useI18n();
  const displayLabel = labelKey ? t(labelKey) : label;

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative w-9 h-5 rounded-full transition-colors
          ${checked ? "bg-[var(--rowi-primary)]" : "bg-[var(--rowi-border)]"}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
            transition-transform
            ${checked ? "translate-x-4" : "translate-x-0"}
          `}
        />
      </button>
      {displayLabel && (
        <span className="text-sm text-[var(--rowi-foreground)]">{displayLabel}</span>
      )}
    </label>
  );
}

/* =========================================================
   📊 AdminStat — Stat card for dashboards
========================================================= */

interface AdminStatProps {
  labelKey?: string;
  label?: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function AdminStat({
  labelKey,
  label,
  value,
  icon: Icon,
  trend,
}: AdminStatProps) {
  const { t } = useI18n();
  const displayLabel = labelKey ? t(labelKey) : label;

  return (
    <div className="rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] p-4">
      <div className="flex items-start justify-between">
        <div>
          {displayLabel && (
            <p className="text-xs font-medium text-[var(--rowi-muted)] uppercase tracking-wide">
              {displayLabel}
            </p>
          )}
          <p className="text-xl font-semibold text-[var(--rowi-foreground)] mt-1">
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-medium mt-0.5 ${trend.positive ? "text-[var(--rowi-success)]" : "text-[var(--rowi-error)]"}`}>
              {trend.positive ? "+" : ""}{trend.value}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[var(--rowi-primary)]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--rowi-primary)]" />
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   🔍 AdminSearch — Search input
========================================================= */

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  placeholderKey?: string;
  className?: string;
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
  placeholderKey,
  className = "",
}: AdminSearchProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholderKey ? t(placeholderKey) : placeholder || t("admin.common.search");

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:ring-2 focus:ring-[var(--rowi-primary)]/20 focus:border-[var(--rowi-primary)] transition-all"
      />
    </div>
  );
}
