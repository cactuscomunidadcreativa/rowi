import "./globals.css";
import ClientWrapper from "./ClientWrapper";
import BetaBanner from "@/components/shared/BetaBanner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export const metadata = {
  title: "Rowi SIA",
  description: "App de Inteligencia Emocional",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/owl.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/favicon-96x96.png?v=2", type: "image/png", sizes: "96x96" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
  openGraph: {
    title: "Rowi SIA",
    description: "App de Inteligencia Emocional - Desarrolla tu potencial",
    url: "https://www.rowiia.com",
    siteName: "Rowi SIA",
    images: [
      {
        url: "https://www.rowiia.com/rowi-logo.png",
        width: 512,
        height: 512,
        alt: "Rowi SIA - Inteligencia Emocional",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Rowi SIA",
    description: "App de Inteligencia Emocional - Desarrolla tu potencial",
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

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-gray-100">
        <I18nProvider>
          <ClientWrapper>
            <BetaBanner />
            <main className="min-h-[90vh]">{children}</main>
          </ClientWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}