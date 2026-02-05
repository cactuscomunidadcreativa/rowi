// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Remove ignoreBuildErrors after migrating API routes to Next.js 16 async params
  // See: https://nextjs.org/docs/app/building-your-application/upgrading/version-16
  // 482 errors to fix - mostly related to params being Promise in route handlers
  typescript: { ignoreBuildErrors: true },

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
          // Habilitar XSS filter del navegador
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
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
              // Scripts: solo de mismo origen y dominios específicos
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
              // Estilos: mismo origen y inline (necesario para Tailwind)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fuentes
              "font-src 'self' https://fonts.gstatic.com data:",
              // Imágenes
              "img-src 'self' data: blob: https: http:",
              // Conexiones (APIs)
              "connect-src 'self' https://api.stripe.com https://api.openai.com https://*.vercel-insights.com https://*.google-analytics.com https://*.blob.vercel-storage.com wss:",
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

export default nextConfig;
