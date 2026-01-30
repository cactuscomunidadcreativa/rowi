// prisma/seed-data/six-seconds-content.ts
// Contenido de Six Seconds para MicroLearning y Knowledge Deployment

export const outcomes = [
  {
    key: "INFLUENCE",
    name_es: "Influencia",
    name_en: "Influence",
    description_es: "Capacidad de inspirar y guiar a otros hacia metas compartidas",
    description_en: "Ability to inspire and guide others toward shared goals",
    micro_actions: [
      { es: "Practica escuchar sin interrumpir durante una conversación completa", en: "Practice listening without interrupting for an entire conversation" },
      { es: "Identifica una emoción que sientes y compártela con alguien de confianza", en: "Identify an emotion you're feeling and share it with someone you trust" },
      { es: "Antes de dar feedback, pregunta: '¿Puedo compartir una observación?'", en: "Before giving feedback, ask: 'Can I share an observation?'" },
      { es: "Reconoce públicamente el aporte de un colega esta semana", en: "Publicly recognize a colleague's contribution this week" },
      { es: "En tu próxima reunión, haz una pregunta en lugar de dar una opinión", en: "In your next meeting, ask a question instead of giving an opinion" }
    ]
  },
  {
    key: "DECISION_MAKING",
    name_es: "Toma de Decisiones",
    name_en: "Decision Making",
    description_es: "Habilidad para tomar decisiones efectivas integrando datos y emociones",
    description_en: "Ability to make effective decisions integrating data and emotions",
    micro_actions: [
      { es: "Antes de decidir, pregúntate: '¿Qué me dice mi intuición sobre esto?'", en: "Before deciding, ask yourself: 'What does my intuition tell me about this?'" },
      { es: "Lista los pros y contras de una decisión pendiente", en: "List the pros and cons of a pending decision" },
      { es: "Identifica qué emoción está influyendo en tu decisión actual", en: "Identify which emotion is influencing your current decision" },
      { es: "Consulta a alguien con una perspectiva diferente antes de decidir", en: "Consult someone with a different perspective before deciding" },
      { es: "Reflexiona sobre una decisión pasada: ¿qué harías diferente?", en: "Reflect on a past decision: what would you do differently?" }
    ]
  },
  {
    key: "COMMUNITY",
    name_es: "Comunidad",
    name_en: "Community",
    description_es: "Sentido de pertenencia y conexión con otros",
    description_en: "Sense of belonging and connection with others",
    micro_actions: [
      { es: "Envía un mensaje de agradecimiento a alguien que te ha ayudado", en: "Send a thank you message to someone who has helped you" },
      { es: "Inicia una conversación con alguien que no conoces bien en tu equipo", en: "Start a conversation with someone you don't know well on your team" },
      { es: "Ofrece ayuda a un compañero sin esperar nada a cambio", en: "Offer help to a colleague without expecting anything in return" },
      { es: "Comparte un recurso útil con tu comunidad o equipo", en: "Share a useful resource with your community or team" },
      { es: "Organiza un momento informal de conexión con tu equipo", en: "Organize an informal connection moment with your team" }
    ]
  },
  {
    key: "NETWORK",
    name_es: "Red de Contactos",
    name_en: "Network",
    description_es: "Desarrollo y mantenimiento de relaciones profesionales valiosas",
    description_en: "Development and maintenance of valuable professional relationships",
    micro_actions: [
      { es: "Reconecta con un contacto profesional que no has hablado en meses", en: "Reconnect with a professional contact you haven't spoken to in months" },
      { es: "Presenta a dos personas de tu red que podrían beneficiarse mutuamente", en: "Introduce two people from your network who could benefit each other" },
      { es: "Asiste a un evento (virtual o presencial) relacionado con tu industria", en: "Attend an event (virtual or in-person) related to your industry" },
      { es: "Actualiza tu perfil profesional con tus logros recientes", en: "Update your professional profile with your recent achievements" },
      { es: "Pide feedback a un mentor o colega de confianza", en: "Ask for feedback from a mentor or trusted colleague" }
    ]
  },
  {
    key: "ACHIEVEMENT",
    name_es: "Logro",
    name_en: "Achievement",
    description_es: "Satisfacción por alcanzar metas significativas",
    description_en: "Satisfaction from reaching meaningful goals",
    micro_actions: [
      { es: "Define una meta pequeña y alcanzable para hoy", en: "Define a small, achievable goal for today" },
      { es: "Celebra un logro reciente, por pequeño que sea", en: "Celebrate a recent achievement, no matter how small" },
      { es: "Divide un objetivo grande en pasos más pequeños", en: "Break down a big goal into smaller steps" },
      { es: "Lleva un registro de tus victorias diarias durante una semana", en: "Keep track of your daily wins for a week" },
      { es: "Reflexiona sobre un obstáculo superado: ¿qué aprendiste?", en: "Reflect on an obstacle you overcame: what did you learn?" }
    ]
  },
  {
    key: "SATISFACTION",
    name_es: "Satisfacción",
    name_en: "Satisfaction",
    description_es: "Sentimiento de plenitud y contentamiento con la vida",
    description_en: "Feeling of fulfillment and contentment with life",
    micro_actions: [
      { es: "Escribe tres cosas por las que estás agradecido hoy", en: "Write three things you're grateful for today" },
      { es: "Dedica 10 minutos a una actividad que disfrutes sin culpa", en: "Spend 10 minutes on an activity you enjoy guilt-free" },
      { es: "Identifica qué momento del día te da más energía positiva", en: "Identify which moment of the day gives you the most positive energy" },
      { es: "Practica decir 'no' a algo que no te aporta valor", en: "Practice saying 'no' to something that doesn't add value" },
      { es: "Reflexiona: ¿qué pequeño cambio aumentaría tu satisfacción diaria?", en: "Reflect: what small change would increase your daily satisfaction?" }
    ]
  },
  {
    key: "BALANCE",
    name_es: "Equilibrio",
    name_en: "Balance",
    description_es: "Armonía entre diferentes aspectos de la vida",
    description_en: "Harmony between different aspects of life",
    micro_actions: [
      { es: "Programa tiempo en tu calendario para descanso o hobby", en: "Schedule time in your calendar for rest or a hobby" },
      { es: "Define límites claros entre trabajo y vida personal hoy", en: "Set clear boundaries between work and personal life today" },
      { es: "Identifica qué área de tu vida necesita más atención esta semana", en: "Identify which area of your life needs more attention this week" },
      { es: "Practica desconectarte de dispositivos durante la comida", en: "Practice disconnecting from devices during meals" },
      { es: "Dedica tiempo a una relación personal importante", en: "Dedicate time to an important personal relationship" }
    ]
  },
  {
    key: "HEALTH",
    name_es: "Salud",
    name_en: "Health",
    description_es: "Bienestar físico, mental y emocional",
    description_en: "Physical, mental and emotional wellbeing",
    micro_actions: [
      { es: "Toma un descanso de 5 minutos para respirar profundamente", en: "Take a 5-minute break for deep breathing" },
      { es: "Camina al menos 10 minutos durante tu día", en: "Walk at least 10 minutes during your day" },
      { es: "Bebe un vaso de agua extra hoy", en: "Drink an extra glass of water today" },
      { es: "Duerme 30 minutos antes de lo habitual esta noche", en: "Go to sleep 30 minutes earlier than usual tonight" },
      { es: "Practica un momento de mindfulness o meditación breve", en: "Practice a brief moment of mindfulness or meditation" }
    ]
  }
];

