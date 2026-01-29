/**
 * 📚 DICCIONARIO EXPANDIDO DE SIX SECONDS
 * =========================================
 * Definiciones completas del modelo SEI (Six Seconds Emotional Intelligence)
 *
 * Incluye:
 * 1. Competencias de Inteligencia Emocional (8)
 * 2. Factores de Éxito / Outcomes (4)
 * 3. Talentos Cerebrales / Brain Apps (18)
 * 4. Estilos Cerebrales / Brain Brief (8)
 */

// =============================================================================
// 1. COMPETENCIAS DE INTELIGENCIA EMOCIONAL (8)
// =============================================================================

export type CompetencyKey = "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG";
export type PursuitKey = "K" | "C" | "G";

export interface Competency {
  key: CompetencyKey;
  pursuit: PursuitKey;
  labelEN: string;
  labelES: string;
  definitionES: string;
  definitionEN: string;
  benefits: string[];
  risks: string[];
  color: string;
}

/** Labels largos en inglés */
export const LONG_LABEL: Record<CompetencyKey, string> = {
  EL: "Enhance Emotional Literacy",
  RP: "Recognize Patterns",
  ACT: "Apply Consequential Thinking",
  NE: "Navigate Emotions",
  IM: "Engage Intrinsic Motivation",
  OP: "Exercise Optimism",
  EMP: "Increase Empathy",
  NG: "Pursue Noble Goals",
};

/** Labels en español */
export const LABEL_ES: Record<CompetencyKey, string> = {
  EL: "Alfabetización Emocional",
  RP: "Reconocer Patrones",
  ACT: "Aplicar Pensamiento Consecuente",
  NE: "Navegar Emociones",
  IM: "Motivación Intrínseca",
  OP: "Ejercitar Optimismo",
  EMP: "Incrementar Empatía",
  NG: "Perseguir Metas Nobles",
};

/** Definiciones largas en español */
export const LONG_DEF: Record<CompetencyKey, string> = {
  EL: "Identificar y comprender emociones con precisión.",
  RP: "Detectar hábitos emocionales y conductuales.",
  ACT: "Evaluar costos y beneficios antes de actuar.",
  NE: "Transformar emociones en un recurso.",
  IM: "Mover la energía desde valores internos.",
  OP: "Ver posibilidades y mantener esperanza.",
  EMP: "Comprender y responder a otros.",
  NG: "Vivir con propósito y coherencia.",
};

/** Definiciones en inglés */
export const LONG_DEF_EN: Record<CompetencyKey, string> = {
  EL: "Identify and understand emotions accurately.",
  RP: "Detect emotional and behavioral habits.",
  ACT: "Evaluate costs and benefits before acting.",
  NE: "Transform emotions into a resource.",
  IM: "Move energy from internal values.",
  OP: "See possibilities and maintain hope.",
  EMP: "Understand and respond to others.",
  NG: "Live with purpose and coherence.",
};

