/**
 * Seed semilla del ScenarioBank multi-idioma (AI Practice Partner · Track B).
 *
 * Cada escenario es UNA fila con sus traducciones (campo `translations`). Son
 * HIPÓTESIS v0, editables/borrables/traducibles por admin desde
 * /hub/admin/scenarios. El usuario practica en SU idioma.
 *
 * Idempotente: no duplica si ya existe un escenario con el mismo título base.
 *
 * Ejecutar: `tsx scripts/seed-scenarios.ts`
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_RUBRIC = {
  criteria: [
    { key: "empathy", label: "Empatía y escucha", weight: 1 },
    { key: "clarity", label: "Claridad y asertividad", weight: 1 },
    { key: "outcome", label: "Avance hacia el objetivo", weight: 1 },
  ],
};

interface LocText {
  title: string;
  summary: string;
  brief: string;
  rubricLabels?: Record<string, string>;
}

interface SeedScenario {
  baseLocale: string;
  focusSei: string | null;
  difficulty: number;
  translations: Record<string, LocText>;
}

const SCENARIOS: SeedScenario[] = [
  {
    baseLocale: "es",
    focusSei: "EMP",
    difficulty: 2,
    translations: {
      es: {
        title: "Cliente molesto por un retraso",
        summary: "Un cliente llama enojado porque su pedido llegó tarde.",
        brief:
          "Interpretas a un cliente molesto porque su pedido llegó tres días tarde. " +
          "Empiezas firme y frustrado, pero eres razonable: si la persona reconoce tu " +
          "molestia, escucha y propone una solución concreta, te calmas progresivamente. " +
          "Si te ignora o se pone a la defensiva, subes el tono.",
      },
      en: {
        title: "Upset customer over a delay",
        summary: "A customer calls upset because their order arrived late.",
        brief:
          "You play an upset customer because your order arrived three days late. You start " +
          "firm and frustrated but are reasonable: if the person acknowledges your frustration, " +
          "listens, and offers a concrete solution, you gradually calm down. If they dismiss " +
          "you or get defensive, you escalate.",
      },
      zh: {
        title: "因延误而不满的客户",
        summary: "一位客户因订单迟到而来电不满。",
        brief:
          "你扮演一位因订单迟到三天而不满的客户。一开始你态度坚定且沮丧，但讲道理：" +
          "如果对方承认你的不满、认真倾听并提出具体的解决方案，你会逐渐平静下来；" +
          "如果对方忽视你或采取防御姿态，你会升级情绪。",
      },
    },
  },
  {
    baseLocale: "es",
    focusSei: "NE",
    difficulty: 3,
    translations: {
      es: {
        title: "Feedback difícil a un compañero",
        summary: "Necesitas dar feedback honesto a alguien de tu equipo.",
        brief:
          "Interpretas a un compañero de equipo que ha estado entregando tarde y bajando " +
          "la calidad. Reaccionas a la defensiva al principio. Si la persona te da feedback " +
          "específico, sin atacarte, y muestra que le importas, te abres a escuchar.",
      },
    },
  },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const s of SCENARIOS) {
    const base = s.translations[s.baseLocale];
    const existing = await prisma.scenarioBank.findFirst({
      where: { title: base.title },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.scenarioBank.create({
      data: {
        baseLocale: s.baseLocale,
        locale: s.baseLocale,
        title: base.title,
        summary: base.summary,
        brief: base.brief,
        translations: s.translations,
        focusSei: s.focusSei,
        difficulty: s.difficulty,
        rubric: DEFAULT_RUBRIC,
        isActive: true,
      },
    });
    created++;
  }
  console.log(`[seed-scenarios] created=${created} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error("[seed-scenarios] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
