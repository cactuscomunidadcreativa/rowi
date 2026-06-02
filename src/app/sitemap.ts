import type { MetadataRoute } from "next";

/**
 * Sitemap de rutas PÚBLICAS indexables. Excluye el hub/app autenticado,
 * /api, flujos de auth y demos. Nota: el i18n es client-side (sin URLs por
 * idioma), así que no hay variantes hreflang por ahora — ver docs/AUDIT_DIGITAL.md.
 */
const BASE = "https://www.rowiia.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/for-organizations", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/for-you", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/product/rowi", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/product/affinity", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/product/insights", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/product/integrations", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
