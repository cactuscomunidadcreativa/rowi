// apps/rowi/src/app/api/webhooks/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * Receptor genérico de webhooks externos.
 *
 * 🔐 SEGURIDAD: este endpoint es público (allowlist del middleware) y está
 * exento de la verificación de Origin/Referer porque lo invocan servicios
 * externos, no el navegador. Por eso DEBE verificar una firma HMAC propia.
 *
 * El emisor firma el cuerpo crudo con WEBHOOK_SECRET (HMAC-SHA256) y envía
 * el resultado en la cabecera `x-rowi-signature` (hex, opcionalmente con el
 * prefijo "sha256="). Sin firma válida → 401. Fail-closed: si no hay secret
 * configurado en el entorno, se rechaza todo (no se persiste nada).
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Fail-closed: sin secret configurado no aceptamos webhooks anónimos.
    console.error("❌ /api/webhooks: WEBHOOK_SECRET no configurado");
    return NextResponse.json(
      { ok: false, error: "Webhook receiver not configured" },
      { status: 503 }
    );
  }

  // Leer el cuerpo CRUDO para firmar exactamente lo que llegó.
  const rawBody = await req.text();

  const headerSig =
    req.headers.get("x-rowi-signature") ||
    req.headers.get("X-Rowi-Signature") ||
    "";
  const provided = headerSig.replace(/^sha256=/i, "").trim();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (!provided || !timingSafeEqualHex(provided, expected)) {
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // BackgroundTask no tiene columnas tenantId / hubId — ese scoping vive
  // dentro del payload Json.
  const created = await prisma.backgroundTask.create({
    data: {
      type: "analysis",
      status: "pending",
      payload: body as object,
    },
  });

  return NextResponse.json({ ok: true, taskId: created.id });
}
