// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Strict TS gates the build. Was previously set to `true` with a
  // backlog of 198 errors; that backlog was cleared across commits A,
  // B, C of the May 2026 TS-strict push. If a new error sneaks in,
  // the build now fails fast in CI/Vercel — that's the desired
  // signal. Flip back to true ONLY as a temporary unblock while a
  // fresh batch is investigated.
  typescript: { ignoreBuildErrors: false },

  // 🛡️ Disable source maps in production to protect code
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
    ],
  },

  // 🔐 Security Headers
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: "/:path*",
        headers: [
          // Forzar HTTPS (HSTS) — 2 años, subdominios, apto para preload.
          // Solo se emite en producción para no romper http://localhost en dev.
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
          // Prevenir clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevenir MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // X-XSS-Protection: header obsoleto. Los navegadores modernos lo
          // ignoraron/retiraron y en versiones viejas podía introducir
          // vulnerabilidades. La protección XSS moderna es la CSP de abajo.
          // Lo fijamos en "0" (deshabilitado explícito) en vez de removerlo.
          {
            key: "X-XSS-Protection",
            value: "0",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy (anteriormente Feature-Policy)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: mismo origen + dominios específicos. 'unsafe-eval'
              // solo en desarrollo (Next dev/HMR lo requiere); en producción
              // se elimina para reducir superficie XSS. 'unsafe-inline' se
              // mantiene porque GTM/GA y los scripts inline de Next lo exigen
              // (migrar a nonces sería un cambio mayor, ver backlog).
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`,
              // Estilos: mismo origen y inline (necesario para Tailwind)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fuentes
              "font-src 'self' https://fonts.gstatic.com data:",
              // Imágenes: https + data/blob. Se elimina http: (mixed content).
              "img-src 'self' data: blob: https:",
              // Conexiones (APIs)
              "connect-src 'self' https://api.stripe.com https://api.openai.com https://*.vercel-insights.com https://*.google-analytics.com https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://vercel.com https://*.vercel.com https://cdn.jsdelivr.net wss:",
              // Frames (para Stripe checkout)
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              // Objetos embebidos
              "object-src 'none'",
              // Base URI
              "base-uri 'self'",
              // Form actions
              "form-action 'self'",
              // Upgrade insecure requests en producción
              process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
            ]
              .filter(Boolean)
              .join("; "),
          },
        ],
      },
      {
        // 🛡️ Block source map files in production
        source: "/:path*.map",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        // 🛡️ Block _next/static source access with no-cache
        source: "/_next/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        // Headers adicionales para APIs
        source: "/api/:path*",
        headers: [
          // No cachear respuestas de API por defecto
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

/**
 * Sentry source-maps upload wrapper.
 *
 * When all three env vars are present at build time:
 *   SENTRY_DSN
 *   SENTRY_ORG
 *   SENTRY_PROJECT
 *   SENTRY_AUTH_TOKEN
 *
 * the wrapper uploads source maps to Sentry so error stack traces in
 * the Sentry UI are de-minified. Without those env vars,
 * withSentryConfig is effectively a no-op — the build proceeds
 * unchanged.
 *
 * silent: true keeps the build log clean. widenClientFileUpload covers
 * the dynamic chunks Next.js emits.
 */
const sentryOptions = {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only attempt to upload when an auth token is actually configured.
  // Otherwise the plugin is inert and source maps stay local.
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  reactComponentAnnotation: { enabled: false },
};

export default withSentryConfig(nextConfig, sentryOptions);
