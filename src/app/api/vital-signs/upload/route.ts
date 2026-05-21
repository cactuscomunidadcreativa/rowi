export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import {
  parseOvsTvsCsv,
  aggregateOvsTvs,
  type OvsTvsScope,
} from "@/lib/vital-signs/parsers/ovs";
import { parseLvsXlsx, aggregateLvs } from "@/lib/vital-signs/parsers/lvs";

/**
 * Upload a Six Seconds OVS / TVS / LVS export and persist as a VitalSignsAssessment.
 *
 * Request: multipart/form-data with fields:
 *   - file: the CSV (OVS/TVS) or xlsx (LVS) file
 *   - scope: OVS | TVS | LVS
 *   - dataset: production | sample | test  (default sample for safety)
 *   - subjectType: org | team | leader  (defaults inferred from scope)
 *   - subjectId: id of the org/team/leader  (optional, can be set later)
 *   - communityId: optional, narrows the assessment to a community
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const scope = String(form.get("scope") ?? "").toUpperCase() as OvsTvsScope | "LVS";
    const dataset = String(form.get("dataset") ?? "sample");
    const subjectType =
      String(form.get("subjectType") ?? "") ||
      (scope === "OVS" ? "org" : scope === "TVS" ? "team" : "leader");
    const subjectId = String(form.get("subjectId") ?? user.id);
    const communityId = (form.get("communityId") as string | null) ?? null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }
    if (!["OVS", "TVS", "LVS"].includes(scope)) {
      return NextResponse.json(
        { ok: false, error: "scope must be OVS, TVS, or LVS" },
        { status: 400 },
      );
    }

    const assessment = await prisma.vitalSignsAssessment.create({
      data: {
        communityId,
        scope,
        subjectType,
        subjectId,
        source: "csv_upload",
        periodStart: new Date(),
        periodEnd: new Date(),
        sampleSize: 0,
        dataset,
        status: "active",
        createdById: user.id,
      },
    });

    let sampleSize = 0;
    let projectName: string | null = null;

    if (scope === "OVS" || scope === "TVS") {
      const text = await file.text();
      const parsed = parseOvsTvsCsv(text, scope as OvsTvsScope);
      if (parsed.errors.length > 0) {
        await prisma.vitalSignsAssessment.delete({ where: { id: assessment.id } });
        return NextResponse.json(
          { ok: false, error: "Parse errors", details: parsed.errors },
          { status: 422 },
        );
      }
      projectName = parsed.projectName;
      sampleSize = parsed.sampleSize;

      await prisma.vitalSignsResponse.createMany({
        data: parsed.respondents.map((r) => ({
          assessmentId: assessment.id,
          respondentRole: "anonymous",
          rawItems: r.rawItems,
          itemScoresST: r.itemScoresST,
          outcomesRaw: r.outcomesRaw,
        })),
      });

      const agg = aggregateOvsTvs(parsed.respondents);
      const scoreRows = [
        ...agg.drivers.map((d) => ({
          assessmentId: assessment.id,
          dimension: d.code,
          level: "driver",
          scoreMean: d.mean,
          scoreSD: d.sd,
          benchmarkDelta: d.mean - 100,
          cohesionBand: d.cohesionBand,
          strengthBand: d.strengthBand,
          n: d.n,
        })),
        ...agg.outcomes.map((o) => ({
          assessmentId: assessment.id,
          dimension: o.code,
          level: "outcome",
          scoreMean: o.mean,
          scoreSD: o.sd,
          benchmarkDelta: o.mean - 100,
          cohesionBand: o.cohesionBand,
          strengthBand: o.strengthBand,
          n: o.n,
        })),
      ];
      await prisma.vitalSignsScore.createMany({ data: scoreRows });
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = parseLvsXlsx(arrayBuffer);
      if (parsed.errors.length > 0) {
        await prisma.vitalSignsAssessment.delete({ where: { id: assessment.id } });
        return NextResponse.json(
          { ok: false, error: "Parse errors", details: parsed.errors },
          { status: 422 },
        );
      }
      projectName = parsed.projectName;
      sampleSize = parsed.sampleSize;

      await prisma.vitalSignsResponse.createMany({
        data: parsed.respondents.map((r) => ({
          assessmentId: assessment.id,
          respondentRole: r.respondentRole,
          rawItems: r.items,
          outcomesRaw: r.outcomes as Record<string, number | null>,
        })),
      });

      const agg = aggregateLvs(parsed.respondents);
      const scoreRows = [
        ...agg.overallDrivers.map((d) => ({
          assessmentId: assessment.id,
          dimension: d.code,
          level: "driver",
          scoreMean: d.mean,
          scoreSD: d.sd,
          n: d.n,
        })),
        ...agg.overallOutcomes.map((o) => ({
          assessmentId: assessment.id,
          dimension: o.code,
          level: "outcome",
          scoreMean: o.mean,
          scoreSD: o.sd,
          n: o.n,
        })),
      ];
      await prisma.vitalSignsScore.createMany({ data: scoreRows });
    }

    await prisma.vitalSignsAssessment.update({
      where: { id: assessment.id },
      data: {
        sampleSize,
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      assessmentId: assessment.id,
      scope,
      sampleSize,
      projectName,
      dataset,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/upload error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
