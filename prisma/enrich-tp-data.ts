// prisma/enrich-tp-data.ts
// ============================================================
// ROWI - Enrich TP benchmark: Correlations + Top Performers
// ============================================================
// Calculates and saves correlations and top performers
// Same logic as the API routes but runs standalone
// ============================================================

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const BENCHMARK_ID = "tp-all-assessments-2025";

const EQ_COMPETENCIES = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const BRAIN_TALENTS = [
  "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration",
  "reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship",
];
const OUTCOMES = [
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
];

// =========================================================
// Statistical functions
// =========================================================

function pearsonCorrelation(x: number[], y: number[]): {
  correlation: number; pValue: number; n: number; strength: string; direction: string;
} {
  const n = Math.min(x.length, y.length);
  if (n < 3) return { correlation: 0, pValue: 1, n, strength: "none", direction: "none" };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]; sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return { correlation: 0, pValue: 1, n, strength: "none", direction: "none" };

  const r = numerator / denominator;

  // Approximate t-test for p-value
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const df = n - 2;
  // Approximate p-value using normal distribution for large samples
  const pValue = df > 30 ? Math.exp(-0.5 * t * t) : Math.min(1, 2 / (1 + Math.pow(Math.abs(t) / Math.sqrt(df), df)));

  const absR = Math.abs(r);
  let strength: string;
  if (absR >= 0.7) strength = "strong";
  else if (absR >= 0.4) strength = "moderate";
  else if (absR >= 0.2) strength = "weak";
  else strength = "negligible";

  const direction = r > 0 ? "positive" : r < 0 ? "negative" : "none";

  return {
    correlation: Math.round(r * 10000) / 10000,
    pValue: Math.round(pValue * 10000) / 10000,
    n,
    strength,
    direction,
  };
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calculateCohenD(topMean: number, topStd: number, topN: number, globalMean: number, globalStd: number, globalN: number): number {
  const pooledStd = Math.sqrt(((topN - 1) * Math.pow(topStd, 2) + (globalN - 1) * Math.pow(globalStd, 2)) / (topN + globalN - 2));
  if (pooledStd === 0) return 0;
  return (topMean - globalMean) / pooledStd;
}