/** Competencias completas con beneficios y riesgos */
export const COMPETENCIES: Record<CompetencyKey, Competency> = {
  EL: {
    key: "EL",
    pursuit: "K",
    labelEN: "Enhance Emotional Literacy",
    labelES: "Alfabetización Emocional",
    definitionES: "Identificar y comprender emociones con precisión.",
    definitionEN: "Identify and understand emotions accurately.",
    benefits: ["Claridad personal", "Mejor lenguaje emocional", "Autoconciencia"],
    risks: ["Reacciones automáticas", "Confusión emocional"],
    color: "#1E88E5",
  },
  RP: {
    key: "RP",
    pursuit: "K",
    labelEN: "Recognize Patterns",
    labelES: "Reconocer Patrones",
    definitionES: "Detectar hábitos emocionales y conductuales.",
    definitionEN: "Detect emotional and behavioral habits.",
    benefits: ["Salir de ciclos dañinos", "Autoconocimiento profundo"],
    risks: ["Repetir errores", "Automatismo"],
    color: "#1E88E5",
  },
  ACT: {
    key: "ACT",
    pursuit: "C",
    labelEN: "Apply Consequential Thinking",
    labelES: "Aplicar Pensamiento Consecuente",
    definitionES: "Evaluar costos y beneficios antes de actuar.",
    definitionEN: "Evaluate costs and benefits before acting.",
    benefits: ["Decisiones claras", "Anticipación", "Responsabilidad"],
    risks: ["Impulsividad", "Decisiones reactivas"],
    color: "#E53935",
  },
  NE: {
    key: "NE",
    pursuit: "C",
    labelEN: "Navigate Emotions",
    labelES: "Navegar Emociones",
    definitionES: "Transformar emociones en un recurso.",
    definitionEN: "Transform emotions into a resource.",
    benefits: ["Resiliencia", "Flexibilidad", "Gestión emocional"],
    risks: ["Quedar atrapado en emociones negativas", "Evitación emocional"],
    color: "#E53935",
  },
  IM: {
    key: "IM",
    pursuit: "C",
    labelEN: "Engage Intrinsic Motivation",
    labelES: "Motivación Intrínseca",
    definitionES: "Mover la energía desde valores internos.",
    definitionEN: "Move energy from internal values.",
    benefits: ["Persistencia", "Compromiso auténtico", "Autonomía"],
    risks: ["Falta de compromiso", "Dependencia de motivadores externos"],
    color: "#E53935",
  },
  OP: {
    key: "OP",
    pursuit: "C",
    labelEN: "Exercise Optimism",
    labelES: "Ejercitar Optimismo",
    definitionES: "Ver posibilidades y mantener esperanza.",
    definitionEN: "See possibilities and maintain hope.",
    benefits: ["Resiliencia", "Salud mental", "Visión de futuro"],
    risks: ["Rendirse fácil", "Pesimismo crónico"],
    color: "#E53935",
  },
  EMP: {
    key: "EMP",
    pursuit: "G",
    labelEN: "Increase Empathy",
    labelES: "Incrementar Empatía",
    definitionES: "Comprender y responder a otros.",
    definitionEN: "Understand and respond to others.",
    benefits: ["Confianza", "Colaboración", "Conexiones profundas"],
    risks: ["Aislamiento", "Dificultad para conectar"],
    color: "#43A047",
  },
  NG: {
    key: "NG",
    pursuit: "G",
    labelEN: "Pursue Noble Goals",
    labelES: "Perseguir Metas Nobles",
    definitionES: "Vivir con propósito y coherencia.",
    definitionEN: "Live with purpose and coherence.",
    benefits: ["Resiliencia", "Liderazgo inspirador", "Sentido de vida"],
    risks: ["Vacío existencial", "Desconexión del propósito"],
    color: "#43A047",
  },
};

// Colores SEI por pursuit (Know/Choose/Give)
export const COLOR_SEI: Record<CompetencyKey, string> = {
  EL: "#1E88E5", RP: "#1E88E5",                 // Know Yourself (Azul)
  ACT: "#E53935", NE: "#E53935", IM: "#E53935", OP: "#E53935", // Choose Yourself (Rojo)
  EMP: "#43A047", NG: "#43A047",                // Give Yourself (Verde)
};

export const COLOR_CLUSTERS = {
  focus: "#1E88E5",    // Know Yourself - Azul
  decisions: "#E53935", // Choose Yourself - Rojo
  drive: "#43A047",     // Give Yourself - Verde
};

// Pursuits (K, C, G)
export const PURSUITS = {
  K: {
    key: "K",
    labelEN: "Know Yourself",
    labelES: "Conócete",
    color: "#1E88E5",
    competencies: ["EL", "RP"] as CompetencyKey[],
    description: "Incrementar la conciencia de uno mismo, entender qué sientes y por qué.",
  },
  C: {
    key: "C",
    labelEN: "Choose Yourself",
    labelES: "Elígete",
    color: "#E53935",
    competencies: ["ACT", "NE", "IM", "OP"] as CompetencyKey[],
    description: "Manejar tus emociones y comportamientos de forma intencional.",
  },
  G: {
    key: "G",
    labelEN: "Give Yourself",
    labelES: "Entrégate",
    color: "#43A047",
    competencies: ["EMP", "NG"] as CompetencyKey[],
    description: "Poner tu visión e intenciones en acción con empatía y propósito.",
  },
};

// =============================================================================
// 2. FACTORES DE ÉXITO / OUTCOMES (4)
// =============================================================================

export type OutcomeKey = "effectiveness" | "relationships" | "wellbeing" | "qualityOfLife";
export type SubfactorKey =
  | "influence" | "decisionMaking"      // Effectiveness
  | "network" | "community"              // Relationships
  | "balance" | "health"                 // Wellbeing
  | "achievement" | "satisfaction";      // Quality of Life

