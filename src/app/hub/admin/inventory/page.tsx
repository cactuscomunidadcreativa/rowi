"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ChevronRight,
  Search,
  RefreshCcw,
  ExternalLink,
  Building2,
  Heart,
  Users2,
  Brain,
  BarChart3,
  Bot,
  Workflow,
  GraduationCap,
  BookOpen,
  Trophy,
  Briefcase,
  Globe2,
  Palette,
  Bell,
  Network,
  CreditCard,
  Coins,
  Sparkles,
  Building,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminBadge,
} from "@/components/admin/AdminPage";

type Entity = { key: string; count: number; href: string };
type Domain = { key: string; entities: Entity[] };
type InventoryResponse = {
  ok: boolean;
  totalRecords: number;
  domains: Domain[];
};

const DOMAIN_META: Record<
  string,
  { icon: LucideIcon; gradient: string }
> = {
  structure: { icon: Building2, gradient: "from-blue-500 to-blue-600" },
  community: { icon: Heart, gradient: "from-pink-500 to-pink-600" },
  social: { icon: Users2, gradient: "from-sky-500 to-cyan-600" },
  eq: { icon: Brain, gradient: "from-violet-500 to-purple-600" },
  benchmarks: { icon: BarChart3, gradient: "from-orange-500 to-amber-600" },
  ai: { icon: Bot, gradient: "from-cyan-500 to-teal-600" },
  weekflow: { icon: Workflow, gradient: "from-emerald-500 to-green-600" },
  education: { icon: GraduationCap, gradient: "from-indigo-500 to-blue-600" },
  knowledge: { icon: BookOpen, gradient: "from-amber-500 to-yellow-600" },
  gamification: { icon: Trophy, gradient: "from-yellow-500 to-orange-600" },
  workspace: { icon: Briefcase, gradient: "from-slate-500 to-zinc-600" },
  affinity: { icon: Sparkles, gradient: "from-fuchsia-500 to-pink-600" },
  eco: { icon: Heart, gradient: "from-rose-500 to-red-600" },
  sales: { icon: CreditCard, gradient: "from-green-500 to-emerald-600" },
  accounting: { icon: Coins, gradient: "from-lime-500 to-green-600" },
  hr: { icon: Building, gradient: "from-stone-500 to-neutral-600" },
  rowiverse: { icon: Globe2, gradient: "from-teal-500 to-cyan-600" },
  cms: { icon: Palette, gradient: "from-purple-500 to-fuchsia-600" },
  notifications: { icon: Bell, gradient: "from-red-500 to-rose-600" },
  integrations: { icon: Network, gradient: "from-blue-500 to-indigo-600" },
};

function fallbackTitle(key: string): string {
  return key
    .replace(/[._]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminInventoryPage() {
  const { t, ready } = useI18n();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/stats");
      const json = (await res.json()) as InventoryResponse & { error?: string };
      if (!json.ok) throw new Error(json.error || "Error");
      setData(json);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  const filtered = useMemo(() => {
    if (!data) return [] as Domain[];
    if (!query.trim()) return data.domains;
    const q = query.trim().toLowerCase();
    return data.domains
      .map((d) => {
        const domainTitle = t(`admin.inventory.domains.${d.key}`, fallbackTitle(d.key)).toLowerCase();
        const matchedEntities = d.entities.filter((e) => {
          const label = t(`admin.inventory.entities.${e.key}`, fallbackTitle(e.key)).toLowerCase();
          return label.includes(q) || e.key.toLowerCase().includes(q);
        });
        if (domainTitle.includes(q)) return d;
        return matchedEntities.length ? { ...d, entities: matchedEntities } : null;
      })
      .filter((d): d is Domain => d !== null);
  }, [data, query, t]);

  const totalRecords = data?.totalRecords ?? 0;

  return (
    <AdminPage
      titleKey="admin.inventory.title"
      descriptionKey="admin.inventory.description"
      icon={Boxes}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminBadge variant="info">
            {totalRecords.toLocaleString()} {t("admin.inventory.totalRecords", "records")}
          </AdminBadge>
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={load} size="sm">
            {t("admin.common.refresh", "Refresh")}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "admin.inventory.searchPlaceholder",
              "Search entities (e.g. users, courses, invoices)...",
            )}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] text-sm text-[var(--rowi-foreground)] placeholder-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
          />
        </div>

        {/* Domains grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((domain) => {
            const meta = DOMAIN_META[domain.key] ?? {
              icon: Boxes,
              gradient: "from-slate-500 to-slate-600",
            };
            const DomainIcon = meta.icon;
            const domainTotal = domain.entities.reduce((s, e) => s + e.count, 0);

            return (
              <AdminCard key={domain.key} compact>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
                  >
                    <DomainIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] truncate">
                      {t(`admin.inventory.domains.${domain.key}`, fallbackTitle(domain.key))}
                    </h3>
                    <p className="text-xs text-[var(--rowi-muted)]">
                      {domainTotal.toLocaleString()}{" "}
                      {t("admin.inventory.records", "records")} ·{" "}
                      {domain.entities.length} {t("admin.inventory.entities", "entities")}
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {domain.entities.map((entity) => (
                    <Link
                      key={entity.key}
                      href={entity.href}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--rowi-border)]/40 group transition-colors"
                    >
                      <span className="text-xs text-[var(--rowi-foreground)] truncate">
                        {t(`admin.inventory.entities.${entity.key}`, fallbackTitle(entity.key))}
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs font-mono text-[var(--rowi-muted)] tabular-nums">
                          {entity.count.toLocaleString()}
                        </span>
                        <ChevronRight className="w-3 h-3 text-[var(--rowi-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </Link>
                  ))}
                </div>
              </AdminCard>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <AdminCard>
            <div className="text-center py-8 text-sm text-[var(--rowi-muted)]">
              {query
                ? t("admin.inventory.noResults", "No entities match your search")
                : t("admin.inventory.empty", "No inventory data available")}
            </div>
          </AdminCard>
        )}

        {/* Hint footer */}
        <div className="text-xs text-[var(--rowi-muted)] flex items-center gap-1.5 px-1">
          <ExternalLink className="w-3 h-3" />
          {t(
            "admin.inventory.hint",
            "Click any entity to open its management view.",
          )}
        </div>
      </div>
    </AdminPage>
  );
}
