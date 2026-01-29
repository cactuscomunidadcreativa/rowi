"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Building, Send, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ContactPage() {
  const { t } = useI18n();
  const [formState, setFormState] = useState({ name: "", email: "", company: "", message: "", type: "general" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t("contact.successTitle", "¡Mensaje enviado!")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{t("contact.successMessage", "Gracias por contactarnos. Te responderemos pronto.")}</p>
          <a href="/" className="rowi-btn-primary px-6 py-3">{t("contact.backHome", "Volver al inicio")}</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 shadow-lg mb-6 text-sm font-medium">
            📧 {t("contact.badge", "Contáctanos")}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-4">
            {t("contact.title1", "Hablemos sobre")} <span className="rowi-gradient-text">{t("contact.title2", "tu proyecto")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("contact.subtitle", "Ya sea que tengas preguntas sobre Rowi, quieras explorar soluciones empresariales o simplemente quieras saludar.")}
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <Mail className="w-6 h-6 text-[var(--rowi-g2)] mb-2" />
                <h3 className="font-semibold mb-1">{t("contact.emailTitle", "Email")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">hello@rowi.app</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <MessageCircle className="w-6 h-6 text-[var(--rowi-g2)] mb-2" />
                <h3 className="font-semibold mb-1">{t("contact.chatTitle", "Chat en vivo")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t("contact.chatDesc", "Lun-Vie 9am-6pm")}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <Building className="w-6 h-6 text-[var(--rowi-g2)] mb-2" />
                <h3 className="font-semibold mb-1">{t("contact.enterpriseTitle", "Enterprise")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">enterprise@rowi.app</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t("contact.name", "Nombre")}</label>
                    <input type="text" required value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-[var(--rowi-g2)] focus:ring-2 focus:ring-[var(--rowi-g2)]/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t("contact.email", "Email")}</label>
                    <input type="email" required value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-[var(--rowi-g2)] focus:ring-2 focus:ring-[var(--rowi-g2)]/20 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("contact.company", "Empresa (opcional)")}</label>
                  <input type="text" value={formState.company} onChange={(e) => setFormState({ ...formState, company: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-[var(--rowi-g2)] focus:ring-2 focus:ring-[var(--rowi-g2)]/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("contact.type", "Tipo de consulta")}</label>
                  <select value={formState.type} onChange={(e) => setFormState({ ...formState, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-[var(--rowi-g2)] focus:ring-2 focus:ring-[var(--rowi-g2)]/20 outline-none transition-all">
                    <option value="general">{t("contact.typeGeneral", "Consulta general")}</option>
                    <option value="demo">{t("contact.typeDemo", "Solicitar demo")}</option>
                    <option value="enterprise">{t("contact.typeEnterprise", "Solución empresarial")}</option>
                    <option value="support">{t("contact.typeSupport", "Soporte técnico")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("contact.message", "Mensaje")}</label>
                  <textarea required rows={5} value={formState.message} onChange={(e) => setFormState({ ...formState, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-[var(--rowi-g2)] focus:ring-2 focus:ring-[var(--rowi-g2)]/20 outline-none transition-all resize-none" />
                </div>
                <button type="submit" disabled={loading} className="rowi-btn-primary px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-5 h-5" /> {t("contact.send", "Enviar mensaje")}</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