export const coreOutcomes = [
  {
    key: "EFFECTIVENESS",
    name_es: "Efectividad",
    name_en: "Effectiveness",
    description_es: "Capacidad de lograr resultados significativos y sostenibles",
    description_en: "Ability to achieve significant and sustainable results",
    components: ["INFLUENCE", "DECISION_MAKING"],
    micro_actions: [
      { es: "Prioriza las 3 tareas más importantes antes de iniciar tu día", en: "Prioritize the 3 most important tasks before starting your day" },
      { es: "Elimina una distracción recurrente de tu ambiente de trabajo", en: "Eliminate a recurring distraction from your work environment" },
      { es: "Mide el tiempo real que dedicas a tus tareas principales", en: "Measure the actual time you spend on your main tasks" },
      { es: "Delega una tarea que otro puede hacer mejor que tú", en: "Delegate a task that someone else can do better than you" }
    ]
  },
  {
    key: "RELATIONSHIPS",
    name_es: "Relaciones",
    name_en: "Relationships",
    description_es: "Calidad y profundidad de las conexiones interpersonales",
    description_en: "Quality and depth of interpersonal connections",
    components: ["COMMUNITY", "NETWORK"],
    micro_actions: [
      { es: "Practica la escucha empática en tu próxima conversación", en: "Practice empathic listening in your next conversation" },
      { es: "Expresa aprecio genuino a alguien importante para ti", en: "Express genuine appreciation to someone important to you" },
      { es: "Resuelve un pequeño conflicto pendiente con amabilidad", en: "Resolve a small pending conflict with kindness" },
      { es: "Dedica tiempo de calidad sin distracciones a una relación clave", en: "Dedicate quality time without distractions to a key relationship" }
    ]
  },
  {
    key: "QUALITY_OF_LIFE",
    name_es: "Calidad de Vida",
    name_en: "Quality of Life",
    description_es: "Satisfacción general con los diferentes aspectos de la vida",
    description_en: "Overall satisfaction with different aspects of life",
    components: ["ACHIEVEMENT", "SATISFACTION"],
    micro_actions: [
      { es: "Identifica una actividad que te drena energía y redúcela", en: "Identify an activity that drains your energy and reduce it" },
      { es: "Añade una actividad placentera a tu rutina semanal", en: "Add a pleasant activity to your weekly routine" },
      { es: "Reflexiona sobre qué significa 'éxito' para ti personalmente", en: "Reflect on what 'success' means to you personally" },
      { es: "Simplifica un aspecto de tu vida que se ha complicado", en: "Simplify an aspect of your life that has become complicated" }
    ]
  },
  {
    key: "WELLBEING",
    name_es: "Bienestar",
    name_en: "Wellbeing",
    description_es: "Estado de salud integral: física, mental y emocional",
    description_en: "State of comprehensive health: physical, mental and emotional",
    components: ["BALANCE", "HEALTH"],
    micro_actions: [
      { es: "Haz un chequeo emocional: ¿cómo te sientes realmente hoy?", en: "Do an emotional check-in: how do you really feel today?" },
      { es: "Practica auto-compasión cuando cometas un error", en: "Practice self-compassion when you make a mistake" },
      { es: "Establece un ritual de inicio o cierre de día", en: "Establish a morning or evening ritual" },
      { es: "Conecta con la naturaleza aunque sea por 5 minutos", en: "Connect with nature even if just for 5 minutes" }
    ]
  }
];

