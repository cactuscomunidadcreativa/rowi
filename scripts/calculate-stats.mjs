// calculate-stats.mjs - Calcula estadísticas para todas las métricas
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_METRICS = [
  // EQ Competencies
  "K", "C", "G", "eqTotal",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  // Outcomes
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
  // Brain Talents (18)
  "dataMining", "modeling", "prioritizing", "connection",
  "emotionalInsight", "collaboration", "reflecting", "adaptability",
  "criticalThinking", "resilience", "riskTolerance",
  "imagination", "proactivity", "commitment", "problemSolving",
  "vision", "designing", "entrepreneurship", "brainAgility",
];

function calculateStats(values) {
  if (values.length === 0) return null;

  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p) => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    n,
    mean,
    median: percentile(50),
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
    p10: percentile(10),
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
    p95: percentile(95),
  };
}

async function main() {
  console.log("📊 Calculando estadísticas para todas las métricas...\n");

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

  // Borrar estadísticas anteriores
  await prisma.benchmarkStatistic.deleteMany({ where: { benchmarkId: benchmark.id } });

  const statsToCreate = [];
  const SAMPLE_SIZE = 50000; // Para percentiles usamos un sample

  for (const metric of ALL_METRICS) {
    // Obtener agregaciones básicas de Prisma
    const aggregations = await prisma.benchmarkDataPoint.aggregate({
      where: {
        benchmarkId: benchmark.id,
        [metric]: { not: null },
      },
      _count: { [metric]: true },
      _avg: { [metric]: true },
      _min: { [metric]: true },
      _max: { [metric]: true },
    });

    const count = aggregations._count[metric] || 0;

    if (count < 30) {
      console.log(`⚠️ ${metric}: solo ${count} registros, saltando`);
      continue;
    }

    // Obtener sample para percentiles
    const sampleSize = Math.min(count, SAMPLE_SIZE);
    const rawValues = await prisma.benchmarkDataPoint.findMany({
      where: {
        benchmarkId: benchmark.id,
        [metric]: { not: null },
      },
      select: { [metric]: true },
      take: sampleSize,
      orderBy: { [metric]: "asc" },
    });

    const values = rawValues.map((r) => r[metric]).filter((v) => v !== null);

    if (values.length >= 30) {
      const stats = calculateStats(values);
      statsToCreate.push({
        benchmarkId: benchmark.id,
        metricKey: metric,
        n: count,
        mean: aggregations._avg[metric],
        median: stats.median,
        stdDev: stats.stdDev,
        min: aggregations._min[metric],
        max: aggregations._max[metric],
        p10: stats.p10,
        p25: stats.p25,
        p50: stats.p50,
        p75: stats.p75,
        p90: stats.p90,
        p95: stats.p95,
      });
      console.log(`✅ ${metric}: n=${count}, mean=${aggregations._avg[metric]?.toFixed(2)}`);
    }
  }

  if (statsToCreate.length > 0) {
    await prisma.benchmarkStatistic.createMany({ data: statsToCreate });
  }

  console.log(`\n✅ Estadísticas calculadas: ${statsToCreate.length} métricas`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