function interpretEffectSize(d: number): string {
  const absD = Math.abs(d);
  if (absD < 0.2) return "negligible";
  if (absD < 0.5) return "small";
  if (absD < 0.8) return "medium";
  return "large";
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  ROWI - ENRICH TP BENCHMARK DATA");
  console.log("=".repeat(60) + "\n");

  const benchmark = await prisma.benchmark.findUnique({ where: { id: BENCHMARK_ID } });
  if (!benchmark) {
    console.error(`❌ Benchmark '${BENCHMARK_ID}' not found.`);
    return;
  }
  console.log(`✅ Benchmark: ${benchmark.name} (${benchmark.totalRows} rows)\n`);

  // =========================================================
  // PHASE 1: CORRELATIONS
  // =========================================================
  console.log("═══════════════════════════════════");
  console.log("📊 PHASE 1: CORRELATIONS");
  console.log("═══════════════════════════════════\n");

  // Delete old correlations
  await prisma.benchmarkCorrelation.deleteMany({ where: { benchmarkId: BENCHMARK_ID } });

  // Load all data points with competencies and outcomes
  console.log("Loading data points...");
  const allData = await prisma.benchmarkDataPoint.findMany({
    where: { benchmarkId: BENCHMARK_ID },
    select: {
      year: true,
      K: true, C: true, G: true,
      EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
      effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
      influence: true, decisionMaking: true, community: true, network: true,
      achievement: true, satisfaction: true, balance: true, health: true,
    },
  });
  console.log(`Loaded ${allData.length} data points\n`);

  const correlationsToCreate: any[] = [];

  // Global correlations
  console.log("Calculating GLOBAL correlations...");
  for (const competency of EQ_COMPETENCIES) {
    for (const outcome of OUTCOMES) {
      const pairs: { comp: number; out: number }[] = [];
      for (const dp of allData) {
        const compVal = (dp as any)[competency];
        const outVal = (dp as any)[outcome];
        if (typeof compVal === "number" && typeof outVal === "number") {
          pairs.push({ comp: compVal, out: outVal });
        }
      }

      if (pairs.length >= 30) {
        const result = pearsonCorrelation(pairs.map(p => p.comp), pairs.map(p => p.out));
        correlationsToCreate.push({
          benchmarkId: BENCHMARK_ID,
          competencyKey: competency,
          outcomeKey: outcome,
          correlation: result.correlation,
          pValue: result.pValue,
          n: result.n,
          strength: result.strength,
          direction: result.direction,
          calculatedAt: new Date(),
        });
      }
    }
  }
  console.log(`  Global: ${correlationsToCreate.length} correlations\n`);

  // Per-year correlations
  const yearGroups = new Map<number, typeof allData>();
  for (const dp of allData) {
    if (dp.year) {
      if (!yearGroups.has(dp.year)) yearGroups.set(dp.year, []);
      yearGroups.get(dp.year)!.push(dp);
    }
  }

  const yearCorrelationCount = { before: correlationsToCreate.length };
  for (const [year, yearData] of yearGroups) {
    if (yearData.length < 30) continue;
    console.log(`  Year ${year}: ${yearData.length} data points`);

    for (const competency of EQ_COMPETENCIES) {
      for (const outcome of OUTCOMES) {
        const pairs: { comp: number; out: number }[] = [];
        for (const dp of yearData) {
          const compVal = (dp as any)[competency];
          const outVal = (dp as any)[outcome];
          if (typeof compVal === "number" && typeof outVal === "number") {
            pairs.push({ comp: compVal, out: outVal });
          }
        }

        if (pairs.length >= 30) {
          const result = pearsonCorrelation(pairs.map(p => p.comp), pairs.map(p => p.out));
          correlationsToCreate.push({
            benchmarkId: BENCHMARK_ID,
            competencyKey: competency,
            outcomeKey: outcome,
            correlation: result.correlation,
            pValue: result.pValue,
            n: result.n,
            strength: result.strength,
            direction: result.direction,
            year: year,
            calculatedAt: new Date(),
          });
        }
      }
    }
  }
  console.log(`  Per-year: ${correlationsToCreate.length - yearCorrelationCount.before} correlations\n`);

  // Save correlations
  if (correlationsToCreate.length > 0) {
    // Insert in batches
    for (let i = 0; i < correlationsToCreate.length; i += 100) {
      const batch = correlationsToCreate.slice(i, i + 100);
      await prisma.benchmarkCorrelation.createMany({ data: batch, skipDuplicates: true });
    }
  }
  console.log(`✅ Saved ${correlationsToCreate.length} total correlations\n`);

  // Top correlations
  const topCorrs = [...correlationsToCreate]
    .filter(c => !c.year)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 5);
  console.log("Top 5 strongest global correlations:");
  topCorrs.forEach(c => {
    console.log(`  ${c.competencyKey} → ${c.outcomeKey}: r=${c.correlation} (${c.strength}, n=${c.n})`);
  });

  // =========================================================
  // PHASE 2: TOP PERFORMERS
  // =========================================================
  console.log("\n═══════════════════════════════════");
  console.log("🏆 PHASE 2: TOP PERFORMERS");
  console.log("═══════════════════════════════════\n");

  // Delete old top performers
  await prisma.benchmarkTopPerformer.deleteMany({ where: { benchmarkId: BENCHMARK_ID } });

  // Calculate global stats
  console.log("Calculating global statistics...");
  const allMetrics = [...EQ_COMPETENCIES, ...BRAIN_TALENTS];
  const globalStats: Record<string, { mean: number; stdDev: number; n: number }> = {};

  for (const metric of allMetrics) {
    const result = await prisma.benchmarkDataPoint.aggregate({
      where: { benchmarkId: BENCHMARK_ID, [metric]: { not: null } },
      _avg: { [metric]: true },
      _count: { [metric]: true },
    });

    const mean = (result._avg as any)[metric] || 0;
    const count = (result._count as any)[metric] || 0;

    if (count > 1) {
      // Calculate stdDev using SQL
      const varianceResult: any[] = await prisma.$queryRaw`
        SELECT COALESCE(STDDEV_SAMP(${Prisma.raw(`"${metric}"`)})::float, 0) as std_dev
        FROM "benchmark_data_point"
        WHERE "benchmarkId" = ${BENCHMARK_ID} AND ${Prisma.raw(`"${metric}"`)} IS NOT NULL
      `;
      const stdDev = parseFloat(varianceResult[0]?.std_dev) || 0;
      globalStats[metric] = { mean, stdDev, n: count };
    } else {
      globalStats[metric] = { mean, stdDev: 0, n: count };
    }
  }
  console.log(`  Calculated stats for ${Object.keys(globalStats).length} metrics\n`);

  // Calculate top performers for each outcome
  const topPerformersToCreate: any[] = [];

  for (const outcome of OUTCOMES) {
    const totalCount = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId: BENCHMARK_ID, [outcome]: { not: null } },
    });

    if (totalCount === 0) {
      console.log(`  ⚠️ ${outcome}: No data, skipping`);
      continue;
    }

    // Get P90 threshold
    const p90Result: any[] = await prisma.$queryRaw`
      SELECT PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${outcome}"`)})::float as p90
      FROM "benchmark_data_point"
      WHERE "benchmarkId" = ${BENCHMARK_ID} AND ${Prisma.raw(`"${outcome}"`)} IS NOT NULL
    `;
    const threshold = parseFloat(p90Result[0]?.p90) || 0;

    // Get top performers
    const topPerformerData = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId: BENCHMARK_ID, [outcome]: { gte: threshold } },
      select: {
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
        dataMining: true, modeling: true, prioritizing: true, connection: true,
        emotionalInsight: true, collaboration: true, reflecting: true, adaptability: true,
        criticalThinking: true, resilience: true, riskTolerance: true, imagination: true,
        proactivity: true, commitment: true, problemSolving: true, vision: true,
        designing: true, entrepreneurship: true,
        [outcome]: true,
      },
    });

    const sampleSize = topPerformerData.length;
    if (sampleSize === 0) continue;

    const confidenceLevel = sampleSize >= 385 ? "high" : sampleSize >= 100 ? "medium" : "low";

    // Calculate comp stats for top performers
    const compStats: Record<string, { mean: number; stdDev: number; n: number; effectSize: number; isSignificant: boolean }> = {};

    for (const comp of EQ_COMPETENCIES) {
      const values = topPerformerData.map((dp: any) => dp[comp]).filter((v: any): v is number => v !== null);
      if (values.length > 0) {
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const stdDev = calculateStdDev(values, mean);
        const global = globalStats[comp];
        const effectSize = calculateCohenD(mean, stdDev, values.length, global.mean, global.stdDev, global.n);
        const pooledStd = Math.sqrt(((values.length - 1) * stdDev * stdDev + (global.n - 1) * global.stdDev * global.stdDev) / (values.length + global.n - 2));
        const tStat = pooledStd > 0 ? (mean - global.mean) / (pooledStd * Math.sqrt(1/values.length + 1/global.n)) : 0;
        compStats[comp] = { mean, stdDev, n: values.length, effectSize, isSignificant: Math.abs(tStat) > 1.96 };
      } else {
        compStats[comp] = { mean: 0, stdDev: 0, n: 0, effectSize: 0, isSignificant: false };
      }
    }

    // Top competencies sorted by effect size
    const topCompetencies = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"].map(comp => {
      const stats = compStats[comp];
      const globalAvg = globalStats[comp]?.mean || 0;
      return {
        key: comp,
        avgScore: Math.round(stats.mean * 100) / 100,
        diffFromAvg: Math.round((stats.mean - globalAvg) * 100) / 100,
        effectSize: Math.round(stats.effectSize * 1000) / 1000,
        effectInterpretation: interpretEffectSize(stats.effectSize),
        isSignificant: stats.isSignificant,
        importance: Math.max(0, Math.round((stats.mean - globalAvg) * 10 * 100) / 100),
      };
    }).filter(c => c.avgScore > 0).sort((a, b) => b.effectSize - a.effectSize);

    // Talent stats
    const talentStats: Record<string, { mean: number; effectSize: number }> = {};
    for (const talent of BRAIN_TALENTS) {
      const values = topPerformerData.map((dp: any) => dp[talent]).filter((v: any): v is number => v !== null);
      if (values.length > 0) {
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const stdDev = calculateStdDev(values, mean);
        const global = globalStats[talent];
        const effectSize = calculateCohenD(mean, stdDev, values.length, global.mean, global.stdDev, global.n);
        talentStats[talent] = { mean, effectSize };
      }
    }

    const topTalents = BRAIN_TALENTS.map(talent => {
      const stats = talentStats[talent];
      if (!stats) return null;
      const globalAvg = globalStats[talent]?.mean || 0;
      return {
        key: talent,
        avgScore: Math.round(stats.mean * 100) / 100,
        diffFromAvg: Math.round((stats.mean - globalAvg) * 100) / 100,
        effectSize: Math.round(stats.effectSize * 1000) / 1000,
        effectInterpretation: interpretEffectSize(stats.effectSize),
      };
    }).filter(Boolean);

    const topTalentsSummary = [...topTalents].sort((a: any, b: any) => b.effectSize - a.effectSize).slice(0, 5);

    topPerformersToCreate.push({
      benchmarkId: BENCHMARK_ID,
      outcomeKey: outcome,
      percentileThreshold: 90,
      thresholdValue: Math.round(threshold * 100) / 100,
      sampleSize,
      totalPopulation: totalCount,
      confidenceLevel,
      lowConfidenceSample: sampleSize < 30,
      avgK: compStats["K"]?.mean || null,
      avgC: compStats["C"]?.mean || null,
      avgG: compStats["G"]?.mean || null,
      avgEL: compStats["EL"]?.mean || null,
      avgRP: compStats["RP"]?.mean || null,
      avgACT: compStats["ACT"]?.mean || null,
      avgNE: compStats["NE"]?.mean || null,
      avgIM: compStats["IM"]?.mean || null,
      avgOP: compStats["OP"]?.mean || null,
      avgEMP: compStats["EMP"]?.mean || null,
      avgNG: compStats["NG"]?.mean || null,
      topCompetencies,
      topTalents,
      topTalentsSummary,
      statistics: {
        globalMeans: Object.fromEntries(Object.entries(globalStats).map(([k, v]) => [k, Math.round(v.mean * 100) / 100])),
        significantCompetencies: topCompetencies.filter(c => c.isSignificant).length,
        avgEffectSize: topCompetencies.length > 0 ? topCompetencies.reduce((a, b) => a + b.effectSize, 0) / topCompetencies.length : 0,
      },
    });

    console.log(`  🏆 ${outcome}: ${sampleSize} top performers (P90=${threshold.toFixed(2)}, confidence=${confidenceLevel})`);
  }

  // Save top performers
  if (topPerformersToCreate.length > 0) {
    await prisma.benchmarkTopPerformer.createMany({
      data: topPerformersToCreate,
      skipDuplicates: true,
    });
  }

  console.log(`\n✅ Saved ${topPerformersToCreate.length} top performer profiles`);

  // =========================================================
  // SUMMARY
  // =========================================================
  console.log("\n" + "=".repeat(60));
  console.log("  ✅ ENRICHMENT COMPLETED");
  console.log("=".repeat(60));
  console.log(`  📊 Correlations: ${correlationsToCreate.length}`);
  console.log(`  🏆 Top Performers: ${topPerformersToCreate.length}`);
  console.log("=".repeat(60) + "\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
