"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  type EmotionLevel,
  LEVEL_COLORS,
  LEVEL_INFO,
} from "./emotions-data";
import { Button } from "@/components/ui/button";

interface EmotionLevelUpProps {
  isOpen: boolean;
  onClose: () => void;
  previousLevel: EmotionLevel;
  newLevel: EmotionLevel;
  newEmotionsCount: number;
}

export function EmotionLevelUp({
  isOpen,
  onClose,
  previousLevel,
  newLevel,
  newEmotionsCount,
}: EmotionLevelUpProps) {
  const { t, lang } = useI18n();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay para mostrar contenido después de la animación inicial
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, newLevel]);

  const levelInfo = LEVEL_INFO[newLevel];
  const prevLevelInfo = LEVEL_INFO[previousLevel];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-4 p-8 rounded-2xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-2xl"
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
              style={{ backgroundColor: LEVEL_COLORS[newLevel] }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl mb-4"
                >
                  {levelInfo.emoji}
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  {t("weekflow.emotions.levelUp.title") || "¡Tu vocabulario emocional creció!"}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground"
                >
                  {t("weekflow.emotions.levelUp.subtitle")?.replace("{count}", String(newEmotionsCount)) ||
                    `Ahora puedes expresar ${newEmotionsCount} emociones diferentes`}
                </motion.p>
              </div>

              {/* Level progression */}
              {showContent && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  {/* Previous level */}
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1 opacity-50"
                      style={{ backgroundColor: LEVEL_COLORS[previousLevel] }}
                    >
                      {prevLevelInfo.emoji}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {prevLevelInfo.name[lang as keyof typeof prevLevelInfo.name] || prevLevelInfo.name.en}
                    </span>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl"
                  >
                    →
                  </motion.div>

                  {/* New level */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-1 shadow-lg"
                      style={{ backgroundColor: LEVEL_COLORS[newLevel] }}
                    >
                      {levelInfo.emoji}
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: LEVEL_COLORS[newLevel] }}
                    >
                      {levelInfo.name[lang as keyof typeof levelInfo.name] || levelInfo.name.en}
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {/* Emotions unlocked */}
              {showContent && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center mb-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <p className="text-sm font-medium mb-1">
                    {t("weekflow.emotions.levelUp.newEmotions") || "Nuevas emociones desbloqueadas"}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: LEVEL_COLORS[newLevel] }}>
                    +{newEmotionsCount - LEVEL_INFO[previousLevel].emotionCount}
                  </p>
                </motion.div>
              )}

              {/* Close button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={onClose}
                  className="w-full"
                  style={{ backgroundColor: LEVEL_COLORS[newLevel] }}
                >
                  {t("common.continue") || "Continuar"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EmotionLevelUp;
