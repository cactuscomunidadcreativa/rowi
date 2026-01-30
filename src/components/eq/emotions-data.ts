/**
 * Definición de emociones para la Rueda de Emociones Progresiva
 * Basada en Plutchik + Six Seconds (5 niveles)
 *
 * Niveles Six Seconds:
 * 1. Desafío (8 emociones) - Plutchik básico
 * 2. Emergente (24 emociones)
 * 3. Funcional (48 emociones)
 * 4. Diestro (80 emociones)
 * 5. Experto (130+ emociones)
 */

export type EmotionLevel = "DESAFIO" | "EMERGENTE" | "FUNCIONAL" | "DIESTRO" | "EXPERTO";

export type EmotionCategory =
  | "HAPPY"
  | "SAD"
  | "ANGRY"
  | "FEARFUL"
  | "SURPRISED"
  | "BAD"
  | "DISGUSTED"
  | "TRUST";

export interface Emotion {
  slug: string;
  category: EmotionCategory;
  level: EmotionLevel;
  parent?: string;
  color: string;
  name: {
    es: string;
    en: string;
    pt: string;
    it: string;
  };
  definition: {
    es: string;
    en: string;
    pt: string;
    it: string;
  };
  adaptiveResponse: {
    es: string;
    en: string;
    pt: string;
    it: string;
  };
}

// Colores por categoría
export const CATEGORY_COLORS: Record<EmotionCategory, string> = {
  HAPPY: "#F7DC6F",
  SAD: "#5DADE2",
  ANGRY: "#E74C3C",
  FEARFUL: "#1ABC9C",
  SURPRISED: "#F39C12",
  BAD: "#E67E22",
  DISGUSTED: "#27AE60",
  TRUST: "#9B59B6",
};

// Colores de nivel Six Seconds
export const LEVEL_COLORS: Record<EmotionLevel, string> = {
  DESAFIO: "#ef4444",
  EMERGENTE: "#f59e0b",
  FUNCIONAL: "#3b82f6",
  DIESTRO: "#8b5cf6",
  EXPERTO: "#10b981",
};

// Info de niveles
export const LEVEL_INFO: Record<
  EmotionLevel,
  { name: { es: string; en: string; pt: string; it: string }; emoji: string; emotionCount: number }
> = {
  DESAFIO: {
    name: {
      es: "Desafío",
      en: "Challenge",
      pt: "Desafio",
      it: "Sfida",
    },
    emoji: "🧩",
    emotionCount: 8,
  },
  EMERGENTE: {
    name: {
      es: "Emergente",
      en: "Emerging",
      pt: "Emergente",
      it: "Emergente",
    },
    emoji: "🌱",
    emotionCount: 24,
  },
  FUNCIONAL: {
    name: {
      es: "Funcional",
      en: "Functional",
      pt: "Funcional",
      it: "Funzionale",
    },
    emoji: "🧠",
    emotionCount: 48,
  },
  DIESTRO: {
    name: {
      es: "Diestro",
      en: "Skilled",
      pt: "Hábil",
      it: "Abile",
    },
    emoji: "🎯",
    emotionCount: 80,
  },
  EXPERTO: {
    name: {
      es: "Experto",
      en: "Expert",
      pt: "Especialista",
      it: "Esperto",
    },
    emoji: "🌟",
    emotionCount: 130,
  },
};

// Mapeo de emociones Plutchik a slug
export const PLUTCHIK_EMOTIONS = [
  "JOY",
  "TRUST",
  "FEAR",
  "SURPRISE",
  "SADNESS",
  "DISGUST",
  "ANGER",
  "ANTICIPATION",
] as const;

export type PlutchikEmotion = (typeof PLUTCHIK_EMOTIONS)[number];

