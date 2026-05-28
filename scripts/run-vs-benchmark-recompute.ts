/**
 * Standalone runner for the VS Benchmark recompute job.
 *
 *   pnpm dlx tsx scripts/run-vs-benchmark-recompute.ts        # all scopes
 *   pnpm dlx tsx scripts/run-vs-benchmark-recompute.ts OVS    # one scope
 */

import { PrismaClient } from "@prisma/client";
import { recomputeAll } from "@/lib/vital-signs/benchmark-recompute";

const prisma = new PrismaClient();

async function main() {
  const scopeArg = process.argv[2]?.toUpperCase();
  const scope =
    scopeArg && ["OVS", "TVS", "LVS", "FVS"].includes(scopeArg)
      ? (scopeArg as "OVS" | "TVS" | "LVS" | "FVS")
      : undefined;

  console.log(`▶ Recompute starting (scope=${scope ?? "ALL"})`);
  const t0 = Date.now();
  const result = await recomputeAll({ scope });
  const ms = Date.now() - t0;
  console.log(`✅ Recompute done in ${ms}ms`);
  console.log("Stats:", result.stats);
  console.log("Correlations:", result.correlations);

  // Quick sanity preview
  const topStats = await prisma.vitalSignsBenchmarkStat.findMany({
    where: { scope: scope ?? undefined, country: null, gender: null, ageRange: null, sector: null },
    take: 30,
    orderBy: [{ scope: "asc" }, { level: "asc" }, { dimension: "asc" }],
  });
  console.log("\nGlobal stats sample:");
  for (const s of topStats) {
    console.log(
      `  ${s.scope.padEnd(4)} ${s.level.padEnd(8)} ${s.dimension.padEnd(20)}  n=${s.n.toString().padStart(4)}  mean=${s.mean.toFixed(2).padStart(7)}  sd=${(s.sd ?? 0).toFixed(2).padStart(6)}  p25=${s.p25?.toFixed(1) ?? "-"}  p50=${s.p50?.toFixed(1) ?? "-"}  p75=${s.p75?.toFixed(1) ?? "-"}`,
    );
  }

  const topCorr = await prisma.vitalSignsBenchmarkCorrelation.findMany({
    where: { scope: scope ?? undefined },
    take: 20,
    orderBy: { correlation: "desc" },
  });
  console.log("\nTop correlations (positive):");
  for (const c of topCorr) {
    console.log(`  ${c.scope}  ${c.xKey.padEnd(18)} ↔ ${c.yKey.padEnd(18)}  r=${c.correlation.toFixed(3).padStart(7)}  n=${c.n}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
