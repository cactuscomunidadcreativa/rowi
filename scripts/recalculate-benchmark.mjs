// recalculate-benchmark.mjs - Recalcula correlaciones y top performers con chunks
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EQ_COMPETENCIES = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const OUTCOMES = [
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
];
const BRAIN_TALENTS = [
  "dataMining", "modeling", "prioritizing", "connection",
  "emotionalInsight", "collaboration", "reflecting", "adaptability",
  "criticalThinking", "resilience", "riskTolerance",
  "imagination", "proactivity", "commitment", "problemSolving",
  "vision", "designing", "entrepreneurship",
];

// Helper: Aproximación de CDF normal estándar
function normalCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

async function recalculateCorrelations(benchmarkId) {
  console.log("🔗 Iniciando recálculo de correlaciones en chunks...");

  // Borrar correlaciones anteriores
  await prisma.benchmarkCorrelation.deleteMany({ where: { benchmarkId } });

  const CHUNK_SIZE = 10000;
  let offset = 0;
  let hasMore = true;

  // Acumuladores para Pearson
  const pairAccumulators = {};

  // Inicializar acumuladores
  for (const comp of EQ_COMPETENCIES) {
    for (const out of OUTCOMES) {
      pairAccumulators[`${comp}_${out}`] = {
        n: 0, sumX: 0, sumY: 0, sumXY: 0, sumX2: 0, sumY2: 0,
      };
    }
  }

  // Procesar en chunks
  while (hasMore) {
    const chunk = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: {
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
        effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
        influence: true, decisionMaking: true, community: true, network: true,
        achievement: true, satisfaction: true, balance: true, health: true,
      },
      skip: offset,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
      break;
    }

    for (const dp of chunk) {
      for (const comp of EQ_COMPETENCIES) {
        const compVal = dp[comp];
        if (compVal === null || compVal === undefined) continue;

        for (const out of OUTCOMES) {
          const outVal = dp[out];
          if (outVal === null || outVal === undefined) continue;

          const key = `${comp}_${out}`;
          const acc = pairAccumulators[key];
          acc.n++;
          acc.sumX += compVal;
          acc.sumY += outVal;
          acc.sumXY += compVal * outVal;
          acc.sumX2 += compVal * compVal;
          acc.sumY2 += outVal * outVal;
        }
      }
    }

    offset += chunk.length;

    if (offset % 50000 === 0) {
      console.log(`🔗 Correlaciones: procesados ${offset} registros...`);
    }

    if (chunk.length < CHUNK_SIZE) {
      hasMore = false;
    }
  }

  console.log(`🔗 Correlaciones: procesados ${offset} registros totales`);

  // Calcular correlaciones finales
  const correlationsToCreate = [];

  for (const comp of EQ_COMPETENCIES) {
    for (const out of OUTCOMES) {
      const key = `${comp}_${out}`;
      const acc = pairAccumulators[key];

      if (acc.n >= 30) {
        const numerator = acc.n * acc.sumXY - acc.sumX * acc.sumY;
        const denomX = acc.n * acc.sumX2 - acc.sumX * acc.sumX;
        const denomY = acc.n * acc.sumY2 - acc.sumY * acc.sumY;
        const denominator = Math.sqrt(denomX * denomY);

        if (denominator > 0) {
          const correlation = numerator / denominator;
          const tStat = correlation * Math.sqrt((acc.n - 2) / (1 - correlation * correlation));
          const pValue = acc.n > 100 ? 2 * (1 - normalCDF(Math.abs(tStat))) : 0.001;

          const absR = Math.abs(correlation);
          let strength;
          if (absR < 0.1) strength = "none";
          else if (absR < 0.3) strength = "weak";
          else if (absR < 0.5) strength = "moderate";
          else if (absR < 0.7) strength = "strong";
          else strength = "very_strong";

          const direction = correlation > 0 ? "positive" : "negative";

          correlationsToCreate.push({
            benchmarkId,
            competencyKey: comp,
            outcomeKey: out,
            correlation,
            pValue,
            n: acc.n,
            strength,
            direction,
          });
        }
      }
    }
  }

  if (correlationsToCreate.length > 0) {
    await prisma.benchmarkCorrelation.createMany({ data: correlationsToCreate });
  }

  console.log(`✅ Correlaciones recalculadas: ${correlationsToCreate.length} (usando ${offset} registros)`);
}

async function recalculateTopPerformers(benchmarkId) {
  console.log("\n🏆 Iniciando recálculo de top performers en chunks...");

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

  // PASO 2: Para cada outcome, procesar top performers en chunks
  for (const outcome of OUTCOMES) {
    if (outcomeThresholds[outcome] === undefined) continue;

    const threshold = outcomeThresholds[outcome];

    // Acumuladores
    const compAccumulators = {};
    const talentAccumulators = {};

    for (const comp of [...EQ_COMPETENCIES, "K", "C", "G"]) {
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

        for (const comp of ["K", "C", "G", ...EQ_COMPETENCIES]) {
          const val = dp[comp];
          if (val !== null && val !== undefined) {
            compAccumulators[comp].sum += val;
            compAccumulators[comp].count++;
          }
        }

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

    const topCompetencies = EQ_COMPETENCIES.map((comp) => {
      const avg = getAvg(compAccumulators[comp]);
      return {
        key: comp,
        avgScore: avg || 0,
        importance: avg ? Math.min(100, avg) : 0,
        diffFromAvg: 0,
      };
    })
      .filter((c) => c.avgScore > 0)
      .sort((a, b) => b.avgScore - a.avgScore);

    const topTalents = BRAIN_TALENTS.map((talent) => {
      const avg = getAvg(talentAccumulators[talent]);
      return {
        key: talent,
        avgScore: avg || 0,
        importance: avg ? Math.min(100, avg) : 0,
      };
    })
      .filter((t) => t.avgScore > 0)
      .sort((a, b) => b.importance - a.importance);

    const commonPatterns = Object.entries(pairCounts)
      .map(([pair, data]) => ({
        competencies: pair.split("+"),
        frequency: Math.round((data.count / topPerformerCount) * 100),
        avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
      }))
      .filter((p) => p.frequency >= 20)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

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
      commonPatterns,
      talentPatterns,
    });
  }

  if (topPerformersToCreate.length > 0) {
    await prisma.benchmarkTopPerformer.createMany({ data: topPerformersToCreate });
  }

  console.log(`✅ Top performers recalculados: ${topPerformersToCreate.length} outcomes`);
}

async function main() {
  console.log("🔄 Recalculando benchmark con todos los datos en chunks...\n");

  const benchmark = await prisma.benchmark.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  if (!benchmark) {
    console.log("❌ No se encontró ningún benchmark completado");
    return;
  }

  console.log(`📊 Benchmark: ${benchmark.name}`);
  console.log(`   ID: ${benchmark.id}`);
  console.log(`   Total rows: ${benchmark.totalRows}\n`);

  await recalculateCorrelations(benchmark.id);
  await recalculateTopPerformers(benchmark.id);

  console.log("\n✅ Recálculo completado!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