// Todas las emociones definidas
export const EMOTIONS: Emotion[] = [
  // ============================================
  // NIVEL 1: DESAFÍO (8 emociones Plutchik)
  // ============================================

  // HAPPY
  {
    slug: "JOY",
    category: "HAPPY",
    level: "DESAFIO",
    color: "#F7DC6F",
    name: {
      es: "Alegría",
      en: "Joy",
      pt: "Alegria",
      it: "Gioia",
    },
    definition: {
      es: "Sensación de bienestar y satisfacción que surge cuando algo bueno sucede o anticipamos algo positivo",
      en: "A feeling of well-being and satisfaction that arises when something good happens or we anticipate something positive",
      pt: "Sensação de bem-estar e satisfação que surge quando algo bom acontece ou antecipamos algo positivo",
      it: "Sensazione di benessere e soddisfazione che sorge quando accade qualcosa di buono o anticipiamo qualcosa di positivo",
    },
    adaptiveResponse: {
      es: "Compartir con otros, celebrar, expresar gratitud, usar la energía positiva para tareas importantes",
      en: "Share with others, celebrate, express gratitude, use positive energy for important tasks",
      pt: "Compartilhar com outros, celebrar, expressar gratidão, usar a energia positiva para tarefas importantes",
      it: "Condividere con gli altri, celebrare, esprimere gratitudine, usare l'energia positiva per compiti importanti",
    },
  },

  // TRUST
  {
    slug: "TRUST",
    category: "TRUST",
    level: "DESAFIO",
    color: "#9B59B6",
    name: {
      es: "Confianza",
      en: "Trust",
      pt: "Confiança",
      it: "Fiducia",
    },
    definition: {
      es: "Sensación de seguridad y fe en uno mismo, en otros o en una situación",
      en: "A feeling of security and faith in oneself, others, or a situation",
      pt: "Sensação de segurança e fé em si mesmo, nos outros ou em uma situação",
      it: "Sensazione di sicurezza e fiducia in se stessi, negli altri o in una situazione",
    },
    adaptiveResponse: {
      es: "Fortalecer relaciones, delegar cuando sea apropiado, expresar aprecio, mantener límites saludables",
      en: "Strengthen relationships, delegate when appropriate, express appreciation, maintain healthy boundaries",
      pt: "Fortalecer relacionamentos, delegar quando apropriado, expressar apreço, manter limites saudáveis",
      it: "Rafforzare le relazioni, delegare quando appropriato, esprimere apprezzamento, mantenere confini sani",
    },
  },

  // FEAR
  {
    slug: "FEAR",
    category: "FEARFUL",
    level: "DESAFIO",
    color: "#1ABC9C",
    name: {
      es: "Miedo",
      en: "Fear",
      pt: "Medo",
      it: "Paura",
    },
    definition: {
      es: "Señal de alerta ante un peligro percibido. Nos prepara para protegernos",
      en: "Alert signal to perceived danger. Prepares us to protect ourselves",
      pt: "Sinal de alerta diante de um perigo percebido. Nos prepara para nos proteger",
      it: "Segnale di allarme di fronte a un pericolo percepito. Ci prepara a proteggerci",
    },
    adaptiveResponse: {
      es: "Evaluar si el peligro es real, respirar profundo, buscar información, pedir ayuda si es necesario",
      en: "Assess if danger is real, breathe deeply, seek information, ask for help if needed",
      pt: "Avaliar se o perigo é real, respirar fundo, buscar informação, pedir ajuda se necessário",
      it: "Valutare se il pericolo è reale, respirare profondamente, cercare informazioni, chiedere aiuto se necessario",
    },
  },

  // SURPRISE
  {
    slug: "SURPRISE",
    category: "SURPRISED",
    level: "DESAFIO",
    color: "#F39C12",
    name: {
      es: "Sorpresa",
      en: "Surprise",
      pt: "Surpresa",
      it: "Sorpresa",
    },
    definition: {
      es: "Reacción breve ante algo inesperado. Nos ayuda a reorientar nuestra atención",
      en: "Brief reaction to something unexpected. Helps us reorient our attention",
      pt: "Reação breve diante de algo inesperado. Nos ajuda a reorientar nossa atenção",
      it: "Reazione breve a qualcosa di inaspettato. Ci aiuta a riorientare la nostra attenzione",
    },
    adaptiveResponse: {
      es: "Tomarte un momento para procesar, estar abierto a lo nuevo, ajustar expectativas",
      en: "Take a moment to process, be open to the new, adjust expectations",
      pt: "Dar um momento para processar, estar aberto ao novo, ajustar expectativas",
      it: "Prendersi un momento per elaborare, essere aperti al nuovo, aggiustare le aspettative",
    },
  },

  // SADNESS
  {
    slug: "SADNESS",
    category: "SAD",
    level: "DESAFIO",
    color: "#5DADE2",
    name: {
      es: "Tristeza",
      en: "Sadness",
      pt: "Tristeza",
      it: "Tristezza",
    },
    definition: {
      es: "Respuesta natural ante pérdidas, decepciones o situaciones dolorosas. Nos ayuda a procesar y sanar",
      en: "Natural response to losses, disappointments or painful situations. Helps us process and heal",
      pt: "Resposta natural diante de perdas, decepções ou situações dolorosas. Nos ajuda a processar e curar",
      it: "Risposta naturale a perdite, delusioni o situazioni dolorose. Ci aiuta a elaborare e guarire",
    },
    adaptiveResponse: {
      es: "Permitirte sentir, buscar apoyo, descansar, reflexionar sobre lo que valoras, ser compasivo contigo mismo",
      en: "Allow yourself to feel, seek support, rest, reflect on what you value, be compassionate with yourself",
      pt: "Permitir-se sentir, buscar apoio, descansar, refletir sobre o que você valoriza, ser compassivo consigo mesmo",
      it: "Permetterti di sentire, cercare supporto, riposare, riflettere su ciò che apprezzi, essere compassionevole con te stesso",
    },
  },

  // DISGUST
  {
    slug: "DISGUST",
    category: "DISGUSTED",
    level: "DESAFIO",
    color: "#27AE60",
    name: {
      es: "Disgusto",
      en: "Disgust",
      pt: "Nojo",
      it: "Disgusto",
    },
    definition: {
      es: "Rechazo hacia algo que percibimos como dañino o que viola nuestros valores",
      en: "Rejection of something we perceive as harmful or that violates our values",
      pt: "Rejeição a algo que percebemos como prejudicial ou que viola nossos valores",
      it: "Rifiuto di qualcosa che percepiamo come dannoso o che viola i nostri valori",
    },
    adaptiveResponse: {
      es: "Identificar qué valor está siendo amenazado, establecer límites, alejarte de lo tóxico",
      en: "Identify which value is being threatened, set boundaries, distance yourself from what's toxic",
      pt: "Identificar qual valor está sendo ameaçado, estabelecer limites, afastar-se do tóxico",
      it: "Identificare quale valore viene minacciato, stabilire confini, allontanarsi da ciò che è tossico",
    },
  },

  // ANGER
  {
    slug: "ANGER",
    category: "ANGRY",
    level: "DESAFIO",
    color: "#E74C3C",
    name: {
      es: "Enojo",
      en: "Anger",
      pt: "Raiva",
      it: "Rabbia",
    },
    definition: {
      es: "Respuesta a percibir una injusticia, amenaza o bloqueo de nuestras metas. Nos energiza para actuar",
      en: "Response to perceiving injustice, threat or blockage of our goals. Energizes us to act",
      pt: "Resposta a perceber uma injustiça, ameaça ou bloqueio de nossos objetivos. Nos energiza para agir",
      it: "Risposta alla percezione di ingiustizia, minaccia o blocco dei nostri obiettivi. Ci energizza per agire",
    },
    adaptiveResponse: {
      es: "Pausar antes de reaccionar, identificar la necesidad no satisfecha, comunicar con asertividad, canalizar la energía",
      en: "Pause before reacting, identify unmet need, communicate assertively, channel the energy",
      pt: "Pausar antes de reagir, identificar a necessidade não satisfeita, comunicar com assertividade, canalizar a energia",
      it: "Fermarsi prima di reagire, identificare il bisogno insoddisfatto, comunicare in modo assertivo, incanalare l'energia",
    },
  },

  // ANTICIPATION
  {
    slug: "ANTICIPATION",
    category: "BAD",
    level: "DESAFIO",
    color: "#E67E22",
    name: {
      es: "Anticipación",
      en: "Anticipation",
      pt: "Antecipação",
      it: "Anticipazione",
    },
    definition: {
      es: "Estado de alerta y preparación ante algo que va a suceder. Puede ser positiva (expectativa) o negativa (ansiedad)",
      en: "State of alertness and preparation for something that will happen. Can be positive (expectation) or negative (anxiety)",
      pt: "Estado de alerta e preparação para algo que vai acontecer. Pode ser positiva (expectativa) ou negativa (ansiedade)",
      it: "Stato di allerta e preparazione per qualcosa che accadrà. Può essere positiva (aspettativa) o negativa (ansia)",
    },
    adaptiveResponse: {
      es: "Planificar, prepararte, gestionar expectativas, estar presente en el momento actual",
      en: "Plan, prepare, manage expectations, be present in the current moment",
      pt: "Planejar, preparar-se, gerenciar expectativas, estar presente no momento atual",
      it: "Pianificare, prepararsi, gestire le aspettative, essere presente nel momento attuale",
    },
  },

  // ============================================
  // NIVEL 2: EMERGENTE (Emociones secundarias)
  // ============================================

  // HAPPY - Emergente
  {
    slug: "PLAYFUL",
    category: "HAPPY",
    level: "EMERGENTE",
    parent: "JOY",
    color: "#F7DC6F",
    name: { es: "Juguetón", en: "Playful", pt: "Brincalhão", it: "Giocoso" },
    definition: {
      es: "Sensación ligera de diversión y deseo de jugar o bromear",
      en: "Light feeling of fun and desire to play or joke around",
      pt: "Sensação leve de diversão e desejo de brincar ou fazer piadas",
      it: "Sensazione leggera di divertimento e desiderio di giocare o scherzare",
    },
    adaptiveResponse: {
      es: "Disfrutar el momento, compartir la alegría, no tomar todo tan en serio",
      en: "Enjoy the moment, share the joy, don't take everything so seriously",
      pt: "Aproveitar o momento, compartilhar a alegria, não levar tudo tão a sério",
      it: "Godersi il momento, condividere la gioia, non prendere tutto troppo sul serio",
    },
  },
  {
    slug: "CONTENT",
    category: "HAPPY",
    level: "EMERGENTE",
    parent: "JOY",
    color: "#F7DC6F",
    name: { es: "Contento", en: "Content", pt: "Contente", it: "Contento" },
    definition: {
      es: "Estado de satisfacción tranquila y paz interior",
      en: "State of quiet satisfaction and inner peace",
      pt: "Estado de satisfação tranquila e paz interior",
      it: "Stato di soddisfazione tranquilla e pace interiore",
    },
    adaptiveResponse: {
      es: "Saborear el momento, agradecer lo que tienes, mantener el equilibrio",
      en: "Savor the moment, appreciate what you have, maintain balance",
      pt: "Saborear o momento, agradecer o que você tem, manter o equilíbrio",
      it: "Assaporare il momento, apprezzare ciò che hai, mantenere l'equilibrio",
    },
  },
  {
    slug: "PROUD",
    category: "HAPPY",
    level: "EMERGENTE",
    parent: "JOY",
    color: "#F7DC6F",
    name: { es: "Orgulloso", en: "Proud", pt: "Orgulhoso", it: "Orgoglioso" },
    definition: {
      es: "Satisfacción por un logro propio o de alguien cercano",
      en: "Satisfaction from an achievement of your own or someone close",
      pt: "Satisfação por uma conquista própria ou de alguém próximo",
      it: "Soddisfazione per un risultato proprio o di qualcuno vicino",
    },
    adaptiveResponse: {
      es: "Celebrar el logro, compartirlo con humildad, usarlo como motivación",
      en: "Celebrate the achievement, share with humility, use it as motivation",
      pt: "Celebrar a conquista, compartilhar com humildade, usar como motivação",
      it: "Celebrare il risultato, condividere con umiltà, usarlo come motivazione",
    },
  },
  {
    slug: "OPTIMISTIC",
    category: "HAPPY",
    level: "EMERGENTE",
    parent: "JOY",
    color: "#F7DC6F",
    name: { es: "Optimista", en: "Optimistic", pt: "Otimista", it: "Ottimista" },
    definition: {
      es: "Expectativa positiva sobre el futuro y confianza en buenos resultados",
      en: "Positive expectation about the future and confidence in good outcomes",
      pt: "Expectativa positiva sobre o futuro e confiança em bons resultados",
      it: "Aspettativa positiva sul futuro e fiducia in buoni risultati",
    },
    adaptiveResponse: {
      es: "Canalizar la energía hacia metas, prepararse también para obstáculos, inspirar a otros",
      en: "Channel energy toward goals, also prepare for obstacles, inspire others",
      pt: "Canalizar a energia para metas, preparar-se também para obstáculos, inspirar outros",
      it: "Incanalare l'energia verso gli obiettivi, prepararsi anche per gli ostacoli, ispirare gli altri",
    },
  },

  // SAD - Emergente
  {
    slug: "LONELY",
    category: "SAD",
    level: "EMERGENTE",
    parent: "SADNESS",
    color: "#5DADE2",
    name: { es: "Solitario", en: "Lonely", pt: "Solitário", it: "Solitario" },
    definition: {
      es: "Sensación de aislamiento y deseo de conexión con otros",
      en: "Feeling of isolation and desire for connection with others",
      pt: "Sensação de isolamento e desejo de conexão com outros",
      it: "Sensazione di isolamento e desiderio di connessione con gli altri",
    },
    adaptiveResponse: {
      es: "Buscar conexión, iniciar contacto, participar en actividades sociales, cuidar de ti mismo",
      en: "Seek connection, initiate contact, participate in social activities, take care of yourself",
      pt: "Buscar conexão, iniciar contato, participar de atividades sociais, cuidar de si mesmo",
      it: "Cercare connessione, iniziare il contatto, partecipare ad attività sociali, prendersi cura di sé",
    },
  },
  {
    slug: "VULNERABLE",
    category: "SAD",
    level: "EMERGENTE",
    parent: "SADNESS",
    color: "#5DADE2",
    name: { es: "Vulnerable", en: "Vulnerable", pt: "Vulnerável", it: "Vulnerabile" },
    definition: {
      es: "Sensación de estar expuesto y susceptible emocionalmente",
      en: "Feeling of being exposed and emotionally susceptible",
      pt: "Sensação de estar exposto e suscetível emocionalmente",
      it: "Sensazione di essere esposto e suscettibile emotivamente",
    },
    adaptiveResponse: {
      es: "Reconocer la vulnerabilidad como fortaleza, pedir apoyo, establecer límites de protección",
      en: "Recognize vulnerability as strength, ask for support, set protective boundaries",
      pt: "Reconhecer a vulnerabilidade como força, pedir apoio, estabelecer limites de proteção",
      it: "Riconoscere la vulnerabilità come forza, chiedere supporto, stabilire confini protettivi",
    },
  },
  {
    slug: "GUILTY",
    category: "SAD",
    level: "EMERGENTE",
    parent: "SADNESS",
    color: "#5DADE2",
    name: { es: "Culpable", en: "Guilty", pt: "Culpado", it: "Colpevole" },
    definition: {
      es: "Sensación de haber hecho algo malo o no haber cumplido con expectativas",
      en: "Feeling of having done something wrong or not meeting expectations",
      pt: "Sensação de ter feito algo errado ou não ter cumprido expectativas",
      it: "Sensazione di aver fatto qualcosa di sbagliato o di non aver soddisfatto le aspettative",
    },
    adaptiveResponse: {
      es: "Evaluar si la culpa es proporcional, hacer enmiendas si es posible, perdonarte a ti mismo",
      en: "Assess if guilt is proportional, make amends if possible, forgive yourself",
      pt: "Avaliar se a culpa é proporcional, fazer reparações se possível, perdoar a si mesmo",
      it: "Valutare se la colpa è proporzionale, fare ammenda se possibile, perdonare te stesso",
    },
  },
  {
    slug: "HURT",
    category: "SAD",
    level: "EMERGENTE",
    parent: "SADNESS",
    color: "#5DADE2",
    name: { es: "Herido", en: "Hurt", pt: "Magoado", it: "Ferito" },
    definition: {
      es: "Dolor emocional causado por palabras o acciones de otros",
      en: "Emotional pain caused by words or actions of others",
      pt: "Dor emocional causada por palavras ou ações de outros",
      it: "Dolore emotivo causato da parole o azioni degli altri",
    },
    adaptiveResponse: {
      es: "Expresar cómo te sientes, establecer límites, buscar consuelo, darte tiempo para sanar",
      en: "Express how you feel, set boundaries, seek comfort, give yourself time to heal",
      pt: "Expressar como você se sente, estabelecer limites, buscar conforto, dar-se tempo para curar",
      it: "Esprimere come ti senti, stabilire confini, cercare conforto, darti tempo per guarire",
    },
  },

  // ANGRY - Emergente
  {
    slug: "FRUSTRATED",
    category: "ANGRY",
    level: "EMERGENTE",
    parent: "ANGER",
    color: "#E74C3C",
    name: { es: "Frustrado", en: "Frustrated", pt: "Frustrado", it: "Frustrato" },
    definition: {
      es: "Irritación cuando algo bloquea tus metas o expectativas",
      en: "Irritation when something blocks your goals or expectations",
      pt: "Irritação quando algo bloqueia seus objetivos ou expectativas",
      it: "Irritazione quando qualcosa blocca i tuoi obiettivi o aspettative",
    },
    adaptiveResponse: {
      es: "Identificar el obstáculo, buscar alternativas, pedir ayuda, tomar un descanso",
      en: "Identify the obstacle, look for alternatives, ask for help, take a break",
      pt: "Identificar o obstáculo, buscar alternativas, pedir ajuda, fazer uma pausa",
      it: "Identificare l'ostacolo, cercare alternative, chiedere aiuto, fare una pausa",
    },
  },
  {
    slug: "BITTER",
    category: "ANGRY",
    level: "EMERGENTE",
    parent: "ANGER",
    color: "#E74C3C",
    name: { es: "Amargado", en: "Bitter", pt: "Amargo", it: "Amareggiato" },
    definition: {
      es: "Resentimiento persistente por experiencias pasadas negativas",
      en: "Persistent resentment from negative past experiences",
      pt: "Ressentimento persistente por experiências passadas negativas",
      it: "Risentimento persistente per esperienze passate negative",
    },
    adaptiveResponse: {
      es: "Trabajar en el perdón, enfocarte en el presente, buscar apoyo terapéutico si es necesario",
      en: "Work on forgiveness, focus on the present, seek therapeutic support if needed",
      pt: "Trabalhar no perdão, focar no presente, buscar apoio terapêutico se necessário",
      it: "Lavorare sul perdono, concentrarsi sul presente, cercare supporto terapeutico se necessario",
    },
  },
  {
    slug: "CRITICAL",
    category: "ANGRY",
    level: "EMERGENTE",
    parent: "ANGER",
    color: "#E74C3C",
    name: { es: "Crítico", en: "Critical", pt: "Crítico", it: "Critico" },
    definition: {
      es: "Tendencia a juzgar negativamente a otros o a ti mismo",
      en: "Tendency to negatively judge others or yourself",
      pt: "Tendência a julgar negativamente os outros ou a si mesmo",
      it: "Tendenza a giudicare negativamente gli altri o te stesso",
    },
    adaptiveResponse: {
      es: "Practicar la compasión, buscar lo positivo, cuestionar tus estándares, ser más gentil",
      en: "Practice compassion, look for the positive, question your standards, be kinder",
      pt: "Praticar a compaixão, buscar o positivo, questionar seus padrões, ser mais gentil",
      it: "Praticare la compassione, cercare il positivo, mettere in discussione i tuoi standard, essere più gentile",
    },
  },

  // FEARFUL - Emergente
  {
    slug: "ANXIOUS",
    category: "FEARFUL",
    level: "EMERGENTE",
    parent: "FEAR",
    color: "#1ABC9C",
    name: { es: "Ansioso", en: "Anxious", pt: "Ansioso", it: "Ansioso" },
    definition: {
      es: "Preocupación excesiva por el futuro o situaciones inciertas",
      en: "Excessive worry about the future or uncertain situations",
      pt: "Preocupação excessiva com o futuro ou situações incertas",
      it: "Preoccupazione eccessiva per il futuro o situazioni incerte",
    },
    adaptiveResponse: {
      es: "Practicar técnicas de respiración, enfocarte en el presente, desafiar pensamientos negativos",
      en: "Practice breathing techniques, focus on the present, challenge negative thoughts",
      pt: "Praticar técnicas de respiração, focar no presente, desafiar pensamentos negativos",
      it: "Praticare tecniche di respirazione, concentrarsi sul presente, sfidare i pensieri negativi",
    },
  },
  {
    slug: "INSECURE",
    category: "FEARFUL",
    level: "EMERGENTE",
    parent: "FEAR",
    color: "#1ABC9C",
    name: { es: "Inseguro", en: "Insecure", pt: "Inseguro", it: "Insicuro" },
    definition: {
      es: "Falta de confianza en ti mismo o en tu posición",
      en: "Lack of confidence in yourself or your position",
      pt: "Falta de confiança em si mesmo ou em sua posição",
      it: "Mancanza di fiducia in te stesso o nella tua posizione",
    },
    adaptiveResponse: {
      es: "Reconocer tus fortalezas, recordar logros pasados, buscar feedback constructivo",
      en: "Recognize your strengths, remember past achievements, seek constructive feedback",
      pt: "Reconhecer suas forças, lembrar conquistas passadas, buscar feedback construtivo",
      it: "Riconoscere i tuoi punti di forza, ricordare i successi passati, cercare feedback costruttivo",
    },
  },
  {
    slug: "OVERWHELMED",
    category: "FEARFUL",
    level: "EMERGENTE",
    parent: "FEAR",
    color: "#1ABC9C",
    name: { es: "Abrumado", en: "Overwhelmed", pt: "Sobrecarregado", it: "Sopraffatto" },
    definition: {
      es: "Sensación de que hay demasiado que manejar y no tienes los recursos para hacerlo",
      en: "Feeling that there's too much to handle and you don't have the resources to do it",
      pt: "Sensação de que há muito para lidar e você não tem os recursos para fazer isso",
      it: "Sensazione che ci sia troppo da gestire e non hai le risorse per farlo",
    },
    adaptiveResponse: {
      es: "Priorizar una sola cosa, pedir ayuda, dividir tareas grandes en pequeñas, tomar descansos",
      en: "Prioritize one thing, ask for help, break big tasks into smaller ones, take breaks",
      pt: "Priorizar uma única coisa, pedir ajuda, dividir tarefas grandes em pequenas, fazer pausas",
      it: "Dare priorità a una sola cosa, chiedere aiuto, dividere compiti grandi in piccoli, fare pause",
    },
  },
  {
    slug: "WORRIED",
    category: "FEARFUL",
    level: "EMERGENTE",
    parent: "FEAR",
    color: "#1ABC9C",
    name: { es: "Preocupado", en: "Worried", pt: "Preocupado", it: "Preoccupato" },
    definition: {
      es: "Inquietud mental sobre posibles problemas o peligros futuros",
      en: "Mental unease about possible future problems or dangers",
      pt: "Inquietação mental sobre possíveis problemas ou perigos futuros",
      it: "Inquietudine mentale per possibili problemi o pericoli futuri",
    },
    adaptiveResponse: {
      es: "Distinguir entre preocupaciones productivas e improductivas, hacer un plan de acción, practicar mindfulness",
      en: "Distinguish between productive and unproductive worries, make an action plan, practice mindfulness",
      pt: "Distinguir entre preocupações produtivas e improdutivas, fazer um plano de ação, praticar mindfulness",
      it: "Distinguere tra preoccupazioni produttive e improduttive, fare un piano d'azione, praticare mindfulness",
    },
  },

  // SURPRISED - Emergente
  {
    slug: "CONFUSED",
    category: "SURPRISED",
    level: "EMERGENTE",
    parent: "SURPRISE",
    color: "#F39C12",
    name: { es: "Confundido", en: "Confused", pt: "Confuso", it: "Confuso" },
    definition: {
      es: "Estado de desorientación cuando algo no tiene sentido",
      en: "State of disorientation when something doesn't make sense",
      pt: "Estado de desorientação quando algo não faz sentido",
      it: "Stato di disorientamento quando qualcosa non ha senso",
    },
    adaptiveResponse: {
      es: "Pedir clarificación, tomarte tiempo para procesar, hacer preguntas, buscar información",
      en: "Ask for clarification, take time to process, ask questions, seek information",
      pt: "Pedir esclarecimento, dar tempo para processar, fazer perguntas, buscar informação",
      it: "Chiedere chiarimenti, prendersi tempo per elaborare, fare domande, cercare informazioni",
    },
  },
  {
    slug: "AMAZED",
    category: "SURPRISED",
    level: "EMERGENTE",
    parent: "SURPRISE",
    color: "#F39C12",
    name: { es: "Asombrado", en: "Amazed", pt: "Maravilhado", it: "Stupito" },
    definition: {
      es: "Sorpresa intensa y positiva ante algo extraordinario",
      en: "Intense and positive surprise at something extraordinary",
      pt: "Surpresa intensa e positiva diante de algo extraordinário",
      it: "Sorpresa intensa e positiva di fronte a qualcosa di straordinario",
    },
    adaptiveResponse: {
      es: "Disfrutar del momento, compartir la experiencia, cultivar la curiosidad",
      en: "Enjoy the moment, share the experience, cultivate curiosity",
      pt: "Aproveitar o momento, compartilhar a experiência, cultivar a curiosidade",
      it: "Godersi il momento, condividere l'esperienza, coltivare la curiosità",
    },
  },
  {
    slug: "EXCITED",
    category: "SURPRISED",
    level: "EMERGENTE",
    parent: "SURPRISE",
    color: "#F39C12",
    name: { es: "Emocionado", en: "Excited", pt: "Animado", it: "Emozionato" },
    definition: {
      es: "Estado de entusiasmo y energía alta ante algo positivo",
      en: "State of enthusiasm and high energy about something positive",
      pt: "Estado de entusiasmo e alta energia diante de algo positivo",
      it: "Stato di entusiasmo e alta energia per qualcosa di positivo",
    },
    adaptiveResponse: {
      es: "Canalizar la energía productivamente, compartir el entusiasmo, mantener los pies en la tierra",
      en: "Channel energy productively, share enthusiasm, stay grounded",
      pt: "Canalizar a energia produtivamente, compartilhar o entusiasmo, manter os pés no chão",
      it: "Incanalare l'energia produttivamente, condividere l'entusiasmo, restare con i piedi per terra",
    },
  },

  // BAD - Emergente
  {
    slug: "TIRED",
    category: "BAD",
    level: "EMERGENTE",
    parent: "ANTICIPATION",
    color: "#E67E22",
    name: { es: "Cansado", en: "Tired", pt: "Cansado", it: "Stanco" },
    definition: {
      es: "Estado de fatiga física o mental que reduce tu energía",
      en: "State of physical or mental fatigue that reduces your energy",
      pt: "Estado de fadiga física ou mental que reduz sua energia",
      it: "Stato di fatica fisica o mentale che riduce la tua energia",
    },
    adaptiveResponse: {
      es: "Descansar, priorizar tareas, establecer límites, cuidar tu sueño y alimentación",
      en: "Rest, prioritize tasks, set boundaries, take care of your sleep and nutrition",
      pt: "Descansar, priorizar tarefas, estabelecer limites, cuidar do sono e alimentação",
      it: "Riposare, dare priorità ai compiti, stabilire confini, prendersi cura del sonno e dell'alimentazione",
    },
  },
  {
    slug: "STRESSED",
    category: "BAD",
    level: "EMERGENTE",
    parent: "ANTICIPATION",
    color: "#E67E22",
    name: { es: "Estresado", en: "Stressed", pt: "Estressado", it: "Stressato" },
    definition: {
      es: "Tensión mental y física por demandas que exceden tus recursos percibidos",
      en: "Mental and physical tension from demands exceeding your perceived resources",
      pt: "Tensão mental e física por demandas que excedem seus recursos percebidos",
      it: "Tensione mentale e fisica da richieste che superano le tue risorse percepite",
    },
    adaptiveResponse: {
      es: "Identificar estresores, practicar técnicas de relajación, delegar, establecer límites",
      en: "Identify stressors, practice relaxation techniques, delegate, set boundaries",
      pt: "Identificar estressores, praticar técnicas de relaxamento, delegar, estabelecer limites",
      it: "Identificare i fattori di stress, praticare tecniche di rilassamento, delegare, stabilire confini",
    },
  },
  {
    slug: "BORED",
    category: "BAD",
    level: "EMERGENTE",
    parent: "ANTICIPATION",
    color: "#E67E22",
    name: { es: "Aburrido", en: "Bored", pt: "Entediado", it: "Annoiato" },
    definition: {
      es: "Falta de interés o estimulación en tu actividad actual",
      en: "Lack of interest or stimulation in your current activity",
      pt: "Falta de interesse ou estimulação na sua atividade atual",
      it: "Mancanza di interesse o stimolazione nella tua attività attuale",
    },
    adaptiveResponse: {
      es: "Buscar nuevos desafíos, aprender algo nuevo, cambiar de actividad, encontrar propósito",
      en: "Seek new challenges, learn something new, change activities, find purpose",
      pt: "Buscar novos desafios, aprender algo novo, mudar de atividade, encontrar propósito",
      it: "Cercare nuove sfide, imparare qualcosa di nuovo, cambiare attività, trovare uno scopo",
    },
  },
  {
    slug: "BUSY",
    category: "BAD",
    level: "EMERGENTE",
    parent: "ANTICIPATION",
    color: "#E67E22",
    name: { es: "Ocupado", en: "Busy", pt: "Ocupado", it: "Impegnato" },
    definition: {
      es: "Estado de tener muchas tareas y poco tiempo disponible",
      en: "State of having many tasks and little time available",
      pt: "Estado de ter muitas tarefas e pouco tempo disponível",
      it: "Stato di avere molti compiti e poco tempo a disposizione",
    },
    adaptiveResponse: {
      es: "Priorizar lo importante, delegar, decir no a lo no esencial, programar descansos",
      en: "Prioritize what's important, delegate, say no to non-essentials, schedule breaks",
      pt: "Priorizar o importante, delegar, dizer não ao não essencial, programar pausas",
      it: "Dare priorità all'importante, delegare, dire no al non essenziale, programmare pause",
    },
  },

  // DISGUSTED - Emergente
  {
    slug: "DISAPPOINTED",
    category: "DISGUSTED",
    level: "EMERGENTE",
    parent: "DISGUST",
    color: "#27AE60",
    name: { es: "Decepcionado", en: "Disappointed", pt: "Decepcionado", it: "Deluso" },
    definition: {
      es: "Tristeza por expectativas no cumplidas",
      en: "Sadness from unmet expectations",
      pt: "Tristeza por expectativas não cumpridas",
      it: "Tristezza per aspettative non soddisfatte",
    },
    adaptiveResponse: {
      es: "Ajustar expectativas, comunicar tus necesidades, buscar alternativas, aprender de la experiencia",
      en: "Adjust expectations, communicate your needs, look for alternatives, learn from the experience",
      pt: "Ajustar expectativas, comunicar suas necessidades, buscar alternativas, aprender com a experiência",
      it: "Aggiustare le aspettative, comunicare le tue esigenze, cercare alternative, imparare dall'esperienza",
    },
  },
  {
    slug: "DISAPPROVING",
    category: "DISGUSTED",
    level: "EMERGENTE",
    parent: "DISGUST",
    color: "#27AE60",
    name: { es: "Desaprobador", en: "Disapproving", pt: "Desaprovador", it: "Disapprovante" },
    definition: {
      es: "Juicio negativo hacia acciones o comportamientos de otros",
      en: "Negative judgment toward actions or behaviors of others",
      pt: "Julgamento negativo em relação a ações ou comportamentos de outros",
      it: "Giudizio negativo verso azioni o comportamenti altrui",
    },
    adaptiveResponse: {
      es: "Evaluar si tu juicio es justo, comunicar con respeto, mantener tus valores sin imponer",
      en: "Evaluate if your judgment is fair, communicate respectfully, maintain your values without imposing",
      pt: "Avaliar se seu julgamento é justo, comunicar com respeito, manter seus valores sem impor",
      it: "Valutare se il tuo giudizio è giusto, comunicare con rispetto, mantenere i tuoi valori senza imporre",
    },
  },

  // TRUST - Emergente
  {
    slug: "PEACEFUL",
    category: "TRUST",
    level: "EMERGENTE",
    parent: "TRUST",
    color: "#9B59B6",
    name: { es: "En paz", en: "Peaceful", pt: "Em paz", it: "In pace" },
    definition: {
      es: "Estado de calma interior y armonía con el entorno",
      en: "State of inner calm and harmony with surroundings",
      pt: "Estado de calma interior e harmonia com o ambiente",
      it: "Stato di calma interiore e armonia con l'ambiente circostante",
    },
    adaptiveResponse: {
      es: "Saborear el momento, compartir la calma, crear más espacios de paz en tu vida",
      en: "Savor the moment, share the calm, create more peaceful spaces in your life",
      pt: "Saborear o momento, compartilhar a calma, criar mais espaços de paz na sua vida",
      it: "Assaporare il momento, condividere la calma, creare più spazi di pace nella tua vita",
    },
  },
  {
    slug: "HOPEFUL",
    category: "TRUST",
    level: "EMERGENTE",
    parent: "TRUST",
    color: "#9B59B6",
    name: { es: "Esperanzado", en: "Hopeful", pt: "Esperançoso", it: "Speranzoso" },
    definition: {
      es: "Expectativa positiva de que algo bueno sucederá",
      en: "Positive expectation that something good will happen",
      pt: "Expectativa positiva de que algo bom acontecerá",
      it: "Aspettativa positiva che qualcosa di buono accadrà",
    },
    adaptiveResponse: {
      es: "Tomar acciones hacia tus metas, mantener la perspectiva, inspirar a otros",
      en: "Take actions toward your goals, maintain perspective, inspire others",
      pt: "Tomar ações em direção às suas metas, manter a perspectiva, inspirar outros",
      it: "Intraprendere azioni verso i tuoi obiettivi, mantenere la prospettiva, ispirare gli altri",
    },
  },
  {
    slug: "INTIMATE",
    category: "TRUST",
    level: "EMERGENTE",
    parent: "TRUST",
    color: "#9B59B6",
    name: { es: "Conectado", en: "Intimate", pt: "Conectado", it: "Connesso" },
    definition: {
      es: "Sensación de cercanía y conexión profunda con alguien",
      en: "Feeling of closeness and deep connection with someone",
      pt: "Sensação de proximidade e conexão profunda com alguém",
      it: "Sensazione di vicinanza e connessione profonda con qualcuno",
    },
    adaptiveResponse: {
      es: "Cultivar la relación, ser vulnerable, expresar aprecio, proteger la intimidad",
      en: "Cultivate the relationship, be vulnerable, express appreciation, protect the intimacy",
      pt: "Cultivar a relação, ser vulnerável, expressar apreço, proteger a intimidade",
      it: "Coltivare la relazione, essere vulnerabile, esprimere apprezzamento, proteggere l'intimità",
    },
  },
];

