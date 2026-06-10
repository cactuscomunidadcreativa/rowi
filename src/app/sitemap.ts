import type { MetadataRoute } from "next";
import { getServerAppBaseUrl } from "@/core/utils/base-url";

/**
 * 🗺️ sitemap.xml generado por Next.js (App Router).
 * Solo páginas públicas reales de marketing/legales. Las zonas autenticadas
 * (hub, admin, onboarding) y las APIs se excluyen — viven detrás de login y
 * no deben indexarse. Mantener esta lista alineada con PUBLIC_PAGES en
 * middleware.ts cuando se añadan páginas públicas nuevas.
 *
 * Dominio canónico vía getServerAppBaseUrl (rechaza *.vercel.app).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getServerAppBaseUrl();

  // Rutas públicas con su prioridad/frecuencia relativa.
  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
    { path: "/for-you", priority: 0.8, changeFrequency: "monthly" },
    { path: "/for-organizations", priority: 0.8, changeFrequency: "monthly" },
    { path: "/product", priority: 0.8, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/demo", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/stories", priority: 0.7, changeFrequency: "weekly" },
    { path: "/resources", priority: 0.7, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/legal", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
