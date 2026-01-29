/**
 * 💳 API: Stripe Customer Portal
 * POST /api/stripe/portal - Crear sesión del portal de cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createCustomerPortalSession } from "@/lib/stripe/subscription-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { returnUrl } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalUrl = await createCustomerPortalSession(
      session.user.id,
      returnUrl || `${baseUrl}/settings/billing`
    );

    return NextResponse.json({
      ok: true,
      url: portalUrl,
    });
  } catch (error) {
    console.error("❌ Error creating portal session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error creating portal session",
      },
      { status: 500 }
    );
  }
}
