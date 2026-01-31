// src/app/api/notifications/push/subscribe/route.ts
// ============================================================
// Push Subscription API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { subscribePush, unsubscribePush, getVapidPublicKey } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * GET /api/notifications/push/subscribe
 * Get VAPID public key for push subscription
 */
export async function GET() {
  try {
    const vapidPublicKey = getVapidPublicKey();

    if (!vapidPublicKey) {
      return NextResponse.json(
        { ok: false, error: "Push notifications not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      vapidPublicKey,
    });
  } catch (error) {
    console.error("[Push Subscribe GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/notifications/push/subscribe
 * Subscribe device for push notifications
 * Body: { subscription: { endpoint, keys: { p256dh, auth } }, deviceName? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscription, deviceName } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { ok: false, error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    const subscriptionId = await subscribePush(
      auth.id,
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      userAgent,
      deviceName
    );

    return NextResponse.json({
      ok: true,
      subscriptionId,
    });
  } catch (error) {
    console.error("[Push Subscribe POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/push/subscribe
 * Unsubscribe device from push notifications
 * Body: { endpoint }
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ ok: false, error: "Endpoint required" }, { status: 400 });
    }

    const success = await unsubscribePush(endpoint);

    return NextResponse.json({ ok: success });
  } catch (error) {
    console.error("[Push Subscribe DELETE]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
