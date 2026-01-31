// src/app/api/notifications/preferences/route.ts
// ============================================================
// Notification Preferences API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get or create preferences
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: auth.id },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId: auth.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      preferences: {
        emailEnabled: prefs.emailEnabled,
        pushEnabled: prefs.pushEnabled,
        smsEnabled: prefs.smsEnabled,
        whatsappEnabled: prefs.whatsappEnabled,
        slackEnabled: prefs.slackEnabled,
        teamsEnabled: prefs.teamsEnabled,
        typePreferences: prefs.typePreferences,
        quietHoursEnabled: prefs.quietHoursEnabled,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        timezone: prefs.timezone,
        digestEnabled: prefs.digestEnabled,
        digestFrequency: prefs.digestFrequency,
        digestTime: prefs.digestTime,
        phoneNumber: prefs.phoneNumber ? maskPhone(prefs.phoneNumber) : null,
        phoneVerified: prefs.phoneVerified,
        whatsappNumber: prefs.whatsappNumber ? maskPhone(prefs.whatsappNumber) : null,
        whatsappVerified: prefs.whatsappVerified,
        slackConnected: !!prefs.slackWebhookUrl,
        teamsConnected: !!prefs.teamsWebhookUrl,
      },
    });
  } catch (error) {
    console.error("[Preferences GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      emailEnabled,
      pushEnabled,
      smsEnabled,
      whatsappEnabled,
      slackEnabled,
      teamsEnabled,
      typePreferences,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      timezone,
      digestEnabled,
      digestFrequency,
      digestTime,
      phoneNumber,
      whatsappNumber,
      slackWebhookUrl,
      teamsWebhookUrl,
    } = body;

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;
    if (pushEnabled !== undefined) updateData.pushEnabled = pushEnabled;
    if (smsEnabled !== undefined) updateData.smsEnabled = smsEnabled;
    if (whatsappEnabled !== undefined) updateData.whatsappEnabled = whatsappEnabled;
    if (slackEnabled !== undefined) updateData.slackEnabled = slackEnabled;
    if (teamsEnabled !== undefined) updateData.teamsEnabled = teamsEnabled;
    if (typePreferences !== undefined) updateData.typePreferences = typePreferences;
    if (quietHoursEnabled !== undefined) updateData.quietHoursEnabled = quietHoursEnabled;
    if (quietHoursStart !== undefined) updateData.quietHoursStart = quietHoursStart;
    if (quietHoursEnd !== undefined) updateData.quietHoursEnd = quietHoursEnd;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (digestEnabled !== undefined) updateData.digestEnabled = digestEnabled;
    if (digestFrequency !== undefined) updateData.digestFrequency = digestFrequency;
    if (digestTime !== undefined) updateData.digestTime = digestTime;

    // Phone numbers require verification
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber;
      updateData.phoneVerified = false; // Reset verification
    }
    if (whatsappNumber !== undefined) {
      updateData.whatsappNumber = whatsappNumber;
      updateData.whatsappVerified = false; // Reset verification
    }

    // Webhooks
    if (slackWebhookUrl !== undefined) updateData.slackWebhookUrl = slackWebhookUrl;
    if (teamsWebhookUrl !== undefined) updateData.teamsWebhookUrl = teamsWebhookUrl;

    // Upsert preferences
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: auth.id },
      update: updateData,
      create: {
        userId: auth.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      ok: true,
      preferences: {
        emailEnabled: prefs.emailEnabled,
        pushEnabled: prefs.pushEnabled,
        smsEnabled: prefs.smsEnabled,
        whatsappEnabled: prefs.whatsappEnabled,
        slackEnabled: prefs.slackEnabled,
        teamsEnabled: prefs.teamsEnabled,
        typePreferences: prefs.typePreferences,
        quietHoursEnabled: prefs.quietHoursEnabled,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        timezone: prefs.timezone,
        digestEnabled: prefs.digestEnabled,
        digestFrequency: prefs.digestFrequency,
        digestTime: prefs.digestTime,
        phoneNumber: prefs.phoneNumber ? maskPhone(prefs.phoneNumber) : null,
        phoneVerified: prefs.phoneVerified,
        whatsappNumber: prefs.whatsappNumber ? maskPhone(prefs.whatsappNumber) : null,
        whatsappVerified: prefs.whatsappVerified,
        slackConnected: !!prefs.slackWebhookUrl,
        teamsConnected: !!prefs.teamsWebhookUrl,
      },
    });
  } catch (error) {
    console.error("[Preferences PUT]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

// Mask phone number for privacy
function maskPhone(phone: string): string {
  if (phone.length < 6) return "****";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}
