export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { secureLog } from "@/lib/logging";

/**
 * GDPR Art. 17 — Right to erasure (self-service).
 *
 * DELETE /api/account/delete  body: { confirmEmail }
 *
 * Borra la cuenta del usuario autenticado. Anti-accidente: exige que el usuario
 * reescriba su propio email en `confirmEmail`. El borrado del User dispara los
 * cascades del schema (mismo camino que usa el panel admin, ya probado).
 *
 * Lo que sobrevive: las contribuciones ya AGREGADAS y anonimizadas a benchmarks
 * (no son recuperables a nivel individual, así que no son dato personal) — se le
 * advierte al usuario en la UI. La auditoría de accesos (append-only) se
 * conserva por obligación legal de trazabilidad.
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { confirmEmail?: string };
    const confirmEmail = (body.confirmEmail || "").trim().toLowerCase();

    if (!confirmEmail || confirmEmail !== email) {
      // Exigir que reescriba su email evita borrados accidentales.
      return NextResponse.json(
        { ok: false, error: "confirm_email_mismatch" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: user.id } });

    secureLog.info(`[account-delete] GDPR Art.17 erasure user=${user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[account-delete] failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
