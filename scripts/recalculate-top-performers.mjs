// recalculate-top-performers.mjs - Recalcula top performers con los 18 Brain Talents
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Macro-dominios + competencias (para promedios)
const EQ_ALL = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
// Solo las 8 competencias clave de Six Seconds (para patrones)
const EQ_COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const OUTCOMES = [
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
];
// Brain Talents ordenados por cluster
// FOCUS (Azul): Data Mining, Modeling, Prioritizing, Connection, Emotional Insight, Collaboration
// DECISIONS (Rojo): Reflecting, Adaptability, Critical Thinking, Resilience, Risk Tolerance, Imagination
// DRIVE (Verde): Proactivity, Commitment, Problem Solving, Vision, Designing, Entrepreneurship
const BRAIN_TALENTS_FOCUS = ["dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration"];
const BRAIN_TALENTS_DECISIONS = ["reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination"];
const BRAIN_TALENTS_DRIVE = ["proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship"];
const BRAIN_TALENTS = [...BRAIN_TALENTS_FOCUS, ...BRAIN_TALENTS_DECISIONS, ...BRAIN_TALENTS_DRIVE];

async function recalculateTopPerformers(benchmarkId) {
  console.log("🏆 Iniciando recálculo de top performers en chunks...\n");

  // Borrar top performers anteriores
  await prisma.benchmarkTopPerformer.deleteMany({ where: { benchmarkId } });

  const CHUNK_SIZE = 10000;
  const PERCENTILE_THRESHOLD = 90;
  const topPerformersToCreate = [];

  // PASO 1: Calcular umbrales de percentil 90 para cada outcome
  const outcomeThresholds = {};

  for (const outcome of OUTCOMES) {
    const count = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId, [outcome]: { not: null } },
    });

    if (count < 30) continue;

    const p90Index = Math.floor(count * 0.9);
    const threshold = await prisma.benchmarkDataPoint.findFirst({
      where: { benchmarkId, [outcome]: { not: null } },
      orderBy: { [outcome]: "asc" },
      skip: p90Index,
      select: { [outcome]: true },
    });

    if (threshold && threshold[outcome] !== null) {
      outcomeThresholds[outcome] = threshold[outcome];
      console.log(`🏆 Umbral P90 para ${outcome}: ${outcomeThresholds[outcome].toFixed(2)} (n=${count})`);
    }
  }

  console.log("");

  // PASO 2: Calcular promedios GLOBALES de competencias y talentos (todos los datos)
  console.log("📊 Calculando promedios globales...");
  const globalAvgs = {};

  // Promedios de competencias
  for (const comp of EQ_ALL) {
    const result = await prisma.benchmarkDataPoint.aggregate({
      where: { benchmarkId, [comp]: { not: null } },
      _avg: { [comp]: true },
    });
    globalAvgs[comp] = result._avg[comp] || 0;
  }

  // Promedios de talentos
  for (const talent of BRAIN_TALENTS) {
    const result = await prisma.benchmarkDataPoint.aggregate({
      where: { benchmarkId, [talent]: { not: null } },
      _avg: { [talent]: true },
    });
    globalAvgs[talent] = result._avg[talent] || 0;
  }

  console.log("✅ Promedios globales calculados\n");

  // PASO 3: Para cada outcome, procesar top performers en chunks
  for (const outcome of OUTCOMES) {
    if (outcomeThresholds[outcome] === undefined) continue;

    const threshold = outcomeThresholds[outcome];

    // Acumuladores
    const compAccumulators = {};
    const talentAccumulators = {};

    for (const comp of EQ_ALL) {
      compAccumulators[comp] = { sum: 0, count: 0 };
    }
    for (const talent of BRAIN_TALENTS) {
      talentAccumulators[talent] = { sum: 0, count: 0 };
    }

    const pairCounts = {};
    const talentPairCounts = {};  // Para patrones de talentos
    let topPerformerCount = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await prisma.benchmarkDataPoint.findMany({
        where: { benchmarkId, [outcome]: { gte: threshold } },
        select: {
          K: true, C: true, G: true,
          EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
          effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
          influence: true, decisionMaking: true, community: true, network: true,
          achievement: true, satisfaction: true, balance: true, health: true,
          // Brain Talents (18)
          dataMining: true, modeling: true, prioritizing: true, connection: true,
          emotionalInsight: true, collaboration: true, reflecting: true, adaptability: true,
          criticalThinking: true, resilience: true, riskTolerance: true,
          imagination: true, proactivity: true, commitment: true, problemSolving: true,
          vision: true, designing: true, entrepreneurship: true,
        },
        skip: offset,
        take: CHUNK_SIZE,
      });

      if (chunk.length === 0) {
        hasMore = false;
        break;
      }

      for (const dp of chunk) {
        topPerformerCount++;

        // Acumular todos (K, C, G + 8 competencias)
        for (const comp of EQ_ALL) {
          const val = dp[comp];
          if (val !== null && val !== undefined) {
            compAccumulators[comp].sum += val;
            compAccumulators[comp].count++;
          }
        }

        // Acumular los 18 talentos
        for (const talent of BRAIN_TALENTS) {
          const val = dp[talent];
          if (val !== null && val !== undefined) {
            talentAccumulators[talent].sum += val;
            talentAccumulators[talent].count++;
          }
        }

        // Detectar top 3 competencias
        const compScores = [];
        for (const comp of EQ_COMPETENCIES) {
          const score = dp[comp];
          if (score !== null && score !== undefined) {
            compScores.push({ key: comp, score });
          }
        }
        compScores.sort((a, b) => b.score - a.score);
        const top3Comps = compScores.slice(0, 3).map((c) => c.key);
        const outcomeValue = dp[outcome] || 0;

        for (let j = 0; j < top3Comps.length; j++) {
          for (let k = j + 1; k < top3Comps.length; k++) {
            const pair = [top3Comps[j], top3Comps[k]].sort().join("+");
            if (!pairCounts[pair]) {
              pairCounts[pair] = { count: 0, outcomeSum: 0 };
            }
            pairCounts[pair].count++;
            pairCounts[pair].outcomeSum += outcomeValue;
          }
        }

        // Detectar top 3 talentos
        const talentScores = [];
        for (const talent of BRAIN_TALENTS) {
          const score = dp[talent];
          if (score !== null && score !== undefined) {
            talentScores.push({ key: talent, score });
          }
        }
        talentScores.sort((a, b) => b.score - a.score);
        const top3Talents = talentScores.slice(0, 3).map((t) => t.key);

        for (let j = 0; j < top3Talents.length; j++) {
          for (let k = j + 1; k < top3Talents.length; k++) {
            const pair = [top3Talents[j], top3Talents[k]].sort().join("+");
            if (!talentPairCounts[pair]) {
              talentPairCounts[pair] = { count: 0, outcomeSum: 0 };
            }
            talentPairCounts[pair].count++;
            talentPairCounts[pair].outcomeSum += outcomeValue;
          }
        }
      }

      offset += chunk.length;
      if (chunk.length < CHUNK_SIZE) hasMore = false;
    }

    console.log(`🏆 ${outcome}: ${topPerformerCount} top performers`);

    if (topPerformerCount < 30) continue;

    const getAvg = (acc) => acc.count > 0 ? acc.sum / acc.count : null;

    // Las 8 competencias - ordenadas por diferencia vs promedio global
    const topCompetencies = EQ_COMPETENCIES.map((comp) => {
      const avg = getAvg(compAccumulators[comp]);
      const globalAvg = globalAvgs[comp] || 0;
      const diffFromAvg = avg ? avg - globalAvg : 0;
      return {
        key: comp,
        avgScore: avg || 0,
        importance: Math.max(0, diffFromAvg * 10),
        diffFromAvg: diffFromAvg,
      };
    })
      .filter((c) => c.avgScore > 0)
      .sort((a, b) => b.diffFromAvg - a.diffFromAvg);  // Las 8 ordenadas por más distintivo

    // Los 18 talentos en ORDEN FIJO por cluster (FOCUS, DECISIONS, DRIVE)
    const allTalentsData = BRAIN_TALENTS.map((talent) => {
      const avg = getAvg(talentAccumulators[talent]);
      const globalAvg = globalAvgs[talent] || 0;
      const diffFromAvg = avg ? avg - globalAvg : 0;
      // Determinar cluster
      let cluster = "focus";
      if (BRAIN_TALENTS_DECISIONS.includes(talent)) cluster = "decisions";
      if (BRAIN_TALENTS_DRIVE.includes(talent)) cluster = "drive";
      return {
        key: talent,
        avgScore: avg || 0,
        importance: Math.max(0, diffFromAvg * 10),
        diffFromAvg: diffFromAvg,
        cluster: cluster,
      };
    }).filter((t) => t.avgScore > 0);

    // topTalents: Los 18 en orden de cluster (para mostrar en grilla)
    const topTalents = allTalentsData;

    // topTalentsSummary: Top 5 más distintivos (para el resumen)
    const topTalentsSummary = [...allTalentsData]
      .sort((a, b) => b.diffFromAvg - a.diffFromAvg)
      .slice(0, 5);

    const commonPatterns = Object.entries(pairCounts)
      .map(([pair, data]) => ({
        competencies: pair.split("+"),
        frequency: Math.round((data.count / topPerformerCount) * 100),
        avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
      }))
      .filter((p) => p.frequency >= 10)  // Umbral más bajo para capturar más patrones
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 6);

    // Patrones de talentos - top 6
    const talentPatterns = Object.entries(talentPairCounts)
      .map(([pair, data]) => ({
        talents: pair.split("+"),
        frequency: Math.round((data.count / topPerformerCount) * 100),
        avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
      }))
      .filter((p) => p.frequency >= 10)  // Umbral más bajo para talentos
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 6);

    topPerformersToCreate.push({
      benchmarkId,
      outcomeKey: outcome,
      percentileThreshold: PERCENTILE_THRESHOLD,
      sampleSize: topPerformerCount,
      avgK: getAvg(compAccumulators["K"]),
      avgC: getAvg(compAccumulators["C"]),
      avgG: getAvg(compAccumulators["G"]),
      avgEL: getAvg(compAccumulators["EL"]),
      avgRP: getAvg(compAccumulators["RP"]),
      avgACT: getAvg(compAccumulators["ACT"]),
      avgNE: getAvg(compAccumulators["NE"]),
      avgIM: getAvg(compAccumulators["IM"]),
      avgOP: getAvg(compAccumulators["OP"]),
      avgEMP: getAvg(compAccumulators["EMP"]),
      avgNG: getAvg(compAccumulators["NG"]),
      topCompetencies,
      topTalents,
      topTalentsSummary,
      commonPatterns,
      talentPatterns,
    });
  }

  if (topPerformersToCreate.length > 0) {
    await prisma.benchmarkTopPerformer.createMany({ data: topPerformersToCreate });
  }

  console.log(`\n✅ Top performers recalculados: ${topPerformersToCreate.length} outcomes`);

  // Verificar
  const sample = await prisma.benchmarkTopPerformer.findFirst({
    where: { outcomeKey: 'effectiveness' }
  });
  console.log(`\n📊 Verificación - effectiveness topTalents (${sample.topTalents.length} talentos):`);
  sample.topTalents.slice(0, 5).forEach((t, i) => {
    console.log(`   ${i+1}. ${t.key}: ${t.avgScore.toFixed(2)}`);
  });
}

async function main() {
  console.log("🔄 Recalculando top performers con los 18 Brain Talents...\n");

  const benchmark = await prisma.benchmark.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  if (!benchmark) {
    console.log("❌ No se encontró benchmark");
    return;
  }

  console.log(`📊 Benchmark: ${benchmark.name}`);
  console.log(`   ID: ${benchmark.id}\n`);

  await recalculateTopPerformers(benchmark.id);

  console.log("\n✅ Recálculo completado!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
