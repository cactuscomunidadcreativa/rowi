import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * Devuelve conteo general y uso de almacenamiento
 */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const [
      users,
      tenants,
      agents,
      orgs,
      hubs,
      members,
      eqSnapshots,
      emotionalEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.agentConfig.count(),
      prisma.organization.count(),
      prisma.hub.count(),
      prisma.communityMember.count(),
      prisma.eqSnapshot.count(),
      prisma.emotionalEvent.count(),
    ]);

    /* =========================================================
       💾 Cálculo de uso de almacenamiento
       ========================================================= */
    // Si tu app guarda archivos en `/public/uploads` o `/tmp`
    const storageDirs = ["/tmp", path.join(process.cwd(), "public", "uploads")];

    let totalBytes = 0;
    for (const dir of storageDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const stat = fs.statSync(path.join(dir, f));
        if (stat.isFile()) totalBytes += stat.size;
      }
    }

    const toMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      Users: users,
      Tenants: tenants,
      "AI Agents": agents,
      Organizations: orgs,
      Hubs: hubs,
      Members: members,
      "EQ Snapshots": eqSnapshots,
      "Emotional Events": emotionalEvents,
      "Storage Used (MB)": Number(toMB(totalBytes)),
    });
  } catch (e: any) {
    console.error("[API /hub/database] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}