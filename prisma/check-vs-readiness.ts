/**
 * 🔬 Vital Signs readiness check.
 *
 * Read-only diagnostic. Counts what data is available for the VS pipeline:
 *   - users with EqSnapshot (SEI)
 *   - users with TalentSnapshot (Brain Talents)
 *   - intersection (users where /hub/vital-signs would render)
 *   - FamilyRelation count
 *   - VitalSignsAssessment count
 *   - DebriefSession count
 *   - PulsePointWeights versions (calibrated models in lab)
 *   - UserConsent for research_lens v2
 *   - Benchmarks with correlations calculated
 *
 * Usage:
 *   npx tsx prisma/check-vs-readiness.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pct(n: number, total: number): string {
  if (total === 0) return "—";
  return `${((n / total) * 100).toFixed(1)}%`;
}

async function main() {
  console.log("\n===== VS Readiness Check =====\n");

  // Total users
  const totalUsers = await prisma.user.count();
  console.log(`👥 Total users:                  ${totalUsers}`);

  // EQ snapshots
  const eqUsers = await prisma.eqSnapshot.groupBy({ by: ["userId"], _count: { _all: true } });
  console.log(`📊 Users with EqSnapshot (SEI):  ${eqUsers.length}  (${pct(eqUsers.length, totalUsers)})`);

  // Talent snapshots
  const talentUsers = await prisma.talentSnapshot.groupBy({ by: ["userId"], _count: { _all: true } });
  console.log(`🧠 Users with TalentSnapshot:    ${talentUsers.length}  (${pct(talentUsers.length, totalUsers)})`);

  // Intersection
  const eqSet = new Set(eqUsers.map((u) => u.userId));
  const talentSet = new Set(talentUsers.map((u) => u.userId));
  const both = [...eqSet].filter((id) => talentSet.has(id));
  console.log(`✅ Users with BOTH (full VS):    ${both.length}  (${pct(both.length, totalUsers)})`);

  // List those users for visibility (max 10)
  if (both.length > 0) {
    const sample = await prisma.user.findMany({
      where: { id: { in: both.slice(0, 10) } },
      select: { id: true, email: true, name: true },
    });
    console.log(`   Sample (first 10):`);
    for (const u of sample) {
      console.log(`     · ${u.email ?? u.id}  (${u.name ?? "—"})`);
    }
  }

  // Family
  const families = await prisma.familyRelation.count();
  const acceptedFamilies = await prisma.familyRelation.count({
    where: { consentStatus: "accepted" },
  });
  console.log(`\n👪 FamilyRelation total:         ${families}  (accepted: ${acceptedFamilies})`);

  // Assessments
  const assessments = await prisma.vitalSignsAssessment.count();
  const assessmentsByScope = await prisma.vitalSignsAssessment.groupBy({
    by: ["scope"],
    _count: { _all: true },
  });
  console.log(`📥 VitalSignsAssessment total:   ${assessments}`);
  for (const a of assessmentsByScope) {
    console.log(`     · ${a.scope}: ${a._count._all}`);
  }

  // Debriefs
  const debriefs = await prisma.debriefSession.count();
  console.log(`🎯 DebriefSession total:         ${debriefs}`);

  // Pulse Point Weights (lab models)
  const weights = await prisma.pulsePointWeights.groupBy({
    by: ["pulsePointCode", "version"],
    _count: { _all: true },
  });
  const versionsByPp: Record<string, number[]> = {};
  for (const w of weights) {
    versionsByPp[w.pulsePointCode] ??= [];
    if (!versionsByPp[w.pulsePointCode].includes(w.version)) {
      versionsByPp[w.pulsePointCode].push(w.version);
    }
  }
  const ppsWithModel = Object.keys(versionsByPp).length;
  console.log(`\n⚖️  Pulse Points with v1+ models: ${ppsWithModel} / 15`);
  const activeWeights = await prisma.pulsePointWeights.findMany({
    where: { active: true },
    select: { pulsePointCode: true, version: true },
    distinct: ["pulsePointCode"],
  });
  console.log(`✅ Pulse Points with ACTIVE v1+: ${activeWeights.length} / 15`);

  // Research consents
  const researchConsents = await prisma.userConsent.count({
    where: {
      consentKey: "research_lens",
      granted: true,
      revokedAt: null,
      version: { gte: 2 },
    },
  });
  console.log(`\n🔬 Research lens v2+ consents:   ${researchConsents}`);

  // Research access levels
  const accessLevels = await prisma.user.groupBy({
    by: ["researchAccessLevel"],
    _count: { _all: true },
  });
  console.log(`   ResearchAccessLevel breakdown:`);
  for (const a of accessLevels) {
    console.log(`     · ${a.researchAccessLevel}: ${a._count._all}`);
  }

  // Benchmarks
  const benchmarks = await prisma.benchmark.count();
  const benchmarksWithCorrelations = await prisma.benchmark.findMany({
    where: { correlations: { some: {} } },
    select: { id: true, name: true, _count: { select: { correlations: true } } },
  });
  console.log(`\n📈 Benchmarks total:             ${benchmarks}`);
  console.log(`   With correlations calculated: ${benchmarksWithCorrelations.length}`);
  for (const b of benchmarksWithCorrelations.slice(0, 5)) {
    console.log(`     · ${b.name} (${b._count.correlations} rows)`);
  }

  // Verdict
  console.log("\n===== Verdict =====\n");
  if (both.length === 0) {
    console.log("❌ Nobody can see /hub/vital-signs yet — no user has BOTH EqSnapshot + TalentSnapshot.");
    console.log("   Next: import SEI assessments (EqSnapshot) and Brain Talents (TalentSnapshot) for at least 1 user.");
  } else {
    console.log(`✅ ${both.length} user(s) will see VS scores at /hub/vital-signs (v0 hardcoded model).`);
  }
  if (assessments === 0) {
    console.log("⚠️  /hub/debrief has no assessments to create debriefs from — upload OVS/TVS/LVS CSVs.");
  }
  if (benchmarksWithCorrelations.length === 0) {
    console.log("⚠️  No benchmark correlations — can't recalculate weights yet. /hub/admin/vital-signs/lab will be empty.");
  }
  if (researchConsents === 0) {
    console.log("⚠️  /research/cases will be empty — no user has granted research_lens v2 consent yet.");
  }
  if (both.length >= 5) {
    console.log(`✅ HR/Exec aggregates will work (N=${both.length} ≥ 5 floor).`);
  } else {
    console.log(`⚠️  HR/Exec aggregates suppressed (N=${both.length} < 5).`);
  }

  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ check-vs-readiness failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