export interface Outcome {
  key: OutcomeKey;
  labelEN: string;
  labelES: string;
  definitionES: string;
  definitionEN: string;
  subfactors: SubfactorKey[];
  color: string;
  icon: string;
}

export const OUTCOMES: Record<OutcomeKey, Outcome> = {
  effectiveness: {
    key: "effectiveness",
    labelEN: "Effectiveness",
    labelES: "Efectividad",
    definitionES: "Generar resultados y lograr objetivos.",
    definitionEN: "Generate results and achieve objectives.",
    subfactors: ["influence", "decisionMaking"],
    color: "#6366f1",
    icon: "target",
  },
  relationships: {
    key: "relationships",
    labelEN: "Relationships",
    labelES: "Relaciones",
    definitionES: "Construir y mantener redes de conexión.",
    definitionEN: "Build and maintain connection networks.",
    subfactors: ["network", "community"],
    color: "#ec4899",
    icon: "users",
  },
  wellbeing: {
    key: "wellbeing",
    labelEN: "Wellbeing",
    labelES: "Bienestar",
    definitionES: "Mantener energía y equilibrio vital.",
    definitionEN: "Maintain energy and vital balance.",
    subfactors: ["balance", "health"],
    color: "#22c55e",
    icon: "heart",
  },
  qualityOfLife: {
    key: "qualityOfLife",
    labelEN: "Quality of Life",
    labelES: "Calidad de Vida",
    definitionES: "Equilibrio y satisfacción general.",
    definitionEN: "Balance and overall satisfaction.",
    subfactors: ["achievement", "satisfaction"],
    color: "#f59e0b",
    icon: "sparkles",
  },
};

export interface Subfactor {
  key: SubfactorKey;
  outcomeKey: OutcomeKey;
  labelEN: string;
  labelES: string;
  definitionES: string;
}

export const SUBFACTORS: Record<SubfactorKey, Subfactor> = {
  influence: {
    key: "influence",
    outcomeKey: "effectiveness",
    labelEN: "Influence",
    labelES: "Influencia",
    definitionES: "Capacidad de impactar y movilizar a otros.",
  },
  decisionMaking: {
    key: "decisionMaking",
    outcomeKey: "effectiveness",
    labelEN: "Decision Making",
    labelES: "Toma de Decisiones",
    definitionES: "Habilidad para tomar decisiones efectivas.",
  },
  network: {
    key: "network",
    outcomeKey: "relationships",
    labelEN: "Network",
    labelES: "Red",
    definitionES: "Conexiones profesionales y personales.",
  },
  community: {
    key: "community",
    outcomeKey: "relationships",
    labelEN: "Community",
    labelES: "Comunidad",
    definitionES: "Sentido de pertenencia y contribución.",
  },
  balance: {
    key: "balance",
    outcomeKey: "wellbeing",
    labelEN: "Balance",
    labelES: "Balance",
    definitionES: "Equilibrio entre vida personal y profesional.",
  },
  health: {
    key: "health",
    outcomeKey: "wellbeing",
    labelEN: "Health",
    labelES: "Salud",
    definitionES: "Estado físico y mental saludable.",
  },
  achievement: {
    key: "achievement",
    outcomeKey: "qualityOfLife",
    labelEN: "Achievement",
    labelES: "Logro",
    definitionES: "Sensación de progreso y cumplimiento de metas.",
  },
  satisfaction: {
    key: "satisfaction",
    outcomeKey: "qualityOfLife",
    labelEN: "Satisfaction",
    labelES: "Satisfacción",
    definitionES: "Contentamiento con la vida actual.",
  },
};

// =============================================================================
// 3. TALENTOS CEREBRALES / BRAIN APPS (18)
// =============================================================================

export type BrainTalentCategory = "focus" | "decisions" | "drive";
export type FocusOrientation = "data" | "people";
export type DecisionOrientation = "evaluative" | "innovative";
export type DriveOrientation = "practical" | "idealistic";

