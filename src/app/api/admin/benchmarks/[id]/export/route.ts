/**
 * 📊 API: Export Benchmark Data
 * GET /api/admin/benchmarks/[id]/export - Exportar datos del benchmark
 * Soporta: stats, top-performers, correlations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Nombres legibles para metricas
const METRIC_LABELS: Record<string, string> = {
  K: "Know Yourself",
  C: "Choose Yourself",
  G: "Give Yourself",
  eqTotal: "EQ Total",
  EL: "Alfabetizacion Emocional",
  RP: "Reconocer Patrones",
  ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones",
  IM: "Motivacion Intrinseca",
  OP: "Ejercitar Optimismo",
  EMP: "Incrementar Empatia",
  NG: "Perseguir Metas Nobles",
  effectiveness: "Efectividad",
  relationships: "Relaciones",
  qualityOfLife: "Calidad de Vida",
  wellbeing: "Bienestar",
  influence: "Influencia",
  decisionMaking: "Toma de Decisiones",
  community: "Comunidad",
  network: "Red de Contactos",
  achievement: "Logro",
  satisfaction: "Satisfaccion",
  balance: "Balance",
  health: "Salud",
  dataMining: "Data Mining",
  modeling: "Modeling",
  prioritizing: "Prioritizing",
  connection: "Connection",
  emotionalInsight: "Emotional Insight",
  collaboration: "Collaboration",
  reflecting: "Reflecting",
  adaptability: "Adaptability",
  criticalThinking: "Critical Thinking",
  resilience: "Resilience",
  riskTolerance: "Risk Tolerance",
  imagination: "Imagination",
  proactivity: "Proactivity",
  commitment: "Commitment",
  problemSolving: "Problem Solving",
  vision: "Vision",
  designing: "Designing",
  entrepreneurship: "Entrepreneurship",
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "stats"; // stats, top-performers, correlations
    const format = searchParams.get("format") || "csv"; // csv, json

    // Verificar que el benchmark existe
    const benchmark = await prisma.benchmark.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark no encontrado" }, { status: 404 });
    }

    let data: any[] = [];
    let filename = "";

    switch (type) {
      case "stats":
        data = await exportStatistics(id);
        filename = `${benchmark.name.replace(/\s+/g, "_")}_estadisticas`;
        break;

      case "top-performers":
        data = await exportTopPerformers(id);
        filename = `${benchmark.name.replace(/\s+/g, "_")}_top_performers`;
        break;

      case "correlations":
        data = await exportCorrelations(id);
        filename = `${benchmark.name.replace(/\s+/g, "_")}_correlaciones`;
        break;

      default:
        return NextResponse.json({ error: "Tipo de exportacion no valido" }, { status: 400 });
    }

    if (format === "json") {
      return NextResponse.json({
        ok: true,
        data,
        metadata: {
          benchmarkId: id,
          benchmarkName: benchmark.name,
          type,
          exportedAt: new Date().toISOString(),
          totalRecords: data.length,
        },
      });
    }

    // Formato CSV
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting benchmark:", error);
    return NextResponse.json({ error: "Error al exportar benchmark" }, { status: 500 });
  }
}

async function exportStatistics(benchmarkId: string) {
  const stats = await prisma.benchmarkStatistic.findMany({
    where: { benchmarkId },
    orderBy: { metricKey: "asc" },
  });

  return stats.map((s) => ({
    Metrica: METRIC_LABELS[s.metricKey] || s.metricKey,
    Codigo: s.metricKey,
    N: s.n,
    Media: s.mean?.toFixed(2),
    Mediana: s.median?.toFixed(2),
    "Desv. Estandar": s.stdDev?.toFixed(2),
    Minimo: s.min?.toFixed(2),
    Maximo: s.max?.toFixed(2),
    P10: s.p10?.toFixed(2),
    P25: s.p25?.toFixed(2),
    P50: s.p50?.toFixed(2),
    P75: s.p75?.toFixed(2),
    P90: s.p90?.toFixed(2),
    P95: s.p95?.toFixed(2),
  }));
}

async function exportTopPerformers(benchmarkId: string) {
  const topPerformers = await prisma.benchmarkTopPerformer.findMany({
    where: { benchmarkId },
    orderBy: [{ outcomeKey: "asc" }, { country: "asc" }],
  });

  return topPerformers.map((tp) => {
    let topCompetencies = tp.topCompetencies;
    let topTalents = tp.topTalents;

    if (typeof topCompetencies === "string") {
      try { topCompetencies = JSON.parse(topCompetencies); } catch { topCompetencies = []; }
    }
    if (typeof topTalents === "string") {
      try { topTalents = JSON.parse(topTalents); } catch { topTalents = []; }
    }

    const topComps = Array.isArray(topCompetencies)
      ? topCompetencies.slice(0, 3).map((c: any) => METRIC_LABELS[c.key] || c.key).join(", ")
      : "";

    const topTals = Array.isArray(topTalents)
      ? topTalents.slice(0, 3).map((t: any) => METRIC_LABELS[t.key] || t.key).join(", ")
      : "";

    return {
      Outcome: METRIC_LABELS[tp.outcomeKey] || tp.outcomeKey,
      Pais: tp.country || "Global",
      Region: tp.region || "-",
      Sector: tp.sector || "-",
      "Tamano Muestra": tp.sampleSize,
      "Umbral Percentil": tp.percentileThreshold,
      "Avg K": tp.avgK?.toFixed(1),
      "Avg C": tp.avgC?.toFixed(1),
      "Avg G": tp.avgG?.toFixed(1),
      "Top 3 Competencias": topComps,
      "Top 3 Talentos": topTals,
    };
  });
}

async function exportCorrelations(benchmarkId: string) {
  const correlations = await prisma.benchmarkCorrelation.findMany({
    where: { benchmarkId },
    orderBy: [{ outcomeKey: "asc" }, { correlation: "desc" }],
  });

  return correlations.map((c) => ({
    Competencia: METRIC_LABELS[c.competencyKey] || c.competencyKey,
    Outcome: METRIC_LABELS[c.outcomeKey] || c.outcomeKey,
    Correlacion: c.correlation?.toFixed(4),
    "P-Value": c.pValue?.toFixed(6),
    N: c.n,
    Significativo: c.pValue && c.pValue < 0.05 ? "Si" : "No",
    Fuerza: getCorrelationStrength(c.correlation || 0),
  }));
}

function getCorrelationStrength(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.7) return "Fuerte";
  if (abs >= 0.4) return "Moderada";
  if (abs >= 0.2) return "Debil";
  return "Muy debil";
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escapar comillas y envolver en comillas si contiene coma o comilla
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
