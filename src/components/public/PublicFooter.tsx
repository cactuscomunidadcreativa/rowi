"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Heart, Twitter, Linkedin, Instagram, Mail } from "lucide-react";

const footerLinks = {
  product: [
    { labelKey: "footer.rowi", href: "/product/rowi" },
    { labelKey: "footer.affinity", href: "/product/affinity" },
    { labelKey: "footer.insights", href: "/product/insights" },
    { labelKey: "footer.integrations", href: "/product/integrations" },
  ],
  company: [
    { labelKey: "footer.about", href: "/about" },
    { labelKey: "footer.stories", href: "/stories" },
    { labelKey: "footer.resources", href: "/resources" },
    { labelKey: "footer.contact", href: "/contact" },
  ],
  legal: [
    { labelKey: "footer.privacy", href: "/privacy" },
    { labelKey: "footer.terms", href: "/terms" },
    { labelKey: "footer.cookies", href: "/cookies" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/rowi", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/rowi", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/rowi", label: "Instagram" },
  { icon: Mail, href: "mailto:hello@rowi.app", label: "Email" },
];

export default function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/rowi-logo.png" alt="Rowi" width={40} height={40} className="rounded-lg" />
              <span className="font-bold text-xl rowi-gradient-text">Rowi</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
              {t("footer.description", "Tu compañero de inteligencia emocional impulsado por IA y metodología Six Seconds.")}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-200 dark:bg-zinc-800 hover:bg-[var(--rowi-g2)] hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.productTitle", "Producto")}</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] transition-colors">
                    {t(link.labelKey, link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.companyTitle", "Empresa")}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] transition-colors">
                    {t(link.labelKey, link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.legalTitle", "Legal")}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] transition-colors">
                    {t(link.labelKey, link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              {t("footer.madeIn", "Made within Latin America")} <Heart className="w-4 h-4 text-red-500 fill-red-500 inline" />
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              {t("footer.poweredBy", "Powered by")}{" "}
              <a
                href="https://www.6seconds.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--rowi-g2)] hover:underline"
              >
                Six Seconds
              </a>
              {" & "}
              <a
                href="https://www.cactuscomunidadcreativa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--rowi-g1)] hover:underline"
              >
                Cactus
              </a>
            </span>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Rowi. {t("footer.rights", "Todos los derechos reservados.")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