export type BrainTalentKey =
  // Focus (Data)
  | "dataMining" | "modeling" | "prioritizing"
  // Focus (People)
  | "connection" | "emotionalInsight" | "collaboration"
  // Decisions (Evaluative)
  | "reflection" | "adaptability" | "criticalThinking"
  // Decisions (Innovative)
  | "resilience" | "riskTolerance" | "imagination"
  // Drive (Practical)
  | "proactivity" | "commitment" | "problemSolving"
  // Drive (Idealistic)
  | "vision" | "design" | "entrepreneurship";

export interface BrainTalent {
  key: BrainTalentKey;
  category: BrainTalentCategory;
  orientation: FocusOrientation | DecisionOrientation | DriveOrientation;
  labelEN: string;
  labelES: string;
  definitionES: string;
  definitionEN: string;
  strengths: string[];
  risks: string[];
  color: string;
}

export const BRAIN_TALENTS: Record<BrainTalentKey, BrainTalent> = {
  // === FOCUS - DATA ===
  dataMining: {
    key: "dataMining",
    category: "focus",
    orientation: "data",
    labelEN: "Data Mining",
    labelES: "Minería de Datos",
    definitionES: "Filtrar información clave de grandes volúmenes.",
    definitionEN: "Filter key information from large volumes.",
    strengths: ["Claridad", "Análisis preciso"],
    risks: ["Ignorar emociones", "Sobre-análisis"],
    color: "#1E88E5",
  },
  modeling: {
    key: "modeling",
    category: "focus",
    orientation: "data",
    labelEN: "Modeling",
    labelES: "Modelado",
    definitionES: "Mapear escenarios y proyectar resultados.",
    definitionEN: "Map scenarios and project outcomes.",
    strengths: ["Visión sistémica", "Planificación"],
    risks: ["Exceso de análisis", "Parálisis"],
    color: "#1E88E5",
  },
  prioritizing: {
    key: "prioritizing",
    category: "focus",
    orientation: "data",
    labelEN: "Prioritizing",
    labelES: "Priorización",
    definitionES: "Ordenar caminos y establecer jerarquías.",
    definitionEN: "Order paths and establish hierarchies.",
    strengths: ["Foco", "Organización"],
    risks: ["Indecisión", "Rigidez"],
    color: "#1E88E5",
  },
  // === FOCUS - PEOPLE ===
  connection: {
    key: "connection",
    category: "focus",
    orientation: "people",
    labelEN: "Connection",
    labelES: "Conexión",
    definitionES: "Sintonizar con las emociones de otros.",
    definitionEN: "Tune into others' emotions.",
    strengths: ["Empatía", "Rapport"],
    risks: ["Sobrecarga emocional", "Fusión"],
    color: "#1E88E5",
  },
  emotionalInsight: {
    key: "emotionalInsight",
    category: "focus",
    orientation: "people",
    labelEN: "Emotional Insight",
    labelES: "Perspicacia Emocional",
    definitionES: "Comprender dinámicas humanas profundas.",
    definitionEN: "Understand deep human dynamics.",
    strengths: ["Sabiduría interpersonal", "Intuición"],
    risks: ["Confusión", "Proyecciones"],
    color: "#1E88E5",
  },
  collaboration: {
    key: "collaboration",
    category: "focus",
    orientation: "people",
    labelEN: "Collaboration",
    labelES: "Colaboración",
    definitionES: "Crear armonía y trabajo en equipo.",
    definitionEN: "Create harmony and teamwork.",
    strengths: ["Cohesión", "Sinergia"],
    risks: ["Evitar conflictos", "Complacencia"],
    color: "#1E88E5",
  },
  // === DECISIONS - EVALUATIVE ===
  reflection: {
    key: "reflection",
    category: "decisions",
    orientation: "evaluative",
    labelEN: "Reflection",
    labelES: "Reflexión",
    definitionES: "Pausar para evaluar antes de actuar.",
    definitionEN: "Pause to evaluate before acting.",
    strengths: ["Claridad", "Profundidad"],
    risks: ["Lentitud", "Procrastinación"],
    color: "#E53935",
  },
  adaptability: {
    key: "adaptability",
    category: "decisions",
    orientation: "evaluative",
    labelEN: "Adaptability",
    labelES: "Adaptabilidad",
    definitionES: "Cambiar perspectiva según el contexto.",
    definitionEN: "Change perspective according to context.",
    strengths: ["Flexibilidad", "Agilidad"],
    risks: ["Inconsistencia", "Falta de identidad"],
    color: "#E53935",
  },
  criticalThinking: {
    key: "criticalThinking",
    category: "decisions",
    orientation: "evaluative",
    labelEN: "Critical Thinking",
    labelES: "Pensamiento Crítico",
    definitionES: "Analizar y planificar con rigor.",
    definitionEN: "Analyze and plan with rigor.",
    strengths: ["Solidez", "Lógica"],
    risks: ["Crítica excesiva", "Negatividad"],
    color: "#E53935",
  },
  // === DECISIONS - INNOVATIVE ===
  resilience: {
    key: "resilience",
    category: "decisions",
    orientation: "innovative",
    labelEN: "Resilience",
    labelES: "Resiliencia",
    definitionES: "Reponerse y seguir adelante.",
    definitionEN: "Bounce back and move forward.",
    strengths: ["Persistencia", "Fortaleza"],
    risks: ["Ignorar agotamiento", "Negación"],
    color: "#E53935",
  },
  riskTolerance: {
    key: "riskTolerance",
    category: "decisions",
    orientation: "innovative",
    labelEN: "Risk Tolerance",
    labelES: "Tolerancia al Riesgo",
    definitionES: "Aceptar incertidumbre y apostar.",
    definitionEN: "Accept uncertainty and take chances.",
    strengths: ["Innovación", "Valentía"],
    risks: ["Riesgos innecesarios", "Imprudencia"],
    color: "#E53935",
  },
  imagination: {
    key: "imagination",
    category: "decisions",
    orientation: "innovative",
    labelEN: "Imagination",
    labelES: "Imaginación",
    definitionES: "Visualizar lo nuevo y posible.",
    definitionEN: "Visualize the new and possible.",
    strengths: ["Creatividad", "Originalidad"],
    risks: ["Poco realismo", "Dispersión"],
    color: "#E53935",
  },
  // === DRIVE - PRACTICAL ===
  proactivity: {
    key: "proactivity",
    category: "drive",
    orientation: "practical",
    labelEN: "Proactivity",
    labelES: "Proactividad",
    definitionES: "Actuar antes de que sea necesario.",
    definitionEN: "Act before it becomes necessary.",
    strengths: ["Iniciativa", "Anticipación"],
    risks: ["Precipitación", "Impaciencia"],
    color: "#43A047",
  },
  commitment: {
    key: "commitment",
    category: "drive",
    orientation: "practical",
    labelEN: "Commitment",
    labelES: "Compromiso",
    definitionES: "Mantener el foco hasta completar.",
    definitionEN: "Maintain focus until completion.",
    strengths: ["Constancia", "Dedicación"],
    risks: ["Rigidez", "Inflexibilidad"],
    color: "#43A047",
  },
  problemSolving: {
    key: "problemSolving",
    category: "drive",
    orientation: "practical",
    labelEN: "Problem Solving",
    labelES: "Resolución de Problemas",
    definitionES: "Resolver situaciones de forma inmediata.",
    definitionEN: "Resolve situations immediately.",
    strengths: ["Efectividad", "Pragmatismo"],
    risks: ["Superficialidad", "Cortoplacismo"],
    color: "#43A047",
  },
  // === DRIVE - IDEALISTIC ===
  vision: {
    key: "vision",
    category: "drive",
    orientation: "idealistic",
    labelEN: "Vision",
    labelES: "Visión",
    definitionES: "Tener un norte claro y inspirador.",
    definitionEN: "Have a clear and inspiring north.",
    strengths: ["Propósito", "Dirección"],
    risks: ["Desconexión del presente", "Idealismo"],
    color: "#43A047",
  },
  design: {
    key: "design",
    category: "drive",
    orientation: "idealistic",
    labelEN: "Design",
    labelES: "Diseño",
    definitionES: "Planificar el futuro con intención.",
    definitionEN: "Plan the future with intention.",
    strengths: ["Innovación", "Estrategia"],
    risks: ["Exceso de planeación", "Inacción"],
    color: "#43A047",
  },
  entrepreneurship: {
    key: "entrepreneurship",
    category: "drive",
    orientation: "idealistic",
    labelEN: "Entrepreneurship",
    labelES: "Emprendimiento",
    definitionES: "Inventar soluciones para el futuro.",
    definitionEN: "Invent solutions for the future.",
    strengths: ["Disrupción", "Creación de valor"],
    risks: ["Dispersión", "Falta de foco"],
    color: "#43A047",
  },
};

