/**
 * 🌐 API: RowiVerse Contribution
 * POST /api/rowiverse/contribute - Contribuir datos al benchmark global
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  contributeToRowiverse,
  contributeBatchToRowiverse,
  ContributionInput,
} from "@/lib/rowiverse/contribution-service";

// =========================================================
// POST - Contribuir datos al RowiVerse
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { batch, contributions, ...singleContribution } = body;

    // Modo batch (para CSV uploads)
    if (batch && Array.isArray(contributions)) {
      const result = await contributeBatchToRowiverse(
        contributions as ContributionInput[]
      );

      return NextResponse.json({
        ok: result.success,
        processed: result.processed,
        failed: result.failed,
        errors: result.errors.slice(0, 10), // Limitar errores mostrados
      });
    }

    // Contribución individual
    const input: ContributionInput = {
      userId: singleContribution.userId,
      memberId: singleContribution.memberId,
      tenantId: singleContribution.tenantId,
      sourceType: singleContribution.sourceType || "manual",
      sourceId: singleContribution.sourceId,
      eqData: singleContribution.eqData || {},
      demographics: singleContribution.demographics || {},
      outcomes: singleContribution.outcomes,
      brainTalents: singleContribution.brainTalents,
    };

    const result = await contributeToRowiverse(input);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      contributionId: result.contributionId,
    });
  } catch (error) {
    console.error("❌ Error in RowiVerse contribution:", error);
    return NextResponse.json(
      { error: "Error al contribuir al RowiVerse" },
      { status: 500 }
    );
  }
}
