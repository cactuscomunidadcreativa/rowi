"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface Stat {
  value: string;
  label: string;
  suffix?: string;
  prefix?: string;
}

interface StatsContent {
  title?: string;
  subtitle?: string;
  stats: Stat[];
}

interface StatsConfig {
  columns?: 3 | 4;
  animated?: boolean;
  layout?: "cards" | "inline" | "gradient";
}

interface StatsSectionProps {
  content: StatsContent;
  config?: StatsConfig;
}

export default function StatsSection({ content, config }: StatsSectionProps) {
  const columns = config?.columns || 4;
  const layout = config?.layout || "gradient";

  const gridCols = {
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  if (layout === "gradient") {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[var(--rowi-g2)] via-[var(--rowi-g3)] to-[var(--rowi-g1)] rounded-3xl p-8 md:p-12"
          >
            <div className={`grid gap-8 ${gridCols[columns]}`}>
              {content.stats.map((stat, index) => (
                <StatItem
                  key={index}
                  stat={stat}
                  index={index}
                  animated={config?.animated !== false}
                  light
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto">
        {(content.title || content.subtitle) && (
          <div className="text-center mb-12">
            {content.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                {content.title}
              </motion.h2>
            )}
            {content.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-gray-600 dark:text-gray-400"
              >
                {content.subtitle}
              </motion.p>
            )}
          </div>
        )}

        <div className={`grid gap-8 ${gridCols[columns]}`}>
          {content.stats.map((stat, index) => (
            <StatItem
              key={index}
              stat={stat}
              index={index}
              animated={config?.animated !== false}
              card={layout === "cards"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({
  stat,
  index,
  animated,
  light,
  card,
}: {
  stat: Stat;
  index: number;
  animated: boolean;
  light?: boolean;
  card?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(stat.value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateValue();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [animated, stat.value]);

  const animateValue = () => {
    const numericValue = parseInt(stat.value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(numericValue)) {
      setDisplayValue(stat.value);
      return;
    }

    const duration = 1500;
    const steps = 40;
    const stepDuration = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += numericValue / steps;
      if (current >= numericValue) {
        setDisplayValue(stat.value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current).toString());
      }
    }, stepDuration);
  };

  const content = (
    <>
      <div
        className={`text-4xl md:text-5xl font-bold mb-2 ${
          light ? "text-white" : "rowi-gradient-text"
        }`}
      >
        {stat.prefix}
        {displayValue}
        {stat.suffix}
      </div>
      <div className={light ? "text-white/80" : "text-gray-600 dark:text-gray-400"}>
        {stat.label}
      </div>
    </>
  );

  if (card) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800 text-center"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="text-center"
    >
      {content}
    </motion.div>
  );
}
