import type { MetadataRoute } from "next";

/**
 * robots.txt dinámico. Permite el marketing público, bloquea el hub/app
 * autenticado, la API y los flujos de cuenta. Apunta al sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/hub/",
          "/me/",
          "/research/",
          "/start/",
          "/invite/",
          "/p/",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: "https://www.rowiia.com/sitemap.xml",
    host: "https://www.rowiia.com",
  };
}