// Agrupación de talentos por categoría
export const BRAIN_TALENT_CATEGORIES = {
  focus: {
    key: "focus",
    labelEN: "Focus",
    labelES: "Enfoque",
    color: "#1E88E5",
    orientations: {
      data: ["dataMining", "modeling", "prioritizing"] as BrainTalentKey[],
      people: ["connection", "emotionalInsight", "collaboration"] as BrainTalentKey[],
    },
  },
  decisions: {
    key: "decisions",
    labelEN: "Decisions",
    labelES: "Decisiones",
    color: "#E53935",
    orientations: {
      evaluative: ["reflection", "adaptability", "criticalThinking"] as BrainTalentKey[],
      innovative: ["resilience", "riskTolerance", "imagination"] as BrainTalentKey[],
    },
  },
  drive: {
    key: "drive",
    labelEN: "Drive",
    labelES: "Impulso",
    color: "#43A047",
    orientations: {
      practical: ["proactivity", "commitment", "problemSolving"] as BrainTalentKey[],
      idealistic: ["vision", "design", "entrepreneurship"] as BrainTalentKey[],
    },
  },
};

// =============================================================================
// 4. ESTILOS CEREBRALES / BRAIN BRIEF (8)
// =============================================================================

export type BrainStyleKey =
  | "scientist" | "visionary" | "inventor" | "guardian"
  | "strategist" | "energizer" | "doer" | "sage";

