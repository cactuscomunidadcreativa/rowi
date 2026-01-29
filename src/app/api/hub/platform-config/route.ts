// src/app/api/hub/platform-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/* =========================================================
   ⚙️ Platform Configuration API
   ---------------------------------------------------------
   GET  → Fetch platform config for a tenant
   POST → Save platform config for a tenant
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId required" }, { status: 400 });
    }

    // Get tenant with its config
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        meta: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    const meta = (tenant.meta as any) || {};

    return NextResponse.json({
      ok: true,
      config: {
        messaging: meta.messaging || null,
        competencies: meta.sixSecondsCompetencies || null,
        rowiLevels: meta.rowiLevels || null,
        general: meta.general || null,
      },
    });
  } catch (e: any) {
    console.error("❌ GET /api/hub/platform-config error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!auth.isSuperAdmin && auth.organizationRole !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { tenantId, messaging, competencies, rowiLevels, general } = body;

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId required" }, { status: 400 });
    }

    // Get current tenant meta
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { meta: true },
    });

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
    }

    const currentMeta = (tenant.meta as any) || {};

    // Merge new config with existing meta
    const newMeta = {
      ...currentMeta,
      ...(messaging !== undefined && { messaging }),
      ...(competencies !== undefined && { sixSecondsCompetencies: competencies }),
      ...(rowiLevels !== undefined && { rowiLevels }),
      ...(general !== undefined && { general }),
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: auth.id,
    };

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { meta: newMeta },
    });

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: auth.id,
          action: "PLATFORM_CONFIG_UPDATE",
          entity: "Tenant",
          targetId: tenantId,
          details: {
            updatedSections: [
              messaging !== undefined && "messaging",
              competencies !== undefined && "competencies",
              rowiLevels !== undefined && "rowiLevels",
              general !== undefined && "general",
            ].filter(Boolean),
          },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Error logging platform config update:", logErr);
    }

    return NextResponse.json({
      ok: true,
      message: "Configuration saved successfully",
    });
  } catch (e: any) {
    console.error("❌ POST /api/hub/platform-config error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
