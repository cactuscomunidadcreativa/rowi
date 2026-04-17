// src/app/api/workspaces/[id]/upload-csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";
import { parse } from "csv-parse/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/workspaces/[id]/upload-csv
 * Sube CSV de miembros con datos SEI. Auto-crea Benchmark si >=20 miembros.
 *
 * Body: FormData with `file` (CSV)
 * O body JSON con `csvText`
 */

const COLUMN_MAP: Record<string, string> = {
  "first name": "firstName", "firstname": "firstName", "nombre": "firstName", "name": "firstName",
  "last name": "lastName", "lastname": "lastName", "apellido": "lastName",
  "email": "email", "correo": "email", "e-mail": "email",
  "country": "country", "pais": "country", "país": "country",
  "brain style": "brainStyle", "brainstyle": "brainStyle", "estilo cerebral": "brainStyle",
  "role": "role", "rol": "role", "cargo": "role", "job role": "role",
  "group": "group", "grupo": "group", "team": "group",
  "k": "K", "know yourself": "K", "conocerte": "K",
  "c": "C", "choose yourself": "C", "elegirte": "C",
  "g": "G", "give yourself": "G", "entregarte": "G",
  "overall": "overall4", "overall4": "overall4", "eq total": "overall4",
  "el": "EL", "emotional literacy": "EL",
  "rp": "RP", "recognize patterns": "RP",
  "act": "ACT", "consequential thinking": "ACT",
  "ne": "NE", "navigate emotions": "NE",
  "im": "IM", "intrinsic motivation": "IM",
  "op": "OP", "optimism": "OP",
  "emp": "EMP", "empathy": "EMP",
  "ng": "NG", "noble goals": "NG",
  "effectiveness": "effectiveness",
  "relationships": "relationships",
  "wellbeing": "wellbeing",
  "quality of life": "qualityOfLife",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function mapRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const mapped = COLUMN_MAP[normalizeHeader(k)];
    if (mapped) out[mapped] = v;
  }
  return out;
}

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canManage = await canManageWorkspace(token.sub, communityId);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const workspace = await prisma.rowiCommunity.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, tenantId: true, workspaceType: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, email: true, primaryTenantId: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tenantId = workspace.tenantId || user.primaryTenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    // Parse CSV
    let csvText = "";
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csvText || "";
    }

    if (!csvText) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No valid rows" }, { status: 400 });
    }

    // Process each row
    let created = 0;
    let updated = 0;
    let errors = 0;
    const memberIds: string[] = [];

    for (const raw of records) {
      try {
        const row = mapRow(raw);
        if (!row.email && !row.firstName && !row.lastName) {
          errors++;
          continue;
        }

        const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || row.firstName || row.email || "—";

        // Upsert CommunityMember
        let member: any = null;
        if (row.email) {
          member = await prisma.communityMember.findFirst({
            where: { tenantId, email: row.email },
          });
        }

        if (member) {
          member = await prisma.communityMember.update({
            where: { id: member.id },
            data: {
              communityId,
              name,
              firstName: row.firstName || null,
              lastName: row.lastName || null,
              country: row.country || member.country,
              brainStyle: row.brainStyle || member.brainStyle,
              role: row.role || member.role,
              group: row.group || member.group,
              source: "csv",
              ownerId: user.id,
            },
          });
          updated++;
        } else {
          member = await prisma.communityMember.create({
            data: {
              tenantId,
              communityId,
              ownerId: user.id,
              name,
              firstName: row.firstName || null,
              lastName: row.lastName || null,
              email: row.email || null,
              country: row.country || null,
              brainStyle: row.brainStyle || null,
              role: row.role || null,
              group: row.group || null,
              source: "csv",
              status: "ACTIVE",
            },
          });
          created++;
        }
        memberIds.push(member.id);

        // Create EqSnapshot if we have SEI data
        const hasSEI = row.K || row.C || row.G || row.EL || row.RP || row.ACT || row.NE || row.IM || row.OP || row.EMP || row.NG;
        if (hasSEI) {
          await prisma.eqSnapshot.create({
            data: {
              memberId: member.id,
              dataset: "actual",
              owner: user.email,
              email: row.email || null,
              country: row.country || null,
              K: toNum(row.K),
              C: toNum(row.C),
              G: toNum(row.G),
              EL: toNum(row.EL),
              RP: toNum(row.RP),
              ACT: toNum(row.ACT),
              NE: toNum(row.NE),
              IM: toNum(row.IM),
              OP: toNum(row.OP),
              EMP: toNum(row.EMP),
              NG: toNum(row.NG),
              overall4: toNum(row.overall4),
              brainStyle: row.brainStyle || null,
            },
          });
        }
      } catch (rowErr) {
        console.error("Row error:", rowErr);
        errors++;
      }
    }

    // Auto-create Benchmark if >=20 members and no existing active benchmark
    let autoBenchmarkId: string | null = null;
    const memberCount = await prisma.communityMember.count({ where: { communityId } });
    const existingBenchmark = await prisma.benchmark.findFirst({
      where: { communityId, isActive: true },
    });

    if (memberCount >= 20 && !existingBenchmark) {
      const bm = await prisma.benchmark.create({
        data: {
          name: `${workspace.name} - Benchmark`,
          description: `Auto-generated benchmark from ${memberCount} members`,
          type: "INTERNAL",
          scope: "COMMUNITY",
          communityId,
          tenantId,
          status: "COMPLETED",
          totalRows: memberCount,
          processedRows: memberCount,
          uploadedBy: user.email || "system",
          processedAt: new Date(),
        },
      });
      autoBenchmarkId = bm.id;
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      total: records.length,
      autoBenchmarkId,
    });
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/upload-csv error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
