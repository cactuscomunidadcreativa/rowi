import type { MetadataRoute } from "next";

/**
 * 🤖 robots.txt generado por Next.js (App Router).
 * Permite indexar las páginas públicas de marketing y bloquea las zonas
 * autenticadas (hub, admin, onboarding) y las APIs.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.rowiia.com";

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
