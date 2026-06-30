"use client";

/**
 * ⌘K — buscador del admin (Hito 2). Entrada principal de navegación: en vez de
 * recorrer 23 acordeones, escribes y vas al destino en 1 paso. Indexa la misma
 * estructura que el Sidebar (flattenAdminNav), respeta scope (superOnly +
 * capability) y agrupa por sección. Atajo global ⌘K / Ctrl+K.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import { useAdminUser } from "./AdminUserContext";
import { flattenAdminNav } from "./adminNavData";

export default function AdminCommandPalette() {
  const router = useRouter();
  const { t } = useI18n();
  const { isPlatformAdmin, loading, can } = useAdminUser();
  const [open, setOpen] = useState(false);

  // Atajo global ⌘K / Ctrl+K (toggle).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Índice visible para este admin (mismo criterio de scope que el Sidebar).
  const entries = useMemo(() => {
    const showScope = (superOnly?: boolean) => loading || isPlatformAdmin || !superOnly;
    const showCap = (capability?: string) =>
      loading || !capability || isPlatformAdmin || can(capability);
    return flattenAdminNav().filter(
      (e) => showScope(e.superOnly) && showCap(e.capability),
    );
  }, [isPlatformAdmin, loading, can]);

  // Agrupar por sección para mostrar el subtítulo del dominio.
  const groups = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const arr = map.get(e.sectionKey) ?? [];
      arr.push(e);
      map.set(e.sectionKey, arr);
    }
    return [...map.entries()];
  }, [entries]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Botón de entrada (en la barra superior del admin) */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card-elev)] px-3 py-1.5 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] transition-colors"
        aria-label={t("adminSearch.open")}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">{t("adminSearch.placeholder")}</span>
        <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--rowi-chip)] border border-[var(--rowi-card-border)]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label={t("adminSearch.open")} className="w-full">
              <div className="flex items-center gap-2 px-4 border-b border-[var(--rowi-card-border)]">
                <Search className="w-4 h-4 text-[var(--rowi-muted)]" />
                <Command.Input
                  autoFocus
                  placeholder={t("adminSearch.inputPlaceholder")}
                  className="flex-1 bg-transparent py-3 text-sm outline-none text-[var(--rowi-foreground)] placeholder:text-[var(--rowi-muted-weak)]"
                />
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--rowi-chip)] text-[var(--rowi-muted)]">
                  esc
                </kbd>
              </div>
              <Command.List className="max-h-[55vh] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--rowi-muted)]">
                  {t("adminSearch.empty")}
                </Command.Empty>
                {groups.map(([sectionKey, items]) => (
                  <Command.Group
                    key={sectionKey}
                    heading={
                      <span className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted-weak)] px-2">
                        {t(sectionKey)}
                      </span>
                    }
                  >
                    {items.map((e) => {
                      const Icon = e.icon;
                      const label = t(e.labelKey);
                      return (
                        <Command.Item
                          key={e.href}
                          value={`${label} ${t(sectionKey)} ${e.href}`}
                          onSelect={() => go(e.href)}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[var(--rowi-foreground)] cursor-pointer data-[selected=true]:bg-[var(--rowi-g2)]/10 data-[selected=true]:text-[var(--rowi-g2)]"
                        >
                          <Icon className="w-4 h-4 flex-shrink-0 text-[var(--rowi-muted)]" />
                          <span className="flex-1 truncate">{label}</span>
                          <span className="text-[10px] text-[var(--rowi-muted-weak)] truncate hidden sm:inline">
                            {t(sectionKey)}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
