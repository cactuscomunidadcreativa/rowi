/**
 * 🌐 RowiVerse Contribution Service
 * Servicio para contribuir datos EQ al benchmark global RowiVerse
 */

import { prisma } from "@/core/prisma";

// =========================================================
// Tipos
// =========================================================

interface EQData {
  eqTotal?: number | null;
  K?: number | null;
  C?: number | null;
  G?: number | null;
  EL?: number | null;
  RP?: number | null;
  ACT?: number | null;
  NE?: number | null;
  IM?: number | null;
  OP?: number | null;
  EMP?: number | null;
  NG?: number | null;
}

interface DemographicData {
  country?: string | null;
  region?: string | null;
  sector?: string | null;
  jobFunction?: string | null;
  jobRole?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  education?: string | null;
}

interface OutcomeData {
  effectiveness?: number | null;
  relationships?: number | null;
  qualityOfLife?: number | null;
  wellbeing?: number | null;
  influence?: number | null;
  decisionMaking?: number | null;
  community?: number | null;
  health?: number | null;
}

interface BrainTalentData {
  dataMining?: number | null;
  modeling?: number | null;
  prioritizing?: number | null;
  connection?: number | null;
  emotionalInsight?: number | null;
  collaboration?: number | null;
  reflecting?: number | null;
  adaptability?: number | null;
  criticalThinking?: number | null;
  resilience?: number | null;
  riskTolerance?: number | null;
  imagination?: number | null;
  proactivity?: number | null;
  commitment?: number | null;
  problemSolving?: number | null;
  vision?: number | null;
  designing?: number | null;
  entrepreneurship?: number | null;
  brainAgility?: number | null;
}

export interface ContributionInput {
  userId?: string;
  memberId?: string;
  tenantId?: string;
  sourceType: "registration" | "csv_upload" | "eq_snapshot" | "manual";
  sourceId?: string;
  eqData: EQData;
  demographics: DemographicData;
  outcomes?: OutcomeData;
  brainTalents?: BrainTalentData;
}

// =========================================================
// Obtener o crear el benchmark RowiVerse global
// =========================================================

export async function getOrCreateRowiverseBenchmark(): Promise<string> {
  // Buscar benchmark existente de tipo ROWIVERSE
  let benchmark = await prisma.benchmark.findFirst({
    where: {
      type: "ROWIVERSE",
      scope: "GLOBAL",
      isActive: true,
    },
  });

  if (!benchmark) {
    // Crear el benchmark global RowiVerse
    benchmark = await prisma.benchmark.create({
      data: {
        name: "RowiVerse Global Benchmark",
        description:
          "Benchmark global de inteligencia emocional construido con las contribuciones de la comunidad Rowi",
        type: "ROWIVERSE",
        scope: "GLOBAL",
        status: "COMPLETED",
        isActive: true,
        isLearning: true,
        uploadedBy: "system",
      },
    });
    console.log("✨ Created RowiVerse global benchmark:", benchmark.id);
  }

  return benchmark.id;
}

// =========================================================
// Contribuir datos al RowiVerse
// =========================================================

