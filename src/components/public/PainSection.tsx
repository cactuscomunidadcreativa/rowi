"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/useI18n";

export default function PainSection() {
  const { t } = useI18n();

  const items = [
    t("landing.pain.item1"),
    t("landing.pain.item2"),
    t("landing.pain.item3"),
    t("landing.pain.item4"),
    t("landing.pain.item5"),
    t("landing.pain.item6"),
  ];

  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-zinc-900/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            {t("landing.pain.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            {t("landing.pain.subtitle")}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-[var(--rowi-g2,#7c3aed)]" />
              <span className="text-gray-700 dark:text-gray-300">{item}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xl md:text-2xl font-semibold mb-6">
            {t("landing.pain.outcome")}
          </p>
          <Link
            href="/register"
            className="rowi-btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg group"
          >
            {t("landing.hero.cta.primary")}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
