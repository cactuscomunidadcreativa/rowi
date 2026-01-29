"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  Brain,
  Eye,
  Repeat,
  Scale,
  Compass,
  Flame,
  Sun,
  Heart,
  Target,
  ChevronRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import { COMPETENCIES, PURSUITS, type CompetencyKey, type PursuitKey } from "@/domains/eq/lib/dictionary";

/**
 * 🧠 SEI Competencies Interactive Component
 * Muestra las 8 competencias de Six Seconds de forma interactiva
 */

const PURSUIT_ICONS: Record<PursuitKey, React.ElementType> = {
  K: Eye,      // Know Yourself
  C: Scale,    // Choose Yourself
  G: Heart,    // Give Yourself
};

const COMPETENCY_ICONS: Record<CompetencyKey, React.ElementType> = {
  EL: Brain,       // Enhance Emotional Literacy
  RP: Repeat,      // Recognize Patterns
  ACT: Scale,      // Apply Consequential Thinking
  NE: Compass,     // Navigate Emotions
  IM: Flame,       // Engage Intrinsic Motivation
  OP: Sun,         // Exercise Optimism
  EMP: Heart,      // Increase Empathy
  NG: Target,      // Pursue Noble Goals
};

interface SEICompetenciesProps {
  /** Mostrar descripción expandida */
  showDetails?: boolean;
  /** Layout: horizontal o vertical */
  layout?: "horizontal" | "vertical" | "grid";
}

export default function SEICompetencies({
  showDetails = true,
  layout = "vertical"
}: SEICompetenciesProps) {
  const { t, lang } = useI18n();
  const [selectedPursuit, setSelectedPursuit] = useState<PursuitKey>("K");
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyKey | null>(null);

  const pursuits = Object.values(PURSUITS);
  const currentPursuit = PURSUITS[selectedPursuit];
  const competencies = currentPursuit.competencies.map(key => COMPETENCIES[key]);

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/20 via-red-500/20 to-green-500/20 mb-4"
          >
            <Brain className="w-4 h-4 text-blue-500" />
            {t("sei.competencies.title", "8 Competencias de Inteligencia Emocional")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            {lang === "es" ? "El modelo" : "The"}{" "}
            <span className="bg-gradient-to-r from-blue-500 via-red-500 to-green-500 bg-clip-text text-transparent">
              Six Seconds
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto"
          >
            {lang === "es"
              ? "Tres áreas fundamentales y ocho competencias para desarrollar tu inteligencia emocional."
              : "Three fundamental areas and eight competencies to develop your emotional intelligence."}
          </motion.p>
        </div>

        {/* Pursuit Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {pursuits.map((pursuit, i) => {
            const Icon = PURSUIT_ICONS[pursuit.key as PursuitKey];
            const isActive = selectedPursuit === pursuit.key;

            return (
              <motion.button
                key={pursuit.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setSelectedPursuit(pursuit.key as PursuitKey);
                  setSelectedCompetency(null);
                }}
                className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 shadow-xl scale-105"
                    : "bg-[var(--rowi-card)] hover:bg-white dark:hover:bg-zinc-900"
                }`}
                style={{
                  borderWidth: 2,
                  borderColor: isActive ? pursuit.color : "transparent"
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: pursuit.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg">
                    {lang === "es" ? pursuit.labelES : pursuit.labelEN}
                  </p>
                  <p className="text-sm text-[var(--rowi-muted)]">
                    {pursuit.competencies.length} {lang === "es" ? "competencias" : "competencies"}
                  </p>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="pursuitIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                    style={{ backgroundColor: pursuit.color }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Pursuit Description */}
        <motion.div
          key={selectedPursuit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 p-6 rounded-2xl"
          style={{ backgroundColor: `${currentPursuit.color}10` }}
        >
          <p className="text-lg" style={{ color: currentPursuit.color }}>
            {currentPursuit.description}
          </p>
        </motion.div>

        {/* Competencies Grid */}
        <div className={`grid ${layout === "grid" ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2"} gap-4`}>
          {competencies.map((competency, index) => {
            const Icon = COMPETENCY_ICONS[competency.key];
            const isSelected = selectedCompetency === competency.key;

            return (
              <motion.div
                key={competency.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedCompetency(isSelected ? null : competency.key)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white dark:bg-zinc-900 shadow-xl"
                    : "bg-[var(--rowi-card)] hover:shadow-lg"
                }`}
                style={{
                  borderColor: isSelected ? competency.color : "transparent"
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: competency.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${competency.color}20`,
                          color: competency.color
                        }}
                      >
                        {competency.key}
                      </span>
                      <ChevronRight
                        className={`w-5 h-5 text-[var(--rowi-muted)] transition-transform ${
                          isSelected ? "rotate-90" : ""
                        }`}
                      />
                    </div>

                    <h3 className="font-semibold text-lg mb-1">
                      {lang === "es" ? competency.labelES : competency.labelEN}
                    </h3>

                    <p className="text-sm text-[var(--rowi-muted)]">
                      {lang === "es" ? competency.definitionES : competency.definitionEN}
                    </p>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && showDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-[var(--rowi-border)]">
                            {/* Benefits */}
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 mb-1">
                                <Check className="w-3 h-3" />
                                {lang === "es" ? "Beneficios" : "Benefits"}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {competency.benefits.map((benefit, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  >
                                    {benefit}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Risks */}
                            <div>
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                                <AlertTriangle className="w-3 h-3" />
                                {lang === "es" ? "Riesgos si no se desarrolla" : "Risks if not developed"}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {competency.risks.map((risk, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                  >
                                    {risk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-6 text-sm"
        >
          {pursuits.map(pursuit => (
            <div key={pursuit.key} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: pursuit.color }}
              />
              <span className="text-[var(--rowi-muted)]">
                {lang === "es" ? pursuit.labelES : pursuit.labelEN}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
