import "./globals.css";
import ClientWrapper from "./ClientWrapper";
import UserStatusBar from "@/components/shared/UserStatusBar";
import BetaBanner from "@/components/shared/BetaBanner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export const metadata = {
  title: "Rowi SIA",
  description: "App de Inteligencia Emocional",
  icons: {
    icon: "/owl.png",
    shortcut: "/owl.png",
    apple: "/owl.png",
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
   */

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-gray-100">
        <I18nProvider>
          <ClientWrapper>
            <BetaBanner />
            <UserStatusBar />
            <main className="min-h-[90vh]">{children}</main>
          </ClientWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}