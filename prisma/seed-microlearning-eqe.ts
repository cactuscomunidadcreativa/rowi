/**
 * Seed de MicroLearning con el programa EQ Educator (EQE1/2/3) de
 * Six Seconds, adaptado para adultos 18+ (no para educadores).
 *
 * Estructura:
 *   - 8 SEI competencies × 3 niveles = 24 micro-lessons
 *   - EQE1 (BEGINNER): Know Yourself — autoconocimiento básico
 *   - EQE2 (INTERMEDIATE): Choose Yourself — autogestión aplicada
 *   - EQE3 (ADVANCED): Give Yourself — propósito y aporte al sistema
 *
 * Cada lección es idempotente vía `upsert` por slug.
 *
 * Run: `npx tsx prisma/seed-microlearning-eqe.ts`
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Sei = "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG";
type Level = "EQE1" | "EQE2" | "EQE3";

interface Lesson {
  sei: Sei;
  level: Level;
  title: string;
  titleEN: string;
  description: string;
  descriptionEN: string;
  durationMin: number;
}

const LESSONS: Lesson[] = [
  // EL — Enhance Emotional Literacy
  {
    sei: "EL", level: "EQE1",
    title: "Nombrar lo que sientes — el primer músculo",
    titleEN: "Name what you feel — the first muscle",
    description: "Tres veces hoy, antes de reaccionar, nombrá la emoción con una palabra precisa. No 'mal' ni 'bien' — buscá la palabra exacta.",
    descriptionEN: "Three times today, before reacting, name the emotion with a precise word. Not 'bad' nor 'good' — find the exact word.",
    durationMin: 5,
  },
  {
    sei: "EL", level: "EQE2",
    title: "El vocabulario de tu cuerpo",
    titleEN: "Your body's vocabulary",
    description: "Cada emoción se anuncia en el cuerpo antes que en la mente. Esta semana mapeá dónde sentís miedo, rabia, alegría y tristeza.",
    descriptionEN: "Every emotion announces itself in the body before the mind. This week map where you feel fear, anger, joy and sadness.",
    durationMin: 8,
  },
  {
    sei: "EL", level: "EQE3",
    title: "Alfabetización emocional al servicio del otro",
    titleEN: "Emotional literacy in service of the other",
    description: "Practica nombrar la emoción de quien tienes en frente. No diagnosticar, no resolver — solo reflejar con precisión lo que ves.",
    descriptionEN: "Practice naming the emotion of the person in front of you. Don't diagnose, don't fix — just reflect with precision what you see.",
    durationMin: 12,
  },

  // RP — Recognize Patterns
  {
    sei: "RP", level: "EQE1",
    title: "El patrón que se repite",
    titleEN: "The pattern that repeats",
    description: "¿Qué reacción tuya se repite cuando algo te sale mal? Identifica una sola y anótala. La consciencia es la mitad del cambio.",
    descriptionEN: "Which reaction of yours repeats when things go wrong? Identify just one and write it down. Awareness is half the change.",
    durationMin: 5,
  },
  {
    sei: "RP", level: "EQE2",
    title: "El disparador antes del patrón",
    titleEN: "The trigger before the pattern",
    description: "Cada patrón tiene un disparador concreto: una palabra, un tono, una situación. Esta semana cazá tres disparadores propios.",
    descriptionEN: "Every pattern has a concrete trigger: a word, a tone, a situation. This week catch three of your own triggers.",
    durationMin: 8,
  },
  {
    sei: "RP", level: "EQE3",
    title: "Patrones colectivos en tus equipos",
    titleEN: "Collective patterns in your teams",
    description: "Los patrones también son grupales. ¿Cuál es el patrón emocional dominante de tu equipo? Nombralo sin juzgar.",
    descriptionEN: "Patterns are also collective. What's the dominant emotional pattern of your team? Name it without judging.",
    durationMin: 12,
  },

  // ACT — Apply Consequential Thinking
  {
    sei: "ACT", level: "EQE1",
    title: "La pausa de seis segundos",
    titleEN: "The six-second pause",
    description: "Antes de responder a algo que te activa, contá hasta seis. Esa pausa es la diferencia entre reaccionar y responder.",
    descriptionEN: "Before responding to something that activates you, count to six. That pause is the difference between reacting and responding.",
    durationMin: 5,
  },
  {
    sei: "ACT", level: "EQE2",
    title: "Mapear las consecuencias",
    titleEN: "Mapping consequences",
    description: "Antes de una decisión importante esta semana, escribí 3 consecuencias posibles a 24h, a 1 mes y a 1 año. Decidí desde ahí.",
    descriptionEN: "Before an important decision this week, write 3 possible consequences at 24h, 1 month and 1 year. Decide from there.",
    durationMin: 10,
  },
  {
    sei: "ACT", level: "EQE3",
    title: "Pensamiento consecuente sistémico",
    titleEN: "Systemic consequential thinking",
    description: "Una decisión tuya impacta más allá de ti. Identifica una decisión reciente y mapeá qué cambió para 3 personas distintas.",
    descriptionEN: "A decision of yours impacts beyond you. Identify a recent decision and map what changed for 3 different people.",
    durationMin: 12,
  },

  // NE — Navigate Emotions
  {
    sei: "NE", level: "EQE1",
    title: "Quedarte con la emoción",
    titleEN: "Stay with the emotion",
    description: "La próxima vez que sientas algo incómodo, no lo reprimas ni lo soluciones: quedate 60 segundos con la sensación. Observala.",
    descriptionEN: "Next time you feel something uncomfortable, don't suppress it or solve it: stay 60 seconds with the sensation. Observe it.",
    durationMin: 5,
  },
  {
    sei: "NE", level: "EQE2",
    title: "Cambiar el estado, no la emoción",
    titleEN: "Change the state, not the emotion",
    description: "Navegar no es controlar. Aprendé 3 técnicas de cambio de estado (respiración, movimiento, foco) que NO niegan la emoción.",
    descriptionEN: "Navigating is not controlling. Learn 3 state-change techniques (breath, movement, focus) that DON'T deny the emotion.",
    durationMin: 10,
  },
  {
    sei: "NE", level: "EQE3",
    title: "Navegar emociones grupales",
    titleEN: "Navigating group emotions",
    description: "Cuando un equipo está en una emoción densa (miedo, rabia), tu rol no es 'levantar el ánimo'. Es hacer espacio para que circule.",
    descriptionEN: "When a team is in a dense emotion (fear, anger), your role isn't to 'lift the mood'. It's to make space for it to circulate.",
    durationMin: 15,
  },

  // IM — Engage Intrinsic Motivation
  {
    sei: "IM", level: "EQE1",
    title: "Tu por qué propio",
    titleEN: "Your own why",
    description: "¿Qué te mueve hoy desde adentro, no desde la presión? Anotá UNA cosa. Reléela mañana antes de empezar el día.",
    descriptionEN: "What moves you today from within, not from pressure? Write down ONE thing. Reread it tomorrow before starting your day.",
    durationMin: 5,
  },
  {
    sei: "IM", level: "EQE2",
    title: "Cuando la motivación se apaga",
    titleEN: "When motivation fades",
    description: "Toda motivación intrínseca atraviesa valles. Practicá distinguir 'estoy quemado' de 'no era mi por qué'. Son problemas distintos.",
    descriptionEN: "All intrinsic motivation goes through valleys. Practice distinguishing 'I'm burned out' from 'this wasn't my why'. They're different problems.",
    durationMin: 10,
  },
  {
    sei: "IM", level: "EQE3",
    title: "Activar la motivación de otros sin manipular",
    titleEN: "Activating others' motivation without manipulating",
    description: "Energizar a un equipo no es vender. Es conectar el trabajo con un por qué que ya viven. Practicá hacer 3 preguntas, no 3 discursos.",
    descriptionEN: "Energizing a team isn't selling. It's connecting the work with a why they already live. Practice asking 3 questions, not 3 speeches.",
    durationMin: 15,
  },

  // OP — Exercise Optimism
  {
    sei: "OP", level: "EQE1",
    title: "El optimismo que se entrena",
    titleEN: "Trainable optimism",
    description: "Ante un problema hoy, listá 3 escenarios posibles (no solo el peor). El optimismo no es negar, es ampliar el repertorio.",
    descriptionEN: "Before a problem today, list 3 possible scenarios (not just the worst). Optimism isn't denial, it's expanding the repertoire.",
    durationMin: 5,
  },
  {
    sei: "OP", level: "EQE2",
    title: "Reformular sin negar",
    titleEN: "Reframe without denying",
    description: "Tomá una situación frustrante reciente. Escribí cómo se vería desde tres ángulos distintos. Elegí el más útil, no el más bonito.",
    descriptionEN: "Take a recent frustrating situation. Write how it would look from three different angles. Choose the most useful, not the prettiest.",
    durationMin: 10,
  },
  {
    sei: "OP", level: "EQE3",
    title: "Optimismo como contagio sostenible",
    titleEN: "Optimism as sustainable contagion",
    description: "Liderar con optimismo no es animar. Es nombrar la realidad Y sostener la posibilidad. Esta semana practicá ambos en cada conversación.",
    descriptionEN: "Leading with optimism isn't cheerleading. It's naming reality AND holding possibility. This week practice both in every conversation.",
    durationMin: 15,
  },

  // EMP — Increase Empathy
  {
    sei: "EMP", level: "EQE1",
    title: "Escuchar sin arreglar",
    titleEN: "Listening without fixing",
    description: "La próxima vez que alguien te cuente algo difícil, no resuelvas. Solo nombrá lo que escuchás: 'parece que sentís...'.",
    descriptionEN: "Next time someone tells you something difficult, don't solve it. Just name what you hear: 'it sounds like you feel...'.",
    durationMin: 5,
  },
  {
    sei: "EMP", level: "EQE2",
    title: "Empatía con quien piensa distinto",
    titleEN: "Empathy with those who think differently",
    description: "Empatizar con quien te da la razón es fácil. Esta semana practicá entender — no acordar — con alguien con quien no estás de acuerdo.",
    descriptionEN: "Empathizing with those who agree is easy. This week practice understanding — not agreeing — with someone you disagree with.",
    durationMin: 10,
  },
  {
    sei: "EMP", level: "EQE3",
    title: "Empatía estructural",
    titleEN: "Structural empathy",
    description: "Trasladá la empatía individual al sistema: ¿qué siente tu organización? ¿qué sostiene a quienes la habitan? Es decisión de líder.",
    descriptionEN: "Move empathy from individual to system: what does your organization feel? What sustains those who inhabit it? It's a leadership decision.",
    durationMin: 15,
  },

  // NG — Pursue Noble Goals
  {
    sei: "NG", level: "EQE1",
    title: "Algo más grande que vos",
    titleEN: "Something bigger than you",
    description: "¿Para qué hacés lo que hacés? Más allá de pagar las cuentas. Escribilo en una frase. Si te cuesta, eso ya es información.",
    descriptionEN: "What do you do what you do for? Beyond paying bills. Write it in one sentence. If it's hard, that's already information.",
    durationMin: 5,
  },
  {
    sei: "NG", level: "EQE2",
    title: "Anclar lo cotidiano a tu meta noble",
    titleEN: "Anchoring the everyday to your noble goal",
    description: "Tomá 3 tareas rutinarias esta semana y conectá cada una explícitamente con tu meta noble. ¿Cambia cómo las hacés?",
    descriptionEN: "Take 3 routine tasks this week and connect each explicitly to your noble goal. Does it change how you do them?",
    durationMin: 10,
  },
  {
    sei: "NG", level: "EQE3",
    title: "Coreografiar metas nobles en grupo",
    titleEN: "Choreographing noble goals in a group",
    description: "Una meta noble compartida no se decreta. Se descubre. Convocá a tu equipo para una conversación de 30 min: ¿para qué estamos juntos?",
    descriptionEN: "A shared noble goal isn't decreed. It's discovered. Convene your team for a 30-min conversation: what are we together for?",
    durationMin: 20,
  },
];

const LEVEL_DIFFICULTY: Record<Level, "BEGINNER" | "INTERMEDIATE" | "ADVANCED"> = {
  EQE1: "BEGINNER",
  EQE2: "INTERMEDIATE",
  EQE3: "ADVANCED",
};

const LEVEL_POINTS: Record<Level, number> = {
  EQE1: 10,
  EQE2: 15,
  EQE3: 20,
};

async function main() {
  console.log(`Seeding ${LESSONS.length} EQE micro-lessons...`);
  let created = 0;
  let updated = 0;

  for (let i = 0; i < LESSONS.length; i++) {
    const l = LESSONS[i];
    const slug = `eqe-${l.sei.toLowerCase()}-${l.level.toLowerCase()}`;
    const data = {
      slug,
      category: "COMPETENCY" as const,
      parentKey: l.sei,
      title: l.title,
      titleEN: l.titleEN,
      description: l.description,
      descriptionEN: l.descriptionEN,
      duration: l.durationMin,
      difficulty: LEVEL_DIFFICULTY[l.level],
      order: i,
      points: LEVEL_POINTS[l.level],
      isActive: true,
      isFeatured: l.level === "EQE1",
      content: { source: "EQE", track: l.level } as const,
    };

    const existing = await prisma.microLearning.findUnique({ where: { slug } });
    if (existing) {
      await prisma.microLearning.update({ where: { slug }, data });
      updated++;
    } else {
      await prisma.microLearning.create({ data });
      created++;
    }
  }

  console.log(`Done. Created: ${created}. Updated: ${updated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
