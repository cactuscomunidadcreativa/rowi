"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Globe2,
  FileText,
  Eye,
  Edit3,
  Plus,
  Search,
  LayoutDashboard,
  Zap,
  Users,
  Building,
  CreditCard,
  MessageSquare,
  Heart,
  Lightbulb,
  Puzzle,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🌐 Admin Public Pages — Gestión de páginas públicas
   ---------------------------------------------------------
   Lista todas las páginas del sitio público con su estado
========================================================= */

interface PageInfo {
  slug: string;
  labelKey: string;
  icon: React.ElementType;
  description: string;
  path: string;
}

const PUBLIC_PAGES: PageInfo[] = [
  { slug: "home", labelKey: "admin.pages.home", icon: LayoutDashboard, description: "Página principal del sitio", path: "/" },
  { slug: "how-it-works", labelKey: "admin.pages.howItWorks", icon: Zap, description: "Explicación del funcionamiento de Rowi", path: "/how-it-works" },
  { slug: "for-you", labelKey: "admin.pages.forYou", icon: Users, description: "Página B2C para personas", path: "/for-you" },
  { slug: "for-organizations", labelKey: "admin.pages.forOrgs", icon: Building, description: "Página B2B para empresas", path: "/for-organizations" },
  { slug: "pricing", labelKey: "admin.pages.pricing", icon: CreditCard, description: "Planes y precios", path: "/pricing" },
  { slug: "contact", labelKey: "admin.pages.contact", icon: MessageSquare, description: "Formulario de contacto", path: "/contact" },
  { slug: "product-rowi", labelKey: "admin.pages.productRowi", icon: Heart, description: "Producto: Rowi Coach", path: "/product/rowi" },
  { slug: "product-affinity", labelKey: "admin.pages.productAffinity", icon: Heart, description: "Producto: Afinidad emocional", path: "/product/affinity" },
  { slug: "product-insights", labelKey: "admin.pages.productInsights", icon: Lightbulb, description: "Producto: Insights", path: "/product/insights" },
  { slug: "product-integrations", labelKey: "admin.pages.productIntegrations", icon: Puzzle, description: "Producto: Integraciones", path: "/product/integrations" },
];

export default function PublicPagesAdmin() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [pageStats, setPageStats] = useState<Record<string, { sections: number; published: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageStats();
  }, []);

  async function loadPageStats() {
    try {
      const res = await fetch("/api/admin/pages");
      const data = await res.json();
      if (data.ok && data.pages) {
        const stats: Record<string, { sections: number; published: boolean }> = {};
        data.pages.forEach((page: any) => {
          stats[page.slug] = {
            sections: page.sections?.length || 0,
            published: page.published !== false,
          };
        });
        setPageStats(stats);
      }
    } catch (error) {
      console.error("Error loading page stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPages = PUBLIC_PAGES.filter(
    (page) =>
      page.slug.toLowerCase().includes(search.toLowerCase()) ||
      page.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-[var(--rowi-primary)]" />
            {t("admin.publicPages.title", "Páginas Públicas")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">
            {t("admin.publicPages.subtitle", "Gestiona el contenido de las páginas del sitio público")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] hover:bg-[var(--rowi-border)] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {t("admin.publicPages.viewSite", "Ver sitio")}
          </Link>
          <Link
            href="/hub/admin/landing-builder"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("admin.publicPages.editLanding", "Landing Builder")}
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input
          type="text"
          placeholder={t("admin.publicPages.searchPlaceholder", "Buscar páginas...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] focus:border-[var(--rowi-primary)] focus:outline-none"
        />
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-primary)]" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map((page, index) => {
            const Icon = page.icon;
            const stats = pageStats[page.slug];

            return (
              <motion.div
                key={page.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10">
                      <Icon className="w-5 h-5 text-[var(--rowi-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t(page.labelKey, page.slug)}</h3>
                      <p className="text-xs text-[var(--rowi-muted)]">{page.path}</p>
                    </div>
                  </div>
                  {stats?.published !== false ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                <p className="text-sm text-[var(--rowi-muted)] mb-4">{page.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--rowi-muted)]">
                    {stats?.sections || 0} {t("admin.publicPages.sections", "secciones")}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={page.path}
                      target="_blank"
                      className="p-2 rounded-lg hover:bg-[var(--rowi-border)] transition-colors"
                      title={t("admin.publicPages.preview", "Vista previa")}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/hub/admin/landing-builder?page=${page.slug}`}
                      className="p-2 rounded-lg hover:bg-[var(--rowi-border)] transition-colors"
                      title={t("admin.publicPages.edit", "Editar")}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <p className="text-2xl font-bold text-[var(--rowi-primary)]">{PUBLIC_PAGES.length}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{t("admin.publicPages.totalPages", "Total páginas")}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <p className="text-2xl font-bold text-green-500">
            {Object.values(pageStats).filter((s) => s.published !== false).length}
          </p>
          <p className="text-sm text-[var(--rowi-muted)]">{t("admin.publicPages.published", "Publicadas")}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <p className="text-2xl font-bold text-[var(--rowi-secondary)]">
            {Object.values(pageStats).reduce((acc, s) => acc + s.sections, 0)}
          </p>
          <p className="text-sm text-[var(--rowi-muted)]">{t("admin.publicPages.totalSections", "Total secciones")}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <p className="text-2xl font-bold">2</p>
          <p className="text-sm text-[var(--rowi-muted)]">{t("admin.publicPages.languages", "Idiomas")}</p>
        </div>
      </div>
    </div>
  );
}
