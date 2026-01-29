"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Globe, Star, Sparkles } from "lucide-react";

interface TrustBadge { icon: string; text: string; }
interface HeroContent {
  badge?: string;
  title1: string;
  title2: string;
  subtitle?: string;
  ctaPrimary?: string;
  ctaPrimaryHref?: string;
  ctaSecondary?: string;
  ctaSecondaryHref?: string;
  image?: string;
  trustBadges?: TrustBadge[];
}
interface HeroConfig {
  layout?: "centered" | "split" | "fullwidth";
  showBadge?: boolean;
  showTrustBadges?: boolean;
  gradient?: boolean;
}

const iconMap: Record<string, React.ElementType> = { shield: Shield, globe: Globe, star: Star, sparkles: Sparkles };

export default function HeroSection({ content, config }: { content: HeroContent; config?: HeroConfig }) {
  const layout = config?.layout || "centered";
  if (layout === "split") return <SplitHero content={content} config={config} />;
  return <CenteredHero content={content} config={config} />;
}

function CenteredHero({ content, config }: { content: HeroContent; config?: HeroConfig }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {config?.gradient && <div className="absolute inset-0 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10" />}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 to-transparent blur-3xl" />
        <motion.div animate={{ x: [0, -100, 0], y: [0, 50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--rowi-g2)]/20 to-transparent blur-3xl" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
        {config?.showBadge && content.badge && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 shadow-lg mb-8">
            <span className="text-sm font-medium">{content.badge}</span>
          </motion.div>
        )}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          {content.title1} <span className="rowi-gradient-text">{content.title2}</span>
        </motion.h1>
        {content.subtitle && <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">{content.subtitle}</motion.p>}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {content.ctaPrimary && <Link href={content.ctaPrimaryHref || "/register"} className="rowi-btn-primary px-8 py-4 text-lg flex items-center gap-2 group">{content.ctaPrimary}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>}
          {content.ctaSecondary && <Link href={content.ctaSecondaryHref || "/how-it-works"} className="px-8 py-4 text-lg border-2 border-gray-300 dark:border-zinc-700 rounded-xl hover:border-[var(--rowi-g2)] transition-colors">{content.ctaSecondary}</Link>}
        </motion.div>
        {config?.showTrustBadges && content.trustBadges && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center justify-center gap-6">
            {content.trustBadges.map((badge, i) => { const Icon = iconMap[badge.icon] || Star; return <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Icon className="w-4 h-4" /><span>{badge.text}</span></div>; })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function SplitHero({ content, config }: { content: HeroContent; config?: HeroConfig }) {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {config?.gradient && <div className="absolute inset-0 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10" />}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {config?.showBadge && content.badge && <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 shadow-lg mb-6"><span className="text-sm font-medium">{content.badge}</span></motion.div>}
            <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">{content.title1} <span className="rowi-gradient-text">{content.title2}</span></motion.h1>
            {content.subtitle && <motion.p initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">{content.subtitle}</motion.p>}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
              {content.ctaPrimary && <Link href={content.ctaPrimaryHref || "/register"} className="rowi-btn-primary px-8 py-4 text-lg flex items-center gap-2 group">{content.ctaPrimary}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>}
              {content.ctaSecondary && <Link href={content.ctaSecondaryHref || "/how-it-works"} className="px-8 py-4 text-lg border-2 border-gray-300 dark:border-zinc-700 rounded-xl hover:border-[var(--rowi-g2)] transition-colors text-center">{content.ctaSecondary}</Link>}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="relative aspect-square max-w-lg mx-auto">
            {content.image && <div className="relative w-full h-full"><div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/30 to-[var(--rowi-g2)]/30 blur-3xl" /><Image src={content.image} alt="Hero" fill className="object-contain drop-shadow-2xl relative z-10" /></div>}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
