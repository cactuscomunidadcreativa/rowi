"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Plan { name: string; price: string; period?: string; badge?: string; features: string[]; cta: string; ctaHref?: string; highlighted?: boolean; }
interface PricingContent { title?: string; subtitle?: string; plans: Plan[]; }
interface PricingConfig { columns?: 2 | 3 | 4; }

export default function PricingSection({ content, config }: { content: PricingContent; config?: PricingConfig }) {
  const columns = config?.columns || 3;
  const gridCols: Record<number, string> = { 2: "md:grid-cols-2", 3: "lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <div className="text-center mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold mb-4">{content.title}</motion.h2>
            {content.subtitle && <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-gray-600 dark:text-gray-400">{content.subtitle}</motion.p>}
          </div>
        )}
        <div className={"grid gap-8 " + gridCols[columns]}>
          {content.plans.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={"relative rounded-2xl p-6 " + (plan.highlighted ? "bg-gradient-to-br from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white shadow-2xl scale-105" : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800")}>
              {plan.badge && <div className={"absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium " + (plan.highlighted ? "bg-white text-[var(--rowi-g2)]" : "bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white")}>{plan.badge}</div>}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6"><span className="text-4xl font-bold">{plan.price}</span>{plan.period && <span className={plan.highlighted ? "text-white/80" : "text-gray-500"}>{plan.period}</span>}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => <li key={j} className="flex items-center gap-2"><Check className={"w-5 h-5 " + (plan.highlighted ? "text-white" : "text-[var(--rowi-g2)]")} /><span className={plan.highlighted ? "text-white/90" : ""}>{f}</span></li>)}
              </ul>
              <Link href={plan.ctaHref || "/register"} className={"block w-full text-center py-3 rounded-xl font-medium transition-all " + (plan.highlighted ? "bg-white text-[var(--rowi-g2)] hover:bg-gray-100" : "bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white hover:opacity-90")}>{plan.cta}</Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
