"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  type Emotion,
  type EmotionLevel,
  type EmotionCategory,
  CATEGORY_COLORS,
  LEVEL_COLORS,
  LEVEL_INFO,
  getEmotionsByLevel,
  getPlutchikEmotions,
  groupEmotionsByCategory,
} from "./emotions-data";
import { cn } from "@/lib/utils";

interface EmotionWheelProps {
  userLevel?: EmotionLevel;
  selectedEmotion?: string | null;
  onSelect?: (emotion: string, intensity: number) => void;
  showIntensity?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function EmotionWheel({
  userLevel = "DESAFIO",
  selectedEmotion,
  onSelect,
  showIntensity = true,
  size = "md",
  disabled = false,
  className,
}: EmotionWheelProps) {
  const { t, lang } = useI18n();
  const [hoveredEmotion, setHoveredEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [localSelected, setLocalSelected] = useState<string | null>(selectedEmotion || null);

  // Obtener emociones según nivel
  const availableEmotions = useMemo(() => {
    return userLevel === "DESAFIO" ? getPlutchikEmotions() : getEmotionsByLevel(userLevel);
  }, [userLevel]);

  // Agrupar por categoría
  const emotionsByCategory = useMemo(() => {
    return groupEmotionsByCategory(availableEmotions);
  }, [availableEmotions]);

  // Tamaños
  const sizeConfig = {
    sm: { wheel: 280, center: 60, emotionSize: 40 },
    md: { wheel: 360, center: 80, emotionSize: 50 },
    lg: { wheel: 440, center: 100, emotionSize: 60 },
  };

  const config = sizeConfig[size];

  // Manejar selección
  const handleSelect = (emotion: Emotion) => {
    if (disabled) return;
    setLocalSelected(emotion.slug);
    onSelect?.(emotion.slug, intensity);
  };

  // Calcular posición en círculo
  const getEmotionPosition = (index: number, total: number, ring: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = config.center + ring * 50;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Organizar emociones en anillos
  const rings = useMemo(() => {
    const plutchik = availableEmotions.filter((e) => e.level === "DESAFIO");
    const secondary = availableEmotions.filter((e) => e.level === "EMERGENTE");
    const tertiary = availableEmotions.filter(
      (e) => e.level === "FUNCIONAL" || e.level === "DIESTRO" || e.level === "EXPERTO"
    );

    return [
      { emotions: plutchik, ring: 1 },
      ...(secondary.length > 0 ? [{ emotions: secondary, ring: 2 }] : []),
      ...(tertiary.length > 0 ? [{ emotions: tertiary, ring: 3 }] : []),
    ];
  }, [availableEmotions]);

  const selected = localSelected || selectedEmotion;
  const selectedEmotionData = availableEmotions.find((e) => e.slug === selected);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Nivel actual */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-white font-medium"
          style={{ backgroundColor: LEVEL_COLORS[userLevel] }}
        >
          {LEVEL_INFO[userLevel].emoji} {LEVEL_INFO[userLevel].name[lang as keyof typeof LEVEL_INFO.DESAFIO.name] || LEVEL_INFO[userLevel].name.en}
        </span>
        <span className="text-muted-foreground">
          {availableEmotions.length} {t("weekflow.emotions.available") || "emociones"}
        </span>
      </div>

      {/* Rueda */}
      <div
        className="relative"
        style={{ width: config.wheel, height: config.wheel }}
      >
        {/* Centro */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner"
          style={{
            width: config.center * 2,
            height: config.center * 2,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {selected ? (
            <div className="text-center">
              <span className="text-2xl">{getEmotionEmoji(selectedEmotionData?.category)}</span>
              <p className="text-xs font-medium mt-1">
                {selectedEmotionData?.name[lang as keyof typeof selectedEmotionData.name] ||
                  selectedEmotionData?.name.en}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm text-center px-2">
              {t("weekflow.checkin.selectEmotion") || "Selecciona"}
            </span>
          )}
        </div>

        {/* Anillos de emociones */}
        {rings.map(({ emotions, ring }) => (
          <div key={ring}>
            {emotions.map((emotion, index) => {
              const pos = getEmotionPosition(index, emotions.length, ring);
              const isSelected = selected === emotion.slug;
              const isHovered = hoveredEmotion?.slug === emotion.slug;

              return (
                <motion.button
                  key={emotion.slug}
                  onClick={() => handleSelect(emotion)}
                  onMouseEnter={() => setHoveredEmotion(emotion)}
                  onMouseLeave={() => setHoveredEmotion(null)}
                  disabled={disabled}
                  className={cn(
                    "absolute rounded-full flex items-center justify-center transition-all duration-200",
                    "hover:scale-110 hover:z-10",
                    isSelected && "ring-2 ring-offset-2 ring-primary scale-110 z-10",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    width: config.emotionSize,
                    height: config.emotionSize,
                    left: `calc(50% + ${pos.x}px - ${config.emotionSize / 2}px)`,
                    top: `calc(50% + ${pos.y}px - ${config.emotionSize / 2}px)`,
                    backgroundColor: isSelected || isHovered ? emotion.color : `${emotion.color}99`,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xs font-medium text-slate-900 truncate px-1">
                    {emotion.name[lang as keyof typeof emotion.name]?.slice(0, 3) ||
                      emotion.name.en.slice(0, 3)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip de emoción */}
      <AnimatePresence>
        {hoveredEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-sm p-4 rounded-lg border bg-card shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: hoveredEmotion.color }}
              />
              <h4 className="font-semibold">
                {hoveredEmotion.name[lang as keyof typeof hoveredEmotion.name] ||
                  hoveredEmotion.name.en}
              </h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {hoveredEmotion.definition[lang as keyof typeof hoveredEmotion.definition] ||
                hoveredEmotion.definition.en}
            </p>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-primary mb-1">
                {t("weekflow.emotions.adaptiveResponse") || "Respuesta adaptativa"}:
              </p>
              <p className="text-xs text-muted-foreground">
                {hoveredEmotion.adaptiveResponse[lang as keyof typeof hoveredEmotion.adaptiveResponse] ||
                  hoveredEmotion.adaptiveResponse.en}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selector de intensidad */}
      {showIntensity && selected && (
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium mb-2">
            {t("weekflow.emotions.intensity") || "¿Qué tan intensa la sientes?"}: {intensity}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => {
              const newIntensity = parseInt(e.target.value);
              setIntensity(newIntensity);
              if (selected) {
                onSelect?.(selected, newIntensity);
              }
            }}
            disabled={disabled}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
            style={{
              accentColor: selectedEmotionData?.color || CATEGORY_COLORS.HAPPY,
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{t("weekflow.emotions.intensityLow") || "Leve"}</span>
            <span>{t("weekflow.emotions.intensityHigh") || "Intensa"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para obtener emoji por categoría
function getEmotionEmoji(category?: EmotionCategory): string {
  const emojis: Record<EmotionCategory, string> = {
    HAPPY: "😊",
    SAD: "😢",
    ANGRY: "😠",
    FEARFUL: "😨",
    SURPRISED: "😮",
    BAD: "😫",
    DISGUSTED: "🤢",
    TRUST: "🤝",
  };
  return category ? emojis[category] : "🎯";
}

export default EmotionWheel;
