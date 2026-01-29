// check-benchmark.mjs - Script para verificar estado de benchmarks
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando benchmarks...\n");

  const benchmarks = await prisma.benchmark.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log(`📊 Total benchmarks: ${benchmarks.length}\n`);

  for (const b of benchmarks) {
    const dataPoints = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId: b.id },
    });
    const stats = await prisma.benchmarkStatistic.count({
      where: { benchmarkId: b.id },
    });
    const corr = await prisma.benchmarkCorrelation.count({
      where: { benchmarkId: b.id },
    });
    const top = await prisma.benchmarkTopPerformer.count({
      where: { benchmarkId: b.id },
    });

    console.log(`📌 ${b.name}`);
    console.log(`   ID: ${b.id}`);
    console.log(`   Status: ${b.status}`);
    console.log(`   TotalRows: ${b.totalRows}`);
    console.log(`   DataPoints: ${dataPoints}`);
    console.log(`   Statistics: ${stats}`);
    console.log(`   Correlations: ${corr}`);
    console.log(`   TopPerformers: ${top}`);
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
