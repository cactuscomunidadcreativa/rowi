"use client";

import { motion } from "framer-motion";
import { Crown, Heart, Users, Compass, GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

const CASES = [
  { key: "leadership", icon: Crown, gradient: "from-indigo-500 to-blue-500" },
  { key: "couples", icon: Heart, gradient: "from-pink-500 to-rose-500" },
  { key: "teams", icon: Users, gradient: "from-orange-500 to-amber-500" },
  { key: "coaching", icon: Compass, gradient: "from-purple-500 to-violet-500" },
  { key: "education", icon: GraduationCap, gradient: "from-green-500 to-emerald-500" },
];

export default function UseCasesSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            {t("landing.useCases.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            {t("landing.useCases.subtitle")}
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {CASES.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] hover:shadow-xl transition-all text-center"
              >
                <div className={`inline-flex p-3 rounded-xl mb-4 bg-gradient-to-br ${c.gradient}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--rowi-g2)] transition-colors">
                  {t(`landing.useCases.${c.key}.title`)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t(`landing.useCases.${c.key}.description`)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
