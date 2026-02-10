// prisma/precompute-rowiverse-stats.ts
// Pre-computes BenchmarkStatistic records for the Rowiverse benchmark
// so the /stats endpoint can return instantly without on-the-fly calculation

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const ROWIVERSE_BENCHMARK_ID = "cml290jyy0004ky04bz5qu35v";

const ALL_METRICS = [
  "K", "C", "G", "eqTotal",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
  "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration",
  "reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship",
];

async function main() {
  console.log("=".repeat(60));
  console.log("  PRE-COMPUTE ROWIVERSE STATS");
  console.log("=".repeat(60) + "\n");

  const benchmark = await prisma.benchmark.findUnique({ where: { id: ROWIVERSE_BENCHMARK_ID } });
  if (!benchmark) {
    console.error(`❌ Benchmark ${ROWIVERSE_BENCHMARK_ID} not found`);
    return;
  }
  console.log(`✅ Benchmark: ${benchmark.name} (${benchmark.totalRows} rows)\n`);

  // Delete old stats for this benchmark (global only - no filters)
  await prisma.benchmarkStatistic.deleteMany({
    where: { benchmarkId: ROWIVERSE_BENCHMARK_ID, country: null, region: null, sector: null },
  });

  const statsToCreate: any[] = [];

  for (const metric of ALL_METRICS) {
    console.log(`  Computing ${metric}...`);

    // Use SQL for fast percentile calculation on 363K records
    try {
      const result: any[] = await prisma.$queryRaw`
        SELECT
          COUNT(${Prisma.raw(`"${metric}"`)})::int as n,
          AVG(${Prisma.raw(`"${metric}"`)})::float as mean,
          STDDEV_SAMP(${Prisma.raw(`"${metric}"`)})::float as std_dev,
          MIN(${Prisma.raw(`"${metric}"`)})::float as min_val,
          MAX(${Prisma.raw(`"${metric}"`)})::float as max_val,
          PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${metric}"`)})::float as p10,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${metric}"`)})::float as p25,
          PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${metric}"`)})::float as p50,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${metric}"`)})::float as p75,
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${metric}"`)})::float as p90,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${metric}"`)})::float as p95
        FROM "benchmark_data_point"
        WHERE "benchmarkId" = ${ROWIVERSE_BENCHMARK_ID}
          AND ${Prisma.raw(`"${metric}"`)} IS NOT NULL
      `;

      if (result.length > 0 && result[0].n > 0) {
        const r = result[0];
        statsToCreate.push({
          benchmarkId: ROWIVERSE_BENCHMARK_ID,
          metricKey: metric,
          n: r.n,
          mean: r.mean ? Math.round(r.mean * 100) / 100 : null,
          median: r.p50 ? Math.round(r.p50 * 100) / 100 : null,
          stdDev: r.std_dev ? Math.round(r.std_dev * 100) / 100 : null,
          min: r.min_val ? Math.round(r.min_val * 100) / 100 : null,
          max: r.max_val ? Math.round(r.max_val * 100) / 100 : null,
          p10: r.p10 ? Math.round(r.p10 * 100) / 100 : null,
          p25: r.p25 ? Math.round(r.p25 * 100) / 100 : null,
          p50: r.p50 ? Math.round(r.p50 * 100) / 100 : null,
          p75: r.p75 ? Math.round(r.p75 * 100) / 100 : null,
          p90: r.p90 ? Math.round(r.p90 * 100) / 100 : null,
          p95: r.p95 ? Math.round(r.p95 * 100) / 100 : null,
        });
        console.log(`    ✅ ${metric}: n=${r.n}, mean=${r.mean?.toFixed(2)}, p90=${r.p90?.toFixed(2)}`);
      } else {
        console.log(`    ⚠️ ${metric}: no data`);
      }
    } catch (e: any) {
      console.log(`    ❌ ${metric}: ${e.message}`);
    }
  }

  // Save all stats
  if (statsToCreate.length > 0) {
    await prisma.benchmarkStatistic.createMany({
      data: statsToCreate,
      skipDuplicates: true,
    });
  }

  console.log(`\n✅ Saved ${statsToCreate.length} statistics for Rowiverse benchmark`);
  console.log("=".repeat(60) + "\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
