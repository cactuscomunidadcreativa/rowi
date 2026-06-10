import "./globals.css";
import ClientWrapper from "./ClientWrapper";
import BetaBanner from "@/components/shared/BetaBanner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getServerAppBaseUrl } from "@/core/utils/base-url";

export const viewport = {
  themeColor: "#7c3aed",
};

export const metadata = {
  // Canonical / og:url de todas las páginas. getServerAppBaseUrl rechaza
  // *.vercel.app → nunca indexamos el dominio de deploy.
  metadataBase: new URL(getServerAppBaseUrl()),
  title: {
    default: "Rowi — Inteligencia emocional con IA y metodología Six Seconds",
    template: "%s · Rowi",
  },
  description:
    "Rowi convierte tus señales emocionales diarias en acciones concretas para personas, familias y equipos, con privacidad y metodología Six Seconds.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/owl.png?v=4", type: "image/png", sizes: "any" },
    ],
    shortcut: "/owl.png?v=4",
    apple: "/owl.png?v=4",
  },
  openGraph: {
    title: "Rowi — Sé quien quieres ser",
    description:
      "La práctica diaria que transforma tus relaciones. Lee la afinidad con quien te importa y consigue las palabras para conectar. Sobre la ciencia de Six Seconds.",
    url: "https://www.rowiia.com",
    siteName: "Rowi",
    images: [
      {
        url: "https://www.rowiia.com/rowi-logo.png",
        width: 512,
        height: 512,
        alt: "Rowi — Sé quien quieres ser",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Rowi — Sé quien quieres ser",
    description:
      "La práctica diaria que transforma tus relaciones. Sobre la ciencia de Six Seconds.",
    images: ["https://www.rowiia.com/rowi-logo.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * 🚫 IMPORTANTÍSIMO:
   * NO EJECUTAMOS ensureBaseAgents(), ensureSystemBootstrap() NI NADA
   * en el layout.
   *
   * Next.js arranca el layout ANTES DE QUE LA BASE DE DATOS EXISTA
   * cuando corres `prisma migrate reset`, y eso causaba los errores:
   *
   * - table `rowi_verse` does not exist
   * - table `agent_config` does not exist
   * - table `translation` does not exist
   *
   * 🌟 Ahora toda sincronización debe ejecutarse:
   *    ✔️ manualmente con endpoints /api/admin/fix/*
   *    ✔️ o en el seed real prisma/seed.ts
   *
   * El layout debe mantenerse 100% limpio.
   *
   * 📝 NOTA: UserStatusBar NO se incluye aquí porque cada layout específico
   * maneja su propia barra de estado:
   * - /hub/admin/* → tiene su propio header con UserStatusBar
   * - /(app)/* → usa NavBar como navegación principal
   */

  // Structured data (JSON-LD) — Organization. Ayuda a Google a entender la marca
  // y habilita rich results. Sin esto la home no tenía structured data (SEO).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rowi",
    url: "https://www.rowiia.com",
    logo: "https://www.rowiia.com/rowi-logo.png",
    description:
      "Rowi es la práctica diaria que lee la afinidad entre tú y quien te importa y te da las palabras para conectar. Sobre la metodología Six Seconds.",
    sameAs: ["https://www.6seconds.org"],
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-gray-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <I18nProvider>
          <BetaBanner />
          <ClientWrapper>{children}</ClientWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}