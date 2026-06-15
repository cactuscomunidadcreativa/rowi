export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { CONSENTS, type ConsentKey } from "@/lib/privacy/consents";
import { telemetry } from "@/lib/telemetry";
import crypto from "crypto";

function hashConsentText(esBody: string, enBody: string, version: number): string {
  return crypto
    .createHash("sha256")
    .update(`${version}::${esBody}::${enBody}`)
    .digest("hex");
}

export async function GET(req: NextRequest) {
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

    const latest = await prisma.userConsent.findMany({
      where: { userId: user.id },
      orderBy: { grantedAt: "desc" },
    });

    const stateByKey = new Map<string, { granted: boolean; version: number; grantedAt: Date; revokedAt: Date | null }>();
    for (const c of latest) {
      if (!stateByKey.has(c.consentKey)) {
        stateByKey.set(c.consentKey, {
          granted: c.granted && c.revokedAt === null,
          version: c.version,
          grantedAt: c.grantedAt,
          revokedAt: c.revokedAt,
        });
      }
    }

    const consents = CONSENTS.map((descriptor) => {
      const state = stateByKey.get(descriptor.key);
      return {
        ...descriptor,
        granted: state?.granted ?? false,
        currentVersion: state?.version ?? 0,
        needsRefresh: state ? state.version < descriptor.version : true,
        grantedAt: state?.grantedAt ?? null,
        revokedAt: state?.revokedAt ?? null,
      };
    });

    return NextResponse.json({ ok: true, consents });
  } catch (e: unknown) {
    telemetry.captureException(e, { route: "/api/account/consent", op: "GET" });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { consentKey, granted, locale } = body as {
      consentKey: ConsentKey;
      granted: boolean;
      locale?: string;
    };

    const descriptor = CONSENTS.find((c) => c.key === consentKey);
    if (!descriptor) {
      return NextResponse.json({ ok: false, error: "Unknown consent key" }, { status: 400 });
    }

    if (descriptor.required && !granted) {
      return NextResponse.json(
        { ok: false, error: "This consent is required to use the product" },
        { status: 400 },
      );
    }

    const textHash = hashConsentText(descriptor.esBody, descriptor.enBody, descriptor.version);
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;

    if (granted) {
      await prisma.userConsent.create({
        data: {
          userId: user.id,
          consentKey,
          version: descriptor.version,
          granted: true,
          textHash,
          locale: locale ?? null,
          ipAddress,
          userAgent,
        },
      });
    } else {
      await prisma.userConsent.updateMany({
        where: { userId: user.id, consentKey, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, consentKey, granted });
  } catch (e: unknown) {
    telemetry.captureException(e, { route: "/api/account/consent", op: "POST" });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
