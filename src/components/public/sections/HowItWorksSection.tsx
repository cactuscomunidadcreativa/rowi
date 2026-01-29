"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
  icon?: string;
}

interface HowItWorksContent {
  title: string;
  subtitle?: string;
  steps: Step[];
}

interface HowItWorksConfig {
  columns?: 3 | 4;
  showNumbers?: boolean;
  layout?: "horizontal" | "vertical" | "timeline";
}

interface HowItWorksSectionProps {
  content: HowItWorksContent;
  config?: HowItWorksConfig;
}

export default function HowItWorksSection({ content, config }: HowItWorksSectionProps) {
  const layout = config?.layout || "horizontal";

  return (
    <section id="how-it-works" className="py-20 px-4 bg-gray-50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            {content.title}
          </motion.h2>
          {content.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {content.subtitle}
            </motion.p>
          )}
        </div>

        {/* Steps */}
        {layout === "timeline" ? (
          <TimelineSteps steps={content.steps} showNumbers={config?.showNumbers} />
        ) : (
          <HorizontalSteps steps={content.steps} showNumbers={config?.showNumbers} />
        )}
      </div>
    </section>
  );
}

function HorizontalSteps({ steps, showNumbers }: { steps: Step[]; showNumbers?: boolean }) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15 }}
          className="relative"
        >
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-[var(--rowi-g2)] to-transparent" />
          )}

          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800">
            {/* Step Number */}
            {showNumbers !== false && (
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rowi-g2)] to-[var(--rowi-g1)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {step.number}
              </div>
            )}

            <div className="pt-4">
              <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineSteps({ steps, showNumbers }: { steps: Step[]; showNumbers?: boolean }) {
  return (
    <div className="max-w-3xl mx-auto">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15 }}
          className="relative flex gap-6 pb-12 last:pb-0"
        >
          {/* Timeline Line */}
          {index < steps.length - 1 && (
            <div className="absolute left-6 top-12 w-[2px] h-full bg-gradient-to-b from-[var(--rowi-g2)] to-[var(--rowi-g1)]" />
          )}

          {/* Number Circle */}
          <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--rowi-g2)] to-[var(--rowi-g1)] flex items-center justify-center text-white font-bold shadow-lg">
            {showNumbers !== false ? step.number : <Check className="w-6 h-6" />}
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800">
            <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
