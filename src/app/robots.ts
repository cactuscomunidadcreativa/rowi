import type { MetadataRoute } from "next";
import { getServerAppBaseUrl } from "@/core/utils/base-url";

/**
 * 🤖 robots.txt generado por Next.js (App Router).
 * Permite indexar las páginas públicas de marketing y bloquea las zonas
 * autenticadas (hub, admin, onboarding) y las APIs.
 *
 * Usa getServerAppBaseUrl (que rechaza hosts *.vercel.app y cae al dominio
 * canónico) para que NEXT_PUBLIC_APP_URL mal configurada en Vercel no apunte
 * Google a rowi.vercel.app — partiendo la autoridad SEO con contenido duplicado.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerAppBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/hub/",
          "/admin/",
          "/onboarding/",
          "/register/success",
          "/pitch",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
