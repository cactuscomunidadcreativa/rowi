"use client";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

interface Testimonial { quote: string; author: string; role?: string; company?: string; avatar?: string; rating?: number; }
interface TestimonialsContent { title?: string; subtitle?: string; testimonials: Testimonial[]; }
interface TestimonialsConfig { columns?: 2 | 3; showRating?: boolean; }

export default function TestimonialsSection({ content, config }: { content: TestimonialsContent; config?: TestimonialsConfig }) {
  const columns = config?.columns || 3;
  const gridCols: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3" };

  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <div className="text-center mb-16">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold mb-4">{content.title}</motion.h2>
            {content.subtitle && <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-gray-600 dark:text-gray-400">{content.subtitle}</motion.p>}
          </div>
        )}
        <div className={"grid gap-8 " + gridCols[columns]}>
          {content.testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800">
              <Quote className="absolute -top-3 -left-3 w-8 h-8 text-[var(--rowi-g2)] bg-white dark:bg-zinc-900 rounded-full p-1" />
              {config?.showRating && t.rating && <RatingStars rating={t.rating} />}
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rowi-g2)] to-[var(--rowi-g1)] flex items-center justify-center text-white font-bold">{t.author.charAt(0)}</div>
                <div><p className="font-semibold">{t.author}</p>{(t.role || t.company) && <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}{t.role && t.company && " · "}{t.company}</p>}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={"w-4 h-4 " + (n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
      ))}
    </div>
  );
}
