"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Globe, Star, Sparkles, Brain, Heart, Zap } from "lucide-react";

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

/* =========================================================
   Floating Decorative Icons
========================================================= */
const FLOATING_ICONS = [
  { icon: Brain, x: "10%", y: "20%", size: 28, delay: 0, duration: 6, color: "text-purple-400/30" },
  { icon: Heart, x: "85%", y: "15%", size: 24, delay: 1, duration: 7, color: "text-pink-400/30" },
  { icon: Zap, x: "15%", y: "75%", size: 22, delay: 2, duration: 5, color: "text-amber-400/30" },
  { icon: Star, x: "90%", y: "70%", size: 26, delay: 0.5, duration: 8, color: "text-blue-400/30" },
  { icon: Sparkles, x: "50%", y: "10%", size: 20, delay: 1.5, duration: 6.5, color: "text-cyan-400/30" },
  { icon: Globe, x: "75%", y: "85%", size: 24, delay: 3, duration: 7, color: "text-emerald-400/30" },
];

/* =========================================================
   Animated Grid Background
========================================================= */
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient mask */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,var(--rowi-bg,#f7f9fb)_70%)]" />

      {/* Subtle grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-900 dark:text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div>
  );
}

/* =========================================================
   Centered Hero (Default)
========================================================= */
function CenteredHero({ content, config }: { content: HeroContent; config?: HeroConfig }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      {config?.gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10" />
      )}

      {/* Animated grid background */}
      <AnimatedGrid />

      {/* Floating gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 120, 0], y: [0, -60, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -120, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[var(--rowi-g2)]/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 40, 0], scale: [0.8, 1, 0.9, 0.8] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[var(--rowi-g3,#7a59c9)]/10 to-transparent blur-3xl"
        />
      </div>

      {/* Floating decorative icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FLOATING_ICONS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              className={`absolute ${item.color}`}
              style={{ left: item.x, top: item.y }}
              animate={{
                y: [0, -20, 0, 15, 0],
                x: [0, 10, -10, 5, 0],
                rotate: [0, 10, -10, 5, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut",
              }}
            >
              <Icon size={item.size} />
            </motion.div>
          );
        })}
      </div>

      {/* Animated sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`spark-${i}`}
            className="absolute w-1 h-1 rounded-full bg-[var(--rowi-g2,#31a2e3)]"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
        {/* Animated badge */}
        {config?.showBadge && content.badge && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 shadow-lg mb-8"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <Sparkles className="w-4 h-4 text-[var(--rowi-g2,#31a2e3)]" />
            </motion.span>
            <span className="text-sm font-medium">{content.badge}</span>
          </motion.div>
        )}

        {/* Title with staggered word animation */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
            className="inline-block"
          >
            {content.title1}{" "}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="inline-block rowi-gradient-text"
          >
            {content.title2}
          </motion.span>
        </motion.h1>

        {/* Subtitle with fade-up */}
        {content.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
          >
            {content.subtitle}
          </motion.p>
        )}

        {/* CTA buttons with hover effects */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          {content.ctaPrimary && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={content.ctaPrimaryHref || "/register"}
                className="relative rowi-btn-primary px-8 py-4 text-lg flex items-center gap-2 group overflow-hidden"
              >
                {/* Shine effect on hover */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative">{content.ctaPrimary}</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
          {content.ctaSecondary && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={content.ctaSecondaryHref || "/how-it-works"}
                className="px-8 py-4 text-lg border-2 border-gray-300 dark:border-zinc-700 rounded-xl hover:border-[var(--rowi-g2,#31a2e3)] hover:text-[var(--rowi-g2,#31a2e3)] transition-colors"
              >
                {content.ctaSecondary}
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Trust badges with staggered entrance */}
        {config?.showTrustBadges && content.trustBadges && (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {content.trustBadges.map((badge, i) => {
              const Icon = iconMap[badge.icon] || Star;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors cursor-default"
                >
                  <Icon className="w-4 h-4 text-[var(--rowi-g2,#31a2e3)]" />
                  <span>{badge.text}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-zinc-600 flex items-start justify-center p-1.5"
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1], y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* =========================================================
   Split Hero
========================================================= */
function SplitHero({ content, config }: { content: HeroContent; config?: HeroConfig }) {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {config?.gradient && <div className="absolute inset-0 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10" />}
      <AnimatedGrid />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {config?.showBadge && content.badge && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-800 shadow-lg mb-6"
              >
                <Sparkles className="w-4 h-4 text-[var(--rowi-g2,#31a2e3)]" />
                <span className="text-sm font-medium">{content.badge}</span>
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              {content.title1}{" "}
              <span className="rowi-gradient-text">{content.title2}</span>
            </motion.h1>
            {content.subtitle && (
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8"
              >
                {content.subtitle}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {content.ctaPrimary && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link href={content.ctaPrimaryHref || "/register"} className="rowi-btn-primary px-8 py-4 text-lg flex items-center gap-2 group">
                    {content.ctaPrimary}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              )}
              {content.ctaSecondary && (
                <Link href={content.ctaSecondaryHref || "/how-it-works"} className="px-8 py-4 text-lg border-2 border-gray-300 dark:border-zinc-700 rounded-xl hover:border-[var(--rowi-g2,#31a2e3)] transition-colors text-center">
                  {content.ctaSecondary}
                </Link>
              )}
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative aspect-square max-w-lg mx-auto"
          >
            {content.image && (
              <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/30 to-[var(--rowi-g2)]/30 blur-3xl" />
                <Image src={content.image} alt="Hero" fill className="object-contain drop-shadow-2xl relative z-10" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