export interface BrainStyle {
  key: BrainStyleKey;
  labelEN: string;
  labelES: string;
  traits: string[];
  strengths: string[];
  risks: string[];
  facilitation: string;
  avoid: string;
  color: string;
  emoji: string;
}

export const BRAIN_STYLES: Record<BrainStyleKey, BrainStyle> = {
  scientist: {
    key: "scientist",
    labelEN: "Scientist",
    labelES: "Científico",
    traits: ["Preciso", "Analítico", "Prudente"],
    strengths: ["Rigor", "Exactitud", "Metodología"],
    risks: ["Inflexible", "Frío", "Lento para actuar"],
    facilitation: "Lógica + ejemplos concretos + datos",
    avoid: "Forzarlo con emociones sin fundamento",
    color: "#3b82f6",
    emoji: "🔬",
  },
  visionary: {
    key: "visionary",
    labelEN: "Visionary",
    labelES: "Visionario",
    traits: ["Apasionado", "Transformador", "Inspirador"],
    strengths: ["Inspira", "Ve el panorama completo", "Motiva cambio"],
    risks: ["Impráctico", "Impaciente", "Desconectado del presente"],
    facilitation: "Visión amplia + impacto futuro + propósito",
    avoid: "Frenarlo con datos anti-riesgo",
    color: "#8b5cf6",
    emoji: "🔮",
  },
  inventor: {
    key: "inventor",
    labelEN: "Inventor",
    labelES: "Inventor",
    traits: ["Creativo", "Experimental", "Curioso"],
    strengths: ["Soluciones originales", "Piensa diferente", "Innova"],
    risks: ["Dispersión", "Falta de seguimiento", "Caos"],
    facilitation: "Mapas mentales + espacio para explorar + conexiones",
    avoid: "Concreción temprana + rigidez",
    color: "#f59e0b",
    emoji: "💡",
  },
  guardian: {
    key: "guardian",
    labelEN: "Guardian",
    labelES: "Guardián",
    traits: ["Protector", "Prudente", "Leal"],
    strengths: ["Lealtad", "Cuidado", "Estabilidad"],
    risks: ["Aversión al cambio", "Sobreprotección", "Conservador"],
    facilitation: "Relación de confianza + pasos concretos + seguridad",
    avoid: "Hechos fríos sin contexto relacional",
    color: "#22c55e",
    emoji: "🛡️",
  },
  strategist: {
    key: "strategist",
    labelEN: "Strategist",
    labelES: "Estratega",
    traits: ["Planificador", "Lógico", "Sistemático"],
    strengths: ["Claridad", "Organización", "Visión a largo plazo"],
    risks: ["Perfeccionismo", "Parálisis por análisis", "Inflexibilidad"],
    facilitation: "Visión a largo plazo + estructura + opciones claras",
    avoid: "Presión sin estrategia + desorganización",
    color: "#6366f1",
    emoji: "♟️",
  },
  energizer: {
    key: "energizer",
    labelEN: "Energizer",
    labelES: "Energizador",
    traits: ["Dinámico", "Entusiasta", "Motivador"],
    strengths: ["Energía", "Motivación contagiosa", "Acción rápida"],
    risks: ["Burnout", "Superficialidad", "Impaciencia"],
    facilitation: "Ejemplos reales + movimiento + impacto visible",
    avoid: "Pedirles lentitud convencional + burocracia",
    color: "#ec4899",
    emoji: "⚡",
  },
  doer: {
    key: "doer",
    labelEN: "Doer",
    labelES: "Hacedor",
    traits: ["Ejecutor", "Práctico", "Orientado a resultados"],
    strengths: ["Resultados", "Eficiencia", "Acción directa"],
    risks: ["Atropella", "Ignora detalles", "Impaciente con procesos"],
    facilitation: "Razones prácticas + resultados claros + autonomía",
    avoid: "Conversaciones solo emocionales + teoría excesiva",
    color: "#ef4444",
    emoji: "🎯",
  },
  sage: {
    key: "sage",
    labelEN: "Sage",
    labelES: "Sabio",
    traits: ["Idealista", "Reflexivo", "Profundo"],
    strengths: ["Visión", "Sabiduría", "Perspectiva amplia"],
    risks: ["Desconexión práctica", "Lentitud", "Aislamiento"],
    facilitation: "Significado profundo + tiempo para reflexionar + valores",
    avoid: "Urgencia sin propósito + superficialidad",
    color: "#14b8a6",
    emoji: "🦉",
  },
};

