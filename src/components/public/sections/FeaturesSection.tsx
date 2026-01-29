"use client";

import { motion } from "framer-motion";
import { Sparkles, Brain, Heart, BarChart3, Users, Target, Shield, Zap, Globe, MessageCircle, TrendingUp, Star } from "lucide-react";

interface Feature { icon: string; title: string; description: string; gradient?: string; }
interface FeaturesContent { title1?: string; title2?: string; subtitle?: string; features: Feature[]; }
interface FeaturesConfig { columns?: 2 | 3 | 4; showIcons?: boolean; layout?: "grid" | "list"; }

const iconMap: Record<string, React.ElementType> = { sparkles: Sparkles, brain: Brain, heart: Heart, "bar-chart": BarChart3, users: Users, target: Target, shield: Shield, zap: Zap, globe: Globe, "message-circle": MessageCircle, "trending-up": TrendingUp, star: Star };

export default function FeaturesSection({ content, config }: { content: FeaturesContent; config?: FeaturesConfig }) {
  const columns = config?.columns || 3;
  const layout = config?.layout || "grid";
  const gridCols = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {(content.title1 || content.title2) && (
          <div className="text-center mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold mb-4">
              {content.title1} <span className="rowi-gradient-text">{content.title2}</span>
            </motion.h2>
            {content.subtitle && (
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {content.subtitle}
              </motion.p>
            )}
          </div>
        )}
        <div className={layout === "list" ? "space-y-6 max-w-4xl mx-auto" : `grid gap-6 ${gridCols[columns]}`}>
          {content.features.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            const gradientClass = feature.gradient || "from-[var(--rowi-g2)] to-[var(--rowi-g1)]";
            
            if (layout === "list") {
              return (
                <motion.div key={index} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                  <div className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${gradientClass}`}><Icon className="w-6 h-6 text-white" /></div>
                  <div><h3 className="font-semibold text-lg mb-1">{feature.title}</h3><p className="text-gray-600 dark:text-gray-400">{feature.description}</p></div>
                </motion.div>
              );
            }
            
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="group relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-all hover:shadow-xl">
                {config?.showIcons !== false && <div className={`inline-flex p-3 rounded-xl mb-4 bg-gradient-to-br ${gradientClass}`}><Icon className="w-6 h-6 text-white" /></div>}
                <h3 className="font-semibold text-xl mb-2 group-hover:text-[var(--rowi-g2)] transition-colors">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--rowi-g2)] to-[var(--rowi-g1)] opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
