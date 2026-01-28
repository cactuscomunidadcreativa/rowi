// src/lib/eq/dictionary.ts
export const LONG_LABEL: Record<string, string> = {
  EL: "Enhance Emotional Literacy",
  RP: "Recognize Patterns",
  ACT: "Apply Consequential Thinking",
  NE: "Navigate Emotions",
  IM: "Engage Intrinsic Motivation",
  OP: "Exercise Optimism",
  EMP: "Increase Empathy",
  NG: "Pursue Noble Goals",
};

export const LONG_DEF: Record<string, string> = {
  EL: "Identificar y comprender emociones con precisión.",
  RP: "Detectar hábitos emocionales y conductuales.",
  ACT: "Evaluar costos y beneficios antes de actuar.",
  NE: "Transformar emociones en un recurso.",
  IM: "Mover la energía desde valores internos.",
  OP: "Ver posibilidades y mantener esperanza.",
  EMP: "Comprender y responder a otros.",
  NG: "Vivir con propósito y coherencia.",
};

// Colores SEI por pursuit (Know/Choose/Give) — guía Rowi SIA
export const COLOR_SEI: Record<string, string> = {
  EL: "#1E88E5", RP: "#1E88E5",                 // Know Yourself (Azul)
  ACT: "#E53935", NE: "#E53935", IM: "#E53935", OP: "#E53935", // Choose Yourself (Rojo)
  EMP: "#43A047", NG: "#43A047",                // Give Yourself (Verde)
};

export const COLOR_CLUSTERS = {
  focus: "#1E88E5",
  decisions: "#E53935",
  drive: "#43A047",
};

// i18n minimal (ES/EN). Puedes crecerlo luego.
export const I18N = {
  es: {
    compareLabel: "Comparar",
    past: "Pasado",
    date: "Fecha…",
    present: "Presente",
    compA: "Comparación",
    pursuitsTitle: "Pursuits (SEI)",
    moodRecent: "Mood reciente",
    eqTotal: "EQ Total",
  },
  en: {
    compareLabel: "Compare",
    past: "Past",
    date: "Date…",
    present: "Present",
    compA: "Comparison",
    pursuitsTitle: "Pursuits (SEI)",
    moodRecent: "Recent mood",
    eqTotal: "Total EQ",
  },
};