export const brainTalents = [
  {
    key: "BBE",
    name_es: "Evaluador Equilibrado",
    name_en: "Balanced Brain Evaluator",
    quadrant: "THINKING",
    description_es: "Integra múltiples perspectivas para análisis completo",
    description_en: "Integrates multiple perspectives for complete analysis",
    micro_actions: [
      { es: "Antes de opinar, considera al menos dos perspectivas diferentes", en: "Before giving your opinion, consider at least two different perspectives" },
      { es: "Lista los datos objetivos Y las emociones involucradas en una situación", en: "List the objective data AND the emotions involved in a situation" },
      { es: "Pide feedback a alguien con un estilo de pensamiento diferente al tuyo", en: "Ask for feedback from someone with a different thinking style than yours" }
    ]
  },
  {
    key: "BBI",
    name_es: "Innovador Equilibrado",
    name_en: "Balanced Brain Innovator",
    quadrant: "THINKING",
    description_es: "Genera ideas creativas integrando lógica e intuición",
    description_en: "Generates creative ideas integrating logic and intuition",
    micro_actions: [
      { es: "Dedica 5 minutos a lluvia de ideas sin juzgar ninguna", en: "Spend 5 minutes brainstorming without judging any ideas" },
      { es: "Combina una idea lógica con una intuición para crear algo nuevo", en: "Combine a logical idea with an intuition to create something new" },
      { es: "Pregunta '¿y si...?' al menos 3 veces sobre un problema actual", en: "Ask 'what if...?' at least 3 times about a current problem" }
    ]
  },
  {
    key: "BBD",
    name_es: "Conductor Equilibrado",
    name_en: "Balanced Brain Driver",
    quadrant: "ACTION",
    description_es: "Toma acción balanceando urgencia con reflexión",
    description_en: "Takes action balancing urgency with reflection",
    micro_actions: [
      { es: "Antes de actuar, toma 3 respiraciones profundas", en: "Before acting, take 3 deep breaths" },
      { es: "Define el resultado deseado antes de comenzar una tarea", en: "Define the desired outcome before starting a task" },
      { es: "Pausa para evaluar el progreso a mitad de un proyecto", en: "Pause to evaluate progress midway through a project" }
    ]
  },
  {
    key: "BBF",
    name_es: "Facilitador Equilibrado",
    name_en: "Balanced Brain Facilitator",
    quadrant: "RELATIONSHIP",
    description_es: "Conecta con otros equilibrando empatía y objetividad",
    description_en: "Connects with others balancing empathy and objectivity",
    micro_actions: [
      { es: "En tu próxima conversación, valida las emociones del otro antes de dar soluciones", en: "In your next conversation, validate the other's emotions before giving solutions" },
      { es: "Facilita que otros expresen sus ideas antes de compartir las tuyas", en: "Facilitate others expressing their ideas before sharing yours" },
      { es: "Busca el punto medio en un desacuerdo", en: "Seek the middle ground in a disagreement" }
    ]
  },
  {
    key: "IDE",
    name_es: "Evaluador Idealista",
    name_en: "Idealist Evaluator",
    quadrant: "THINKING",
    description_es: "Analiza situaciones desde valores y principios",
    description_en: "Analyzes situations from values and principles",
    micro_actions: [
      { es: "Antes de decidir, pregunta: '¿Esto está alineado con mis valores?'", en: "Before deciding, ask: 'Is this aligned with my values?'" },
      { es: "Identifica el valor más importante en juego en una situación", en: "Identify the most important value at stake in a situation" },
      { es: "Reflexiona sobre cómo una decisión afecta a otros", en: "Reflect on how a decision affects others" }
    ]
  },
  {
    key: "IDI",
    name_es: "Innovador Idealista",
    name_en: "Idealist Innovator",
    quadrant: "THINKING",
    description_es: "Crea soluciones guiadas por propósito y significado",
    description_en: "Creates solutions guided by purpose and meaning",
    micro_actions: [
      { es: "Conecta tu trabajo actual con un propósito más grande", en: "Connect your current work with a larger purpose" },
      { es: "Imagina la solución ideal sin limitaciones y luego adapta", en: "Imagine the ideal solution without limitations and then adapt" },
      { es: "Pregunta: '¿Cómo podemos hacer esto de forma más significativa?'", en: "Ask: 'How can we do this more meaningfully?'" }
    ]
  },
  {
    key: "IDD",
    name_es: "Conductor Idealista",
    name_en: "Idealist Driver",
    quadrant: "ACTION",
    description_es: "Actúa con determinación guiado por principios",
    description_en: "Acts with determination guided by principles",
    micro_actions: [
      { es: "Define el 'por qué' antes del 'cómo' de tu próxima acción", en: "Define the 'why' before the 'how' of your next action" },
      { es: "Toma una decisión difícil basándote en tus principios", en: "Make a difficult decision based on your principles" },
      { es: "Comunica el propósito detrás de una tarea a tu equipo", en: "Communicate the purpose behind a task to your team" }
    ]
  },
  {
    key: "IDF",
    name_es: "Facilitador Idealista",
    name_en: "Idealist Facilitator",
    quadrant: "RELATIONSHIP",
    description_es: "Conecta con otros a través de valores compartidos",
    description_en: "Connects with others through shared values",
    micro_actions: [
      { es: "Explora los valores de alguien con quien trabajas", en: "Explore the values of someone you work with" },
      { es: "Encuentra un valor compartido en un desacuerdo", en: "Find a shared value in a disagreement" },
      { es: "Inspira a otros compartiendo por qué algo te importa", en: "Inspire others by sharing why something matters to you" }
    ]
  },
  {
    key: "PRE",
    name_es: "Evaluador Práctico",
    name_en: "Practical Evaluator",
    quadrant: "THINKING",
    description_es: "Analiza con enfoque en resultados tangibles",
    description_en: "Analyzes with focus on tangible results",
    micro_actions: [
      { es: "Evalúa una situación preguntando: '¿Qué funciona y qué no?'", en: "Evaluate a situation by asking: 'What's working and what's not?'" },
      { es: "Identifica los datos clave necesarios para decidir", en: "Identify the key data needed to decide" },
      { es: "Simplifica un análisis complejo en 3 puntos clave", en: "Simplify a complex analysis into 3 key points" }
    ]
  },
  {
    key: "PRI",
    name_es: "Innovador Práctico",
    name_en: "Practical Innovator",
    quadrant: "THINKING",
    description_es: "Genera ideas aplicables y ejecutables",
    description_en: "Generates applicable and executable ideas",
    micro_actions: [
      { es: "Transforma una idea abstracta en un primer paso concreto", en: "Transform an abstract idea into a concrete first step" },
      { es: "Pregunta: '¿Cómo podemos probar esto rápidamente?'", en: "Ask: 'How can we test this quickly?'" },
      { es: "Identifica recursos existentes que puedas usar de forma nueva", en: "Identify existing resources you can use in a new way" }
    ]
  },
  {
    key: "PRD",
    name_es: "Conductor Práctico",
    name_en: "Practical Driver",
    quadrant: "ACTION",
    description_es: "Ejecuta con eficiencia y orientación a resultados",
    description_en: "Executes with efficiency and results orientation",
    micro_actions: [
      { es: "Define un entregable claro para tu próxima hora de trabajo", en: "Define a clear deliverable for your next hour of work" },
      { es: "Elimina un paso innecesario de un proceso que sigues", en: "Eliminate an unnecessary step from a process you follow" },
      { es: "Mide el resultado de una acción que tomaste recientemente", en: "Measure the result of an action you took recently" }
    ]
  },
  {
    key: "PRF",
    name_es: "Facilitador Práctico",
    name_en: "Practical Facilitator",
    quadrant: "RELATIONSHIP",
    description_es: "Ayuda a otros a lograr resultados concretos",
    description_en: "Helps others achieve concrete results",
    micro_actions: [
      { es: "Ofrece una solución práctica a un problema que alguien comparte", en: "Offer a practical solution to a problem someone shares" },
      { es: "Ayuda a alguien a convertir una queja en una acción", en: "Help someone turn a complaint into an action" },
      { es: "Facilita que tu equipo defina próximos pasos claros", en: "Facilitate your team defining clear next steps" }
    ]
  },
  {
    key: "EME",
    name_es: "Evaluador Empático",
    name_en: "Empathic Evaluator",
    quadrant: "THINKING",
    description_es: "Analiza considerando el impacto emocional",
    description_en: "Analyzes considering emotional impact",
    micro_actions: [
      { es: "Antes de decidir, considera: '¿Cómo se sentirán los afectados?'", en: "Before deciding, consider: 'How will those affected feel?'" },
      { es: "Incluye el factor humano en tu próximo análisis", en: "Include the human factor in your next analysis" },
      { es: "Pregunta a alguien cómo una decisión le afecta personalmente", en: "Ask someone how a decision affects them personally" }
    ]
  },
  {
    key: "EMI",
    name_es: "Innovador Empático",
    name_en: "Empathic Innovator",
    quadrant: "THINKING",
    description_es: "Crea soluciones centradas en las personas",
    description_en: "Creates people-centered solutions",
    micro_actions: [
      { es: "Diseña pensando primero en la experiencia del usuario", en: "Design thinking first about the user experience" },
      { es: "Pregunta: '¿Cómo haría esto la vida de alguien mejor?'", en: "Ask: 'How would this make someone's life better?'" },
      { es: "Observa las emociones de las personas al usar un producto o servicio", en: "Observe people's emotions when using a product or service" }
    ]
  },
  {
    key: "EMD",
    name_es: "Conductor Empático",
    name_en: "Empathic Driver",
    quadrant: "ACTION",
    description_es: "Lidera con sensibilidad hacia los demás",
    description_en: "Leads with sensitivity toward others",
    micro_actions: [
      { es: "Antes de asignar una tarea, considera el estado emocional de la persona", en: "Before assigning a task, consider the person's emotional state" },
      { es: "Celebra los esfuerzos, no solo los resultados", en: "Celebrate efforts, not just results" },
      { es: "Adapta tu estilo de comunicación a las necesidades del otro", en: "Adapt your communication style to the other's needs" }
    ]
  },
  {
    key: "EMF",
    name_es: "Facilitador Empático",
    name_en: "Empathic Facilitator",
    quadrant: "RELATIONSHIP",
    description_es: "Conecta profundamente con las emociones de otros",
    description_en: "Connects deeply with others' emotions",
    micro_actions: [
      { es: "Practica reflejar la emoción que percibes en otro: 'Parece que te sientes...'", en: "Practice reflecting the emotion you perceive in another: 'It seems you feel...'" },
      { es: "Crea un espacio seguro para que alguien comparta cómo se siente", en: "Create a safe space for someone to share how they feel" },
      { es: "Ofrece presencia sin intentar 'arreglar' el problema de alguien", en: "Offer presence without trying to 'fix' someone's problem" }
    ]
  },
  {
    key: "RTE",
    name_es: "Evaluador Racional",
    name_en: "Rational Evaluator",
    quadrant: "THINKING",
    description_es: "Analiza con lógica y objetividad",
    description_en: "Analyzes with logic and objectivity",
    micro_actions: [
      { es: "Separa los hechos de las interpretaciones en una situación", en: "Separate facts from interpretations in a situation" },
      { es: "Busca evidencia que contradiga tu hipótesis inicial", en: "Look for evidence that contradicts your initial hypothesis" },
      { es: "Estructura tu argumento con premisas claras y conclusión lógica", en: "Structure your argument with clear premises and logical conclusion" }
    ]
  },
  {
    key: "RTI",
    name_es: "Innovador Racional",
    name_en: "Rational Innovator",
    quadrant: "THINKING",
    description_es: "Genera ideas basadas en análisis sistemático",
    description_en: "Generates ideas based on systematic analysis",
    micro_actions: [
      { es: "Aplica un framework o modelo a un problema nuevo", en: "Apply a framework or model to a new problem" },
      { es: "Busca patrones en datos o situaciones pasadas", en: "Look for patterns in past data or situations" },
      { es: "Cuestiona los supuestos detrás de una 'verdad aceptada'", en: "Question the assumptions behind an 'accepted truth'" }
    ]
  }
];

export const eqCompetencies = [
  {
    key: "EEL",
    name_es: "Alfabetización Emocional",
    name_en: "Emotional Literacy",
    pillar: "KNOW_YOURSELF",
    description_es: "Reconocer y nombrar con precisión las emociones propias",
    description_en: "Accurately recognizing and naming one's own emotions",
    micro_actions: [
      { es: "Nombra la emoción que sientes ahora mismo con precisión", en: "Name the emotion you're feeling right now with precision" },
      { es: "Expande tu vocabulario emocional: aprende una nueva palabra emocional", en: "Expand your emotional vocabulary: learn a new emotional word" },
      { es: "Nota dónde sientes la emoción en tu cuerpo", en: "Notice where you feel the emotion in your body" },
      { es: "Lleva un diario emocional breve al final del día", en: "Keep a brief emotional journal at the end of the day" },
      { es: "Diferencia entre pensamientos y emociones en una situación", en: "Differentiate between thoughts and emotions in a situation" }
    ]
  },
  {
    key: "RP",
    name_es: "Reconocer Patrones",
    name_en: "Recognize Patterns",
    pillar: "KNOW_YOURSELF",
    description_es: "Identificar reacciones y comportamientos recurrentes",
    description_en: "Identifying recurring reactions and behaviors",
    micro_actions: [
      { es: "Identifica un trigger que activa una reacción automática en ti", en: "Identify a trigger that activates an automatic reaction in you" },
      { es: "Reflexiona: ¿en qué situaciones tiendes a reaccionar de la misma manera?", en: "Reflect: in what situations do you tend to react the same way?" },
      { es: "Nota cuando estés a punto de repetir un patrón conocido", en: "Notice when you're about to repeat a known pattern" },
      { es: "Pregunta a alguien de confianza qué patrones observa en ti", en: "Ask someone you trust what patterns they observe in you" },
      { es: "Mapea la secuencia: situación → emoción → pensamiento → acción", en: "Map the sequence: situation → emotion → thought → action" }
    ]
  },
  {
    key: "ACT",
    name_es: "Aplicar Consecuencias del Pensamiento",
    name_en: "Apply Consequential Thinking",
    pillar: "CHOOSE_YOURSELF",
    description_es: "Evaluar los costos y beneficios de las opciones",
    description_en: "Evaluating the costs and benefits of options",
    micro_actions: [
      { es: "Antes de actuar, pregunta: '¿Cuáles son las consecuencias de esto?'", en: "Before acting, ask: 'What are the consequences of this?'" },
      { es: "Considera el impacto a corto, mediano y largo plazo de una decisión", en: "Consider the short, medium and long-term impact of a decision" },
      { es: "Identifica quiénes se verán afectados por tu elección", en: "Identify who will be affected by your choice" },
      { es: "Evalúa: ¿qué gano y qué pierdo con esta opción?", en: "Evaluate: what do I gain and lose with this option?" },
      { es: "Piensa en tu 'yo futuro': ¿cómo se sentirá con esta decisión?", en: "Think of your 'future self': how will they feel about this decision?" }
    ]
  },
  {
    key: "NE",
    name_es: "Navegar Emociones",
    name_en: "Navigate Emotions",
    pillar: "CHOOSE_YOURSELF",
    description_es: "Gestionar emociones difíciles de manera constructiva",
    description_en: "Managing difficult emotions constructively",
    micro_actions: [
      { es: "Cuando sientas una emoción intensa, pausa y respira 3 veces", en: "When you feel an intense emotion, pause and breathe 3 times" },
      { es: "Usa la emoción como información: ¿qué te está diciendo?", en: "Use the emotion as information: what is it telling you?" },
      { es: "Practica tolerar una emoción incómoda sin reaccionar inmediatamente", en: "Practice tolerating an uncomfortable emotion without reacting immediately" },
      { es: "Transforma una emoción difícil en energía para la acción", en: "Transform a difficult emotion into energy for action" },
      { es: "Nombra la emoción para 'domesticarla': 'Estoy sintiendo frustración'", en: "Name the emotion to 'tame it': 'I'm feeling frustration'" }
    ]
  },
  {
    key: "EIM",
    name_es: "Ejercitar la Motivación Intrínseca",
    name_en: "Exercise Intrinsic Motivation",
    pillar: "CHOOSE_YOURSELF",
    description_es: "Conectar con motivaciones internas profundas",
    description_en: "Connecting with deep internal motivations",
    micro_actions: [
      { es: "Conecta una tarea aburrida con un valor o propósito personal", en: "Connect a boring task with a personal value or purpose" },
      { es: "Pregúntate: '¿Por qué esto es importante para MÍ?'", en: "Ask yourself: 'Why is this important to ME?'" },
      { es: "Identifica qué te da energía natural y haz más de eso", en: "Identify what gives you natural energy and do more of that" },
      { es: "Celebra el progreso, no solo los resultados finales", en: "Celebrate progress, not just final results" },
      { es: "Recuerda un momento de flujo: ¿qué estabas haciendo?", en: "Remember a moment of flow: what were you doing?" }
    ]
  },
  {
    key: "EO",
    name_es: "Ejercitar el Optimismo",
    name_en: "Exercise Optimism",
    pillar: "CHOOSE_YOURSELF",
    description_es: "Mantener una perspectiva constructiva y de posibilidad",
    description_en: "Maintaining a constructive and possibility perspective",
    micro_actions: [
      { es: "Reencuadra un 'fracaso' como una oportunidad de aprendizaje", en: "Reframe a 'failure' as a learning opportunity" },
      { es: "Identifica una cosa positiva en una situación difícil", en: "Identify one positive thing in a difficult situation" },
      { es: "Visualiza el mejor resultado posible de una situación", en: "Visualize the best possible outcome of a situation" },
      { es: "Practica gratitud: menciona 3 cosas buenas del día", en: "Practice gratitude: mention 3 good things about the day" },
      { es: "Cambia 'tengo que' por 'elijo' en tu lenguaje", en: "Change 'I have to' to 'I choose to' in your language" }
    ]
  },
  {
    key: "IE",
    name_es: "Incrementar la Empatía",
    name_en: "Increase Empathy",
    pillar: "GIVE_YOURSELF",
    description_es: "Comprender y conectar con las emociones de otros",
    description_en: "Understanding and connecting with others' emotions",
    micro_actions: [
      { es: "Pregunta '¿Cómo te sientes con esto?' y escucha sin juzgar", en: "Ask 'How do you feel about this?' and listen without judging" },
      { es: "Imagina la situación desde la perspectiva del otro", en: "Imagine the situation from the other person's perspective" },
      { es: "Observa el lenguaje corporal de alguien para entender cómo se siente", en: "Observe someone's body language to understand how they feel" },
      { es: "Valida la emoción del otro antes de dar consejos", en: "Validate the other's emotion before giving advice" },
      { es: "Practica curiosidad genuina sobre la experiencia de otra persona", en: "Practice genuine curiosity about another person's experience" }
    ]
  },
  {
    key: "PNG",
    name_es: "Perseguir Nobles Metas",
    name_en: "Pursue Noble Goals",
    pillar: "GIVE_YOURSELF",
    description_es: "Alinear acciones con un propósito más grande",
    description_en: "Aligning actions with a larger purpose",
    micro_actions: [
      { es: "Articula tu propósito en una frase clara y memorable", en: "Articulate your purpose in a clear and memorable phrase" },
      { es: "Conecta una acción de hoy con tu legado deseado", en: "Connect an action today with your desired legacy" },
      { es: "Pregunta: '¿Esto contribuye a algo más grande que yo?'", en: "Ask: 'Does this contribute to something bigger than me?'" },
      { es: "Identifica cómo tu trabajo beneficia a otros", en: "Identify how your work benefits others" },
      { es: "Revisa si tus metas actuales están alineadas con tus valores", en: "Review if your current goals are aligned with your values" }
    ]
  }
];

// Función helper para generar slugs únicos
export function generateMicroLearningSlug(category: string, parentKey: string, index: number): string {
  return `${category.toLowerCase()}_${parentKey.toLowerCase()}_action_${index + 1}`;
}