export async function contributeToRowiverse(
  input: ContributionInput
): Promise<{ success: boolean; contributionId?: string; error?: string }> {
  try {
    // Verificar si el usuario tiene habilitada la contribución
    if (input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { contributeToRowiverse: true },
      });

      if (!user?.contributeToRowiverse) {
        return {
          success: false,
          error: "User has opted out of RowiVerse contributions",
        };
      }
    }

    // Validar que hay datos EQ suficientes
    const { eqData, demographics, outcomes, brainTalents } = input;
    if (!eqData.eqTotal && !eqData.K && !eqData.C && !eqData.G) {
      return {
        success: false,
        error: "No EQ data provided",
      };
    }

    // Obtener el benchmark RowiVerse
    const benchmarkId = await getOrCreateRowiverseBenchmark();

    // Crear el data point anonimizado
    const dataPoint = await prisma.benchmarkDataPoint.create({
      data: {
        benchmarkId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceDate: new Date(),

        // Demographics
        country: demographics.country || null,
        region: demographics.region || null,
        sector: demographics.sector || null,
        jobFunction: demographics.jobFunction || null,
        jobRole: demographics.jobRole || null,
        ageRange: demographics.ageRange || null,
        gender: demographics.gender || null,
        education: demographics.education || null,

        // Core EQ
        K: eqData.K,
        C: eqData.C,
        G: eqData.G,
        eqTotal: eqData.eqTotal,

        // 8 Competencias
        EL: eqData.EL,
        RP: eqData.RP,
        ACT: eqData.ACT,
        NE: eqData.NE,
        IM: eqData.IM,
        OP: eqData.OP,
        EMP: eqData.EMP,
        NG: eqData.NG,

        // Outcomes
        effectiveness: outcomes?.effectiveness,
        relationships: outcomes?.relationships,
        qualityOfLife: outcomes?.qualityOfLife,
        wellbeing: outcomes?.wellbeing,
        influence: outcomes?.influence,
        decisionMaking: outcomes?.decisionMaking,
        community: outcomes?.community,
        health: outcomes?.health,

        // Brain Talents
        dataMining: brainTalents?.dataMining,
        modeling: brainTalents?.modeling,
        prioritizing: brainTalents?.prioritizing,
        connection: brainTalents?.connection,
        emotionalInsight: brainTalents?.emotionalInsight,
        collaboration: brainTalents?.collaboration,
        reflecting: brainTalents?.reflecting,
        adaptability: brainTalents?.adaptability,
        criticalThinking: brainTalents?.criticalThinking,
        resilience: brainTalents?.resilience,
        riskTolerance: brainTalents?.riskTolerance,
        imagination: brainTalents?.imagination,
        proactivity: brainTalents?.proactivity,
        commitment: brainTalents?.commitment,
        problemSolving: brainTalents?.problemSolving,
        vision: brainTalents?.vision,
        designing: brainTalents?.designing,
        entrepreneurship: brainTalents?.entrepreneurship,
        brainAgility: brainTalents?.brainAgility,

        // Tenant association (for filtering but not identification)
        tenantId: input.tenantId,
      },
    });

    // Crear registro de contribución
    const contribution = await prisma.rowiVerseContribution.create({
      data: {
        userId: input.userId,
        memberId: input.memberId,
        tenantId: input.tenantId,
        benchmarkId,
        dataPointId: dataPoint.id,
        sourceType: input.sourceType,
        sourceId: input.sourceId,

        // Datos básicos para stats
        eqTotal: eqData.eqTotal,
        K: eqData.K,
        C: eqData.C,
        G: eqData.G,

        // Demographics
        country: demographics.country,
        region: demographics.region,
        sector: demographics.sector,
        jobFunction: demographics.jobFunction,
        ageRange: demographics.ageRange,
        gender: demographics.gender,

        status: "processed",
        processedAt: new Date(),
      },
    });

    // Actualizar contador del benchmark
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        totalRows: { increment: 1 },
        processedRows: { increment: 1 },
        lastEnrichedAt: new Date(),
      },
    });

    console.log(`✅ Contributed to RowiVerse: ${contribution.id}`);

    return {
      success: true,
      contributionId: contribution.id,
    };
  } catch (error) {
    console.error("❌ Error contributing to RowiVerse:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =========================================================
// Contribuir múltiples registros (para CSV uploads)
// =========================================================

export async function contributeBatchToRowiverse(
  inputs: ContributionInput[]
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}> {
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  // Obtener el benchmark ID una sola vez
  const benchmarkId = await getOrCreateRowiverseBenchmark();

  for (const input of inputs) {
    try {
      // Verificar opt-in si hay userId
      if (input.userId) {
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
          select: { contributeToRowiverse: true },
        });
        if (!user?.contributeToRowiverse) {
          continue; // Skip but don't count as failure
        }
      }

      const { eqData, demographics, outcomes, brainTalents } = input;

      // Validar datos mínimos
      if (!eqData.eqTotal && !eqData.K && !eqData.C && !eqData.G) {
        continue;
      }

      // Crear data point
      const dataPoint = await prisma.benchmarkDataPoint.create({
        data: {
          benchmarkId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          sourceDate: new Date(),
          country: demographics.country,
          region: demographics.region,
          sector: demographics.sector,
          jobFunction: demographics.jobFunction,
          jobRole: demographics.jobRole,
          ageRange: demographics.ageRange,
          gender: demographics.gender,
          education: demographics.education,
          K: eqData.K,
          C: eqData.C,
          G: eqData.G,
          eqTotal: eqData.eqTotal,
          EL: eqData.EL,
          RP: eqData.RP,
          ACT: eqData.ACT,
          NE: eqData.NE,
          IM: eqData.IM,
          OP: eqData.OP,
          EMP: eqData.EMP,
          NG: eqData.NG,
          effectiveness: outcomes?.effectiveness,
          relationships: outcomes?.relationships,
          qualityOfLife: outcomes?.qualityOfLife,
          wellbeing: outcomes?.wellbeing,
          influence: outcomes?.influence,
          decisionMaking: outcomes?.decisionMaking,
          community: outcomes?.community,
          health: outcomes?.health,
          dataMining: brainTalents?.dataMining,
          modeling: brainTalents?.modeling,
          prioritizing: brainTalents?.prioritizing,
          connection: brainTalents?.connection,
          emotionalInsight: brainTalents?.emotionalInsight,
          collaboration: brainTalents?.collaboration,
          reflecting: brainTalents?.reflecting,
          adaptability: brainTalents?.adaptability,
          criticalThinking: brainTalents?.criticalThinking,
          resilience: brainTalents?.resilience,
          riskTolerance: brainTalents?.riskTolerance,
          imagination: brainTalents?.imagination,
          proactivity: brainTalents?.proactivity,
          commitment: brainTalents?.commitment,
          problemSolving: brainTalents?.problemSolving,
          vision: brainTalents?.vision,
          designing: brainTalents?.designing,
          entrepreneurship: brainTalents?.entrepreneurship,
          brainAgility: brainTalents?.brainAgility,
          tenantId: input.tenantId,
        },
      });

      // Crear registro de contribución
      await prisma.rowiVerseContribution.create({
        data: {
          userId: input.userId,
          memberId: input.memberId,
          tenantId: input.tenantId,
          benchmarkId,
          dataPointId: dataPoint.id,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          eqTotal: eqData.eqTotal,
          K: eqData.K,
          C: eqData.C,
          G: eqData.G,
          country: demographics.country,
          region: demographics.region,
          sector: demographics.sector,
          jobFunction: demographics.jobFunction,
          ageRange: demographics.ageRange,
          gender: demographics.gender,
          status: "processed",
          processedAt: new Date(),
        },
      });

      processed++;
    } catch (error) {
      failed++;
      errors.push(
        error instanceof Error ? error.message : `Failed: ${input.sourceId}`
      );
    }
  }

  // Actualizar contador del benchmark una sola vez
  if (processed > 0) {
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        totalRows: { increment: processed },
        processedRows: { increment: processed },
        lastEnrichedAt: new Date(),
      },
    });
  }

  console.log(`✅ Batch contribution: ${processed} processed, ${failed} failed`);

  return {
    success: failed === 0,
    processed,
    failed,
    errors,
  };
}

