"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Rueda de Sentimientos / Feelings Wheel
 * Basada en la rueda completa de sentimientos con 8 emociones primarias
 * y sus sub-emociones organizadas en anillos concéntricos.
 */

interface FeelingsWheelProps {
  selectedEmotion?: string | null;
  onSelect?: (emotion: string, intensity: number) => void;
  showIntensity?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

// Estructura de la rueda: emoción primaria → secundarias → terciarias
interface FeelingsCategory {
  slug: string;
  name: { es: string; en: string };
  color: string;
  emoji: string;
  secondary: {
    slug: string;
    name: { es: string; en: string };
    tertiary: { slug: string; name: { es: string; en: string } }[];
  }[];
}

const FEELINGS_DATA: FeelingsCategory[] = [
  {
    slug: "ALEGRIA",
    name: { es: "Alegría", en: "Joy" },
    color: "#F7DC6F",
    emoji: "😊",
    secondary: [
      {
        slug: "ESTREMECIMIENTO",
        name: { es: "Estremecimiento", en: "Thrill" },
        tertiary: [
          { slug: "GOZO", name: { es: "Gozo", en: "Bliss" } },
          { slug: "JUEGO", name: { es: "Juego", en: "Play" } },
          { slug: "DIVERSION", name: { es: "Diversión", en: "Fun" } },
        ],
      },
      {
        slug: "DICHA",
        name: { es: "Dicha", en: "Bliss" },
        tertiary: [
          { slug: "JOVIALIDAD", name: { es: "Jovialidad", en: "Joviality" } },
          { slug: "COMPLACENCIA", name: { es: "Complacencia", en: "Complacency" } },
        ],
      },
      {
        slug: "DELEITE",
        name: { es: "Deleite", en: "Delight" },
        tertiary: [
          { slug: "FELICIDAD", name: { es: "Felicidad", en: "Happiness" } },
          { slug: "CONTENTO", name: { es: "Contento/a", en: "Content" } },
        ],
      },
      {
        slug: "AMOR",
        name: { es: "Amor", en: "Love" },
        tertiary: [
          { slug: "APERTURA", name: { es: "Apertura", en: "Openness" } },
          { slug: "BIENVENIDO", name: { es: "Bienvenido/a", en: "Welcome" } },
        ],
      },
    ],
  },
  {
    slug: "CONFIANZA",
    name: { es: "Confianza", en: "Trust" },
    color: "#9B59B6",
    emoji: "🤝",
    secondary: [
      {
        slug: "VINCULO",
        name: { es: "Vínculo", en: "Bond" },
        tertiary: [
          { slug: "UNIDAD", name: { es: "Unidad", en: "Unity" } },
          { slug: "CALMA", name: { es: "Calma", en: "Calm" } },
        ],
      },
      {
        slug: "UNION",
        name: { es: "Unión", en: "Union" },
        tertiary: [
          { slug: "COMODIDAD", name: { es: "Comodidad", en: "Comfort" } },
          { slug: "FRANQUEZA", name: { es: "Franqueza", en: "Frankness" } },
        ],
      },
      {
        slug: "DEVOCION",
        name: { es: "Devoción", en: "Devotion" },
        tertiary: [
          { slug: "COMPROMISO", name: { es: "Compromiso", en: "Commitment" } },
          { slug: "LEALTAD", name: { es: "Lealtad", en: "Loyalty" } },
        ],
      },
      {
        slug: "SALVAGUARDA",
        name: { es: "Salvaguarda", en: "Safeguard" },
        tertiary: [
          { slug: "CUIDADO", name: { es: "Cuidado", en: "Care" } },
          { slug: "PROTECCION", name: { es: "Protección", en: "Protection" } },
        ],
      },
    ],
  },
  {
    slug: "TEMOR",
    name: { es: "Temor", en: "Fear" },
    color: "#1ABC9C",
    emoji: "😨",
    secondary: [
      {
        slug: "NERVIOS",
        name: { es: "Nervios", en: "Nerves" },
        tertiary: [
          { slug: "CAUTELA", name: { es: "Cautela", en: "Caution" } },
          { slug: "PRUDENTE", name: { es: "Prudente", en: "Prudent" } },
        ],
      },
      {
        slug: "SUSTO",
        name: { es: "Susto", en: "Fright" },
        tertiary: [
          { slug: "TITUBEANTE", name: { es: "Titubeante", en: "Hesitant" } },
          { slug: "INQUIETUD", name: { es: "Inquietud", en: "Restlessness" } },
        ],
      },
      {
        slug: "ANSIEDAD",
        name: { es: "Ansiedad", en: "Anxiety" },
        tertiary: [
          { slug: "INTRANQUILIDAD", name: { es: "Intranquilidad", en: "Uneasiness" } },
          { slug: "DUDA", name: { es: "Duda", en: "Doubt" } },
        ],
      },
      {
        slug: "CONMOCION",
        name: { es: "Conmoción", en: "Shock" },
        tertiary: [
          { slug: "SOBRESALTO", name: { es: "Sobresalto", en: "Startle" } },
          { slug: "TENSION", name: { es: "Tensión", en: "Tension" } },
        ],
      },
    ],
  },
  {
    slug: "SORPRESA",
    name: { es: "Sorpresa", en: "Surprise" },
    color: "#F39C12",
    emoji: "😮",
    secondary: [
      {
        slug: "ALARMA",
        name: { es: "Alarma", en: "Alarm" },
        tertiary: [
          { slug: "SACUDIR", name: { es: "Sacudir", en: "Jolt" } },
          { slug: "ABRUMAR", name: { es: "Abrumar", en: "Overwhelm" } },
        ],
      },
      {
        slug: "ASOMBRO",
        name: { es: "Asombro", en: "Amazement" },
        tertiary: [
          { slug: "CURIOSIDAD", name: { es: "Curiosidad", en: "Curiosity" } },
          { slug: "INTRIGA", name: { es: "Intriga", en: "Intrigue" } },
        ],
      },
      {
        slug: "ADMIRACION",
        name: { es: "Admiración", en: "Admiration" },
        tertiary: [
          { slug: "FASCINACION", name: { es: "Fascinación", en: "Fascination" } },
          { slug: "ATRACCION", name: { es: "Atracción", en: "Attraction" } },
        ],
      },
      {
        slug: "INCREDULIDAD",
        name: { es: "Incredulidad", en: "Disbelief" },
        tertiary: [
          { slug: "INCERTIDUMBRE", name: { es: "Incertidumbre", en: "Uncertainty" } },
          { slug: "ESTUPOR", name: { es: "Estupor", en: "Stupor" } },
        ],
      },
    ],
  },
  {
    slug: "TRISTEZA",
    name: { es: "Tristeza", en: "Sadness" },
    color: "#5DADE2",
    emoji: "😢",
    secondary: [
      {
        slug: "REBELDIA",
        name: { es: "Rebeldía", en: "Rebellion" },
        tertiary: [
          { slug: "CULPA", name: { es: "Culpa", en: "Guilt" } },
          { slug: "ARREPENTIMIENTO", name: { es: "Arrepentimiento", en: "Regret" } },
        ],
      },
      {
        slug: "NOSTALGIA",
        name: { es: "Nostalgia", en: "Nostalgia" },
        tertiary: [
          { slug: "AUSENTE", name: { es: "Ausente", en: "Absent" } },
          { slug: "PENSATIVO", name: { es: "Pensativo/a", en: "Pensive" } },
        ],
      },
      {
        slug: "DEPRESION",
        name: { es: "Depresión", en: "Depression" },
        tertiary: [
          { slug: "DESPOJO", name: { es: "Despojo", en: "Desolation" } },
          { slug: "ENTUMECIMIENTO", name: { es: "Entumecimiento", en: "Numbness" } },
        ],
      },
      {
        slug: "REMORDIMIENTO",
        name: { es: "Remordimiento", en: "Remorse" },
        tertiary: [
          { slug: "AMENAZA", name: { es: "Amenaza", en: "Threat" } },
          { slug: "DESASOSIEGO", name: { es: "Desasosiego", en: "Unrest" } },
        ],
      },
    ],
  },
  {
    slug: "DESAGRADO",
    name: { es: "Desagrado", en: "Disgust" },
    color: "#27AE60",
    emoji: "🤢",
    secondary: [
      {
        slug: "INDIGNACION",
        name: { es: "Indignación", en: "Indignation" },
        tertiary: [
          { slug: "ALTERAR", name: { es: "Alterar", en: "Disturb" } },
          { slug: "DESAPROBAR", name: { es: "Desaprobar", en: "Disapprove" } },
        ],
      },
      {
        slug: "DISGUSTO",
        name: { es: "Disgusto", en: "Disgust" },
        tertiary: [
          { slug: "DETESTAR", name: { es: "Detestar", en: "Detest" } },
          { slug: "RECHAZO", name: { es: "Rechazo", en: "Rejection" } },
        ],
      },
      {
        slug: "REPULSION",
        name: { es: "Repulsión", en: "Repulsion" },
        tertiary: [
          { slug: "ESCAPE", name: { es: "Escape", en: "Escape" } },
          { slug: "VACILANTE", name: { es: "Vacilante", en: "Hesitant" } },
        ],
      },
      {
        slug: "ABORRECIMIENTO",
        name: { es: "Aborrecimiento", en: "Loathing" },
        tertiary: [
          { slug: "ABANDONO", name: { es: "Abandono", en: "Abandonment" } },
          { slug: "AVERSION", name: { es: "Aversión", en: "Aversion" } },
        ],
      },
    ],
  },
  {
    slug: "FURIA",
    name: { es: "Furia", en: "Anger" },
    color: "#E74C3C",
    emoji: "😠",
    secondary: [
      {
        slug: "RABIA",
        name: { es: "Rabia", en: "Rage" },
        tertiary: [
          { slug: "HOSTILIDAD", name: { es: "Hostilidad", en: "Hostility" } },
          { slug: "IRRITABILIDAD", name: { es: "Irritabilidad", en: "Irritability" } },
        ],
      },
      {
        slug: "ODIO",
        name: { es: "Odio", en: "Hate" },
        tertiary: [
          { slug: "FRUSTRACION", name: { es: "Frustración", en: "Frustration" } },
          { slug: "PROVOCACION", name: { es: "Provocación", en: "Provocation" } },
        ],
      },
      {
        slug: "MOLESTIA",
        name: { es: "Molestia", en: "Annoyance" },
        tertiary: [
          { slug: "SARCASMO", name: { es: "Sarcasmo", en: "Sarcasm" } },
          { slug: "ESCEPTICISMO", name: { es: "Escepticismo", en: "Skepticism" } },
        ],
      },
      {
        slug: "ENFOQUE_FURIA",
        name: { es: "Enfoque", en: "Focus" },
        tertiary: [
          { slug: "SERIEDAD", name: { es: "Seriedad", en: "Seriousness" } },
          { slug: "DETERMINACION", name: { es: "Determinación", en: "Determination" } },
        ],
      },
    ],
  },
  {
    slug: "ANTICIPACION",
    name: { es: "Anticipación", en: "Anticipation" },
    color: "#E67E22",
    emoji: "😬",
    secondary: [
      {
        slug: "BUSQUEDA",
        name: { es: "Búsqueda", en: "Seeking" },
        tertiary: [
          { slug: "INTERROGANTE", name: { es: "Interrogante", en: "Questioning" } },
          { slug: "CURIOSIDAD_ANT", name: { es: "Curiosidad", en: "Curiosity" } },
        ],
      },
      {
        slug: "EXPECTACION",
        name: { es: "Expectación", en: "Expectation" },
        tertiary: [
          { slug: "ESPERANZA", name: { es: "Esperanza", en: "Hope" } },
          { slug: "IMPACIENCIA", name: { es: "Impaciencia", en: "Impatience" } },
        ],
      },
      {
        slug: "ANHELO",
        name: { es: "Anhelo", en: "Yearning" },
        tertiary: [
          { slug: "ENTUSIASMO", name: { es: "Entusiasmo", en: "Enthusiasm" } },
          { slug: "AGITACION", name: { es: "Agitación", en: "Agitation" } },
        ],
      },
      {
        slug: "ENFOQUE_ANT",
        name: { es: "Enfoque", en: "Focus" },
        tertiary: [
          { slug: "DETERMINACION_ANT", name: { es: "Determinación", en: "Determination" } },
          { slug: "SERIEDAD_ANT", name: { es: "Seriedad", en: "Seriousness" } },
        ],
      },
    ],
  },
];

// Flatten all emotions for search
function getAllFeelings(): { slug: string; name: { es: string; en: string }; category: string; categoryColor: string; level: "primary" | "secondary" | "tertiary" }[] {
  const result: { slug: string; name: { es: string; en: string }; category: string; categoryColor: string; level: "primary" | "secondary" | "tertiary" }[] = [];
  for (const cat of FEELINGS_DATA) {
    result.push({ slug: cat.slug, name: cat.name, category: cat.slug, categoryColor: cat.color, level: "primary" });
    for (const sec of cat.secondary) {
      result.push({ slug: sec.slug, name: sec.name, category: cat.slug, categoryColor: cat.color, level: "secondary" });
      for (const ter of sec.tertiary) {
        result.push({ slug: ter.slug, name: ter.name, category: cat.slug, categoryColor: cat.color, level: "tertiary" });
      }
    }
  }
  return result;
}

export function FeelingsWheel({
  selectedEmotion,
  onSelect,
  showIntensity = true,
  size = "md",
  disabled = false,
  className,
}: FeelingsWheelProps) {
  const { lang } = useI18n();
  const isEs = lang !== "en";

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<string | null>(selectedEmotion || null);
  const [intensity, setIntensity] = useState(5);

  const allFeelings = useMemo(() => getAllFeelings(), []);

  const selectedFeeling = allFeelings.find((f) => f.slug === (localSelected || selectedEmotion));
  const activeCategory = FEELINGS_DATA.find((c) => c.slug === selectedCategory);

  // Step 1: Show primary emotions
  // Step 2: Show secondary of selected primary
  // Step 3: Show tertiary of selected secondary

  const handlePrimaryClick = (cat: FeelingsCategory) => {
    if (disabled) return;
    setSelectedCategory(cat.slug);
    setSelectedSecondary(null);
    // Si quieren seleccionar la emoción primaria directamente
    setLocalSelected(cat.slug);
    onSelect?.(cat.slug, intensity);
  };

  const handleSecondaryClick = (sec: { slug: string; name: { es: string; en: string } }) => {
    if (disabled) return;
    setSelectedSecondary(sec.slug);
    setLocalSelected(sec.slug);
    onSelect?.(sec.slug, intensity);
  };

  const handleTertiaryClick = (ter: { slug: string; name: { es: string; en: string } }) => {
    if (disabled) return;
    setLocalSelected(ter.slug);
    onSelect?.(ter.slug, intensity);
  };

  const handleBack = () => {
    if (selectedSecondary) {
      setSelectedSecondary(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const sizeConfig = {
    sm: { ring: "w-16 h-16 text-xs", gap: "gap-2" },
    md: { ring: "w-20 h-20 text-sm", gap: "gap-3" },
    lg: { ring: "w-24 h-24 text-sm", gap: "gap-4" },
  };
  const cfg = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Título */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isEs ? "Rueda de Sentimientos" : "Feelings Wheel"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isEs
            ? selectedCategory
              ? selectedSecondary
                ? "Elige el matiz específico"
                : "¿Qué tipo de " + (activeCategory?.name.es.toLowerCase() || "") + " sientes?"
              : "¿Qué emoción principal sientes ahora?"
            : selectedCategory
              ? selectedSecondary
                ? "Choose the specific nuance"
                : "What kind of " + (activeCategory?.name.en.toLowerCase() || "") + " do you feel?"
              : "What primary emotion do you feel right now?"
          }
        </p>
      </div>

      {/* Back button */}
      {selectedCategory && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleBack}
          disabled={disabled}
          className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {isEs ? "Volver" : "Back"}
        </motion.button>
      )}

      {/* Rueda */}
      <div className={cn("flex flex-wrap justify-center", cfg.gap)}>
        <AnimatePresence mode="wait">
          {/* Level 1: Primary emotions */}
          {!selectedCategory && (
            <motion.div
              key="primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn("flex flex-wrap justify-center", cfg.gap, "max-w-md")}
            >
              {FEELINGS_DATA.map((cat) => (
                <motion.button
                  key={cat.slug}
                  onClick={() => handlePrimaryClick(cat)}
                  disabled={disabled}
                  className={cn(
                    cfg.ring,
                    "rounded-full flex flex-col items-center justify-center shadow-md transition-all",
                    "hover:scale-110 hover:shadow-lg",
                    localSelected === cat.slug && "ring-2 ring-offset-2 ring-primary scale-110",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: cat.color }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="font-medium text-slate-900 mt-0.5 leading-tight">
                    {isEs ? cat.name.es : cat.name.en}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Level 2: Secondary emotions */}
          {selectedCategory && !selectedSecondary && activeCategory && (
            <motion.div
              key="secondary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: `${activeCategory.color}33` }}>
                <span className="text-2xl">{activeCategory.emoji}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {isEs ? activeCategory.name.es : activeCategory.name.en}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isEs ? "Selecciona para más detalle" : "Select for more detail"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {activeCategory.secondary.map((sec) => (
                  <motion.button
                    key={sec.slug}
                    onClick={() => handleSecondaryClick(sec)}
                    disabled={disabled}
                    className={cn(
                      "px-4 py-3 rounded-xl text-left transition-all",
                      "hover:scale-[1.02] hover:shadow-md",
                      "border-2",
                      localSelected === sec.slug
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-white dark:bg-gray-800 shadow-sm"
                    )}
                    style={{
                      borderColor: localSelected === sec.slug ? activeCategory.color : undefined,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {isEs ? sec.name.es : sec.name.en}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {sec.tertiary.map((t) => (isEs ? t.name.es : t.name.en)).join(", ")}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Level 3: Tertiary emotions */}
          {selectedCategory && selectedSecondary && activeCategory && (
            <motion.div
              key="tertiary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md"
            >
              {/* Secondary header */}
              {(() => {
                const sec = activeCategory.secondary.find((s) => s.slug === selectedSecondary);
                if (!sec) return null;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: `${activeCategory.color}33` }}>
                      <span className="text-2xl">{activeCategory.emoji}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {isEs ? sec.name.es : sec.name.en}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {isEs ? activeCategory.name.es : activeCategory.name.en} → {isEs ? sec.name.es : sec.name.en}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Keep secondary as option */}
                      <motion.button
                        onClick={() => handleSecondaryClick(sec)}
                        disabled={disabled}
                        className={cn(
                          "px-4 py-4 rounded-xl text-center transition-all col-span-2",
                          "hover:scale-[1.02] hover:shadow-md border-2",
                          localSelected === sec.slug
                            ? "border-primary"
                            : "border-transparent bg-white dark:bg-gray-800 shadow-sm"
                        )}
                        style={{
                          borderColor: localSelected === sec.slug ? activeCategory.color : undefined,
                          backgroundColor: localSelected === sec.slug ? `${activeCategory.color}22` : undefined,
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {isEs ? sec.name.es : sec.name.en}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {isEs ? "Me quedo con esta emoción" : "I'll stay with this emotion"}
                        </span>
                      </motion.button>

                      {sec.tertiary.map((ter) => (
                        <motion.button
                          key={ter.slug}
                          onClick={() => handleTertiaryClick(ter)}
                          disabled={disabled}
                          className={cn(
                            "px-4 py-4 rounded-xl text-center transition-all",
                            "hover:scale-[1.02] hover:shadow-md border-2",
                            localSelected === ter.slug
                              ? "border-primary"
                              : "border-transparent bg-white dark:bg-gray-800 shadow-sm"
                          )}
                          style={{
                            borderColor: localSelected === ter.slug ? activeCategory.color : undefined,
                            backgroundColor: localSelected === ter.slug ? `${activeCategory.color}22` : undefined,
                          }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {isEs ? ter.name.es : ter.name.en}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected emotion display */}
      {selectedFeeling && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm p-4 rounded-lg border bg-card shadow-sm text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">
            {isEs ? "Seleccionaste:" : "You selected:"}
          </p>
          <p className="text-lg font-semibold" style={{ color: selectedFeeling.categoryColor }}>
            {isEs ? selectedFeeling.name.es : selectedFeeling.name.en}
          </p>
        </motion.div>
      )}

      {/* Selector de intensidad */}
      {showIntensity && (localSelected || selectedEmotion) && (
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium mb-2">
            {isEs ? "¿Qué tan intensa la sientes?" : "How intense do you feel it?"}: {intensity}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => {
              const newIntensity = parseInt(e.target.value);
              setIntensity(newIntensity);
              if (localSelected) {
                onSelect?.(localSelected, newIntensity);
              }
            }}
            disabled={disabled}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
            style={{
              accentColor: selectedFeeling?.categoryColor || "#8b5cf6",
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{isEs ? "Leve" : "Mild"}</span>
            <span>{isEs ? "Intensa" : "Intense"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeelingsWheel;
export { FEELINGS_DATA, getAllFeelings };
