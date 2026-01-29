"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Rocket, Zap, Sparkles } from "lucide-react";

interface CTAContent { title: string; subtitle?: string; buttonText: string; buttonHref?: string; buttonIcon?: string; secondaryButtonText?: string; secondaryButtonHref?: string; }
interface CTAConfig { gradient?: boolean; }

const iconMap: Record<string, React.ElementType> = { heart: Heart, rocket: Rocket, zap: Zap, sparkles: Sparkles, arrow: ArrowRight };

export default function CTASection({ content, config }: { content: CTAContent; config?: CTAConfig }) {
  const Icon = iconMap[content.buttonIcon || "arrow"] || ArrowRight;
  const isGradient = config?.gradient;

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={"relative overflow-hidden rounded-3xl p-8 md:p-12 text-center " + (isGradient ? "bg-gradient-to-r from-[var(--rowi-g2)] via-[var(--rowi-g3)] to-[var(--rowi-g1)] text-white" : "bg-gray-100 dark:bg-zinc-900")}>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
            {content.subtitle && <p className={"text-lg mb-8 " + (isGradient ? "text-white/90" : "text-gray-600 dark:text-gray-400")}>{content.subtitle}</p>}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={content.buttonHref || "/register"} className={"px-8 py-4 rounded-xl font-medium flex items-center gap-2 group transition-all " + (isGradient ? "bg-white text-[var(--rowi-g2)] hover:bg-gray-100" : "bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white hover:opacity-90")}>
                {content.buttonText}<Icon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {content.secondaryButtonText && <Link href={content.secondaryButtonHref || "#"} className={"px-8 py-4 rounded-xl font-medium transition-all " + (isGradient ? "border-2 border-white/50 hover:border-white text-white" : "border-2 border-gray-300 dark:border-zinc-700 hover:border-[var(--rowi-g2)]")}>{content.secondaryButtonText}</Link>}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