// =========================================================
// Obtener estadísticas de contribuciones
// =========================================================

export async function getRowiverseStats(): Promise<{
  totalContributions: number;
  bySource: Record<string, number>;
  byCountry: Array<{ country: string; count: number }>;
  lastContribution: Date | null;
}> {
  const [total, bySource, byCountry, lastContribution] = await Promise.all([
    prisma.rowiVerseContribution.count({
      where: { status: "processed" },
    }),
    prisma.rowiVerseContribution.groupBy({
      by: ["sourceType"],
      where: { status: "processed" },
      _count: true,
    }),
    prisma.rowiVerseContribution.groupBy({
      by: ["country"],
      where: { status: "processed", country: { not: null } },
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.rowiVerseContribution.findFirst({
      where: { status: "processed" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    totalContributions: total,
    bySource: bySource.reduce(
      (acc, item) => {
        acc[item.sourceType] = item._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    byCountry: byCountry.map((item) => ({
      country: item.country || "Unknown",
      count: item._count,
    })),
    lastContribution: lastContribution?.createdAt || null,
  };
}

// =========================================================
// Obtener contribuciones de un usuario
// =========================================================

export async function getUserContributions(userId: string) {
  return prisma.rowiVerseContribution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sourceType: true,
      eqTotal: true,
      K: true,
      C: true,
      G: true,
      country: true,
      region: true,
      status: true,
      createdAt: true,
    },
  });
}

// =========================================================
// Obtener contribuciones de un tenant
// =========================================================

export async function getTenantContributions(tenantId: string) {
  const [contributions, stats] = await Promise.all([
    prisma.rowiVerseContribution.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        sourceType: true,
        eqTotal: true,
        country: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.rowiVerseContribution.groupBy({
      by: ["sourceType"],
      where: { tenantId },
      _count: true,
    }),
  ]);

  return {
    contributions,
    stats: stats.reduce(
      (acc, item) => {
        acc[item.sourceType] = item._count;
        return acc;
      },
      {} as Record<string, number>
    ),
    totalContributions: contributions.length,
  };
}

// =========================================================
// Contribuir un benchmark ORGANIZACIONAL completo al RowiVerse
// ---------------------------------------------------------
// Copia los data points (ya anónimos — sin userId/PII) de un benchmark
// org/tenant (p.ej. el de una empresa subido por CSV) al benchmark global
// RowiVerse, a nivel cohorte. Así cada org que sube datos hace crecer el
// benchmark global. Idempotente: marca cada copia con sourceId derivado
// del benchmark origen, y omite si ya fue contribuido.
//
// Privacidad: los benchmarkDataPoint NO contienen identidad (son agregables
// por diseño). Solo se copian métricas EQ + demografía de cohorte.
// =========================================================
export async function contributeBenchmarkToRowiverse(
  sourceBenchmarkId: string
): Promise<{ contributed: number; skipped: number }> {
  const source = await prisma.benchmark.findUnique({
    where: { id: sourceBenchmarkId },
    select: { id: true, type: true },
  });

  // Solo contribuyen benchmarks organizacionales (INTERNAL). El propio
  // ROWIVERSE no se auto-contribuye, y los EXTERNAL (mercado) no son datos
  // de la comunidad Rowi.
  if (!source || source.type !== "INTERNAL") {
    return { contributed: 0, skipped: 0 };
  }

  const rowiverseBenchmarkId = await getOrCreateRowiverseBenchmark();
  if (rowiverseBenchmarkId === sourceBenchmarkId) {
    return { contributed: 0, skipped: 0 };
  }

  // Tag idempotente: si ya contribuimos este benchmark, no duplicar.
  const contributionTag = `benchmark:${sourceBenchmarkId}`;
  const already = await prisma.benchmarkDataPoint.count({
    where: { benchmarkId: rowiverseBenchmarkId, sourceId: contributionTag },
  });
  if (already > 0) {
    return { contributed: 0, skipped: already };
  }

  // Campos a copiar (todo menos identidad/relaciones del data point origen).
  const COPY_FIELDS = [
    "country", "region", "jobFunction", "jobRole", "sector",
    "ageRange", "gender", "education", "generation", "year", "month", "quarter",
    "K", "C", "G", "eqTotal",
    "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
    "effectiveness", "relationships", "qualityOfLife", "wellbeing",
    "influence", "decisionMaking", "community", "network", "achievement",
    "satisfaction", "balance", "health",
    "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight",
    "collaboration", "reflecting", "adaptability", "criticalThinking",
    "resilience", "riskTolerance", "imagination", "proactivity", "commitment",
    "problemSolving", "vision", "designing", "entrepreneurship", "brainAgility",
    "brainStyle", "profile", "reliabilityIndex",
  ] as const;

  const PAGE = 1000;
  let contributed = 0;
  let cursor: string | null = null;

  // Paginación por cursor para no cargar todo en memoria en benchmarks grandes.
  for (;;) {
    const page: any[] = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId: sourceBenchmarkId },
      orderBy: { id: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE,
    });
    if (page.length === 0) break;

    const rows = page.map((dp) => {
      const copy: Record<string, any> = {
        benchmarkId: rowiverseBenchmarkId,
        sourceId: contributionTag,
        sourceType: "benchmark_contribution",
        sourceDate: new Date(),
      };
      for (const f of COPY_FIELDS) copy[f] = dp[f] ?? null;
      return copy;
    });

    const res = await prisma.benchmarkDataPoint.createMany({
      // Las claves de `rows` se construyen desde COPY_FIELDS (todas columnas
      // válidas del modelo); el cast evita el tipado estricto del shape dinámico.
      data: rows as any,
      skipDuplicates: true,
    });
    contributed += res.count;
    cursor = page[page.length - 1].id;
    if (page.length < PAGE) break;
  }

  console.log(
    `🌐 Benchmark ${sourceBenchmarkId} → RowiVerse: ${contributed} data points contribuidos`
  );
  return { contributed, skipped: 0 };
}