// =============================================================================
// 5. HELPERS Y UTILIDADES
// =============================================================================

/** Obtener todas las competencias de un pursuit */
export function getCompetenciesByPursuit(pursuit: PursuitKey): Competency[] {
  return Object.values(COMPETENCIES).filter((c) => c.pursuit === pursuit);
}

/** Obtener color de competencia */
export function getCompetencyColor(key: CompetencyKey): string {
  return COMPETENCIES[key]?.color || "#94a3b8";
}

/** Obtener pursuit de una competencia */
export function getPursuitForCompetency(key: CompetencyKey): typeof PURSUITS[PursuitKey] {
  const pursuit = COMPETENCIES[key]?.pursuit;
  return PURSUITS[pursuit];
}

/** Obtener talentos por categoría */
export function getTalentsByCategory(category: BrainTalentCategory): BrainTalent[] {
  return Object.values(BRAIN_TALENTS).filter((t) => t.category === category);
}

/** Obtener estilo cerebral por key */
export function getBrainStyle(key: BrainStyleKey): BrainStyle {
  return BRAIN_STYLES[key];
}

/** Obtener outcomes con sus subfactores */
export function getOutcomeWithSubfactors(key: OutcomeKey) {
  const outcome = OUTCOMES[key];
  const subfactors = outcome.subfactors.map((sf) => SUBFACTORS[sf]);
  return { ...outcome, subfactorDetails: subfactors };
}

// =============================================================================
// 6. I18N MINIMAL (ES/EN)
// =============================================================================

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
    knowYourself: "Conócete",
    chooseYourself: "Elígete",
    giveYourself: "Entrégate",
    competencies: "Competencias",
    outcomes: "Resultados",
    brainTalents: "Talentos Cerebrales",
    brainStyle: "Estilo Cerebral",
    level: {
      challenge: "Desafío",
      emerging: "Emergente",
      functional: "Funcional",
      skilled: "Diestro",
      expert: "Experto",
    },
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
    knowYourself: "Know Yourself",
    chooseYourself: "Choose Yourself",
    giveYourself: "Give Yourself",
    competencies: "Competencies",
    outcomes: "Outcomes",
    brainTalents: "Brain Talents",
    brainStyle: "Brain Style",
    level: {
      challenge: "Challenge",
      emerging: "Emerging",
      functional: "Functional",
      skilled: "Skilled",
      expert: "Expert",
    },
  },
};

// Export all for convenience
export default {
  COMPETENCIES,
  PURSUITS,
  OUTCOMES,
  SUBFACTORS,
  BRAIN_TALENTS,
  BRAIN_TALENT_CATEGORIES,
  BRAIN_STYLES,
  COLOR_SEI,
  COLOR_CLUSTERS,
  I18N,
};
