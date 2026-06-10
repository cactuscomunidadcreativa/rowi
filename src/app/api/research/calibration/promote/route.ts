export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { logResearchAccess, requireResearchUser } from "@/lib/research/access";

/**
 * Promote BE2GROW weights from v0-hypothesis to v1 (or any subsequent version).
 *
 * Restricted to founder only. Body: { fromVersion, toVersion, notes? }.
 * Future inferences will start using the new version.
 */

export async function POST(req: NextRequest) {
  try {
    const auth = await requireResearchUser(req);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const { user } = auth;

    if (user.researchAccessLevel !== "founder") {
      return NextResponse.json(
        { ok: false, error: "Only founder can promote weights to a new version" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { fromVersion, toVersion, notes } = body as {
      fromVersion: string;
      toVersion: string;
      notes?: string;
    };

    if (!fromVersion || !toVersion) {
      return NextResponse.json(
        { ok: false, error: "fromVersion and toVersion required" },
        { status: 400 },
      );
    }

    const task = await prisma.backgroundTask.create({
      data: {
        type: "vital_signs_weights_promotion",
        status: "completed",
        description: `Promote weights ${fromVersion} -> ${toVersion}`,
        payload: { fromVersion, toVersion, notes: notes ?? null, promotedBy: user.id } as object,
        result: { active: toVersion } as object,
        finishedAt: new Date(),
      },
    });

    await logResearchAccess({
      viewerUserId: user.id,
      action: "promote_weights",
      contextPath: "/research/calibration/promote",
      reason: notes ?? undefined,
      metadata: { fromVersion, toVersion, taskId: task.id },
    });

    return NextResponse.json({
      ok: true,
      promotion: {
        from: fromVersion,
        to: toVersion,
        at: task.startedAt,
        by: user.id,
        taskId: task.id,
      },
    });
  } catch (e: unknown) {
    console.error("/api/research/calibration/promote error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