/**
 * Obtiene las emociones disponibles según el nivel del usuario
 */
export function getEmotionsByLevel(level: EmotionLevel): Emotion[] {
  const levelOrder: EmotionLevel[] = ["DESAFIO", "EMERGENTE", "FUNCIONAL", "DIESTRO", "EXPERTO"];
  const maxLevelIndex = levelOrder.indexOf(level);

  return EMOTIONS.filter((e) => {
    const emotionLevelIndex = levelOrder.indexOf(e.level);
    return emotionLevelIndex <= maxLevelIndex;
  });
}

/**
 * Obtiene solo las emociones base de Plutchik (nivel Desafío)
 */
export function getPlutchikEmotions(): Emotion[] {
  return EMOTIONS.filter((e) => e.level === "DESAFIO");
}

/**
 * Busca una emoción por su slug
 */
export function getEmotionBySlug(slug: string): Emotion | undefined {
  return EMOTIONS.find((e) => e.slug === slug);
}

/**
 * Agrupa emociones por categoría
 */
export function groupEmotionsByCategory(emotions: Emotion[]): Record<EmotionCategory, Emotion[]> {
  const grouped: Record<EmotionCategory, Emotion[]> = {
    HAPPY: [],
    SAD: [],
    ANGRY: [],
    FEARFUL: [],
    SURPRISED: [],
    BAD: [],
    DISGUSTED: [],
    TRUST: [],
  };

  emotions.forEach((emotion) => {
    grouped[emotion.category].push(emotion);
  });

  return grouped;
}
