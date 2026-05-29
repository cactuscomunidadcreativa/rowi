"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/react";
import { Settings, Shield, ChevronRight, User } from "lucide-react";

export default function HubSettingsPage() {
  const { t } = useI18n();

  const items = [
    {
      href: "/hub/account/privacy",
      icon: Shield,
      title: t("hub.settings.privacy", "Privacidad y consentimiento"),
      desc: t(
        "hub.settings.privacyDesc",
        "Controla qué datos compartes y con quién."
      ),
      color: "text-emerald-400",
    },
    {
      href: "/settings/profile",
      icon: User,
      title: t("hub.settings.profile", "Perfil"),
      desc: t(
        "hub.settings.profileDesc",
        "Edita tu nombre, idioma y preferencias personales."
      ),
      color: "text-violet-400",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gray-500/20">
            <Settings className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t("hub.settings.title", "Configuración")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                "hub.settings.subtitle",
                "Gestiona tu cuenta y preferencias"
              )}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 hover:border-violet-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${item.color}`} />
                <h3 className="font-semibold">{item.title}</h3>
                <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {item.desc}
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
