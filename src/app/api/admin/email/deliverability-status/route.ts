/**
 * 📧 GET /api/admin/email/deliverability-status
 * ============================================================
 * Diagnóstico de entregabilidad de email. SuperAdmin-only.
 *
 * Consulta la API de Resend (/domains) y reporta:
 * - Dominios verificados y su estado de SPF / DKIM / DMARC.
 * - El FROM configurado (RESEND_FROM_EMAIL o el default).
 * - Si el dominio del FROM está entre los verificados (clave para
 *   que los correos NO caigan en spam).
 *
 * Detecta el caso típico: FROM en noreply@rowi.app pero el dominio
 * verificado es rowiia.com (o ninguno) → correos a spam.
 * ============================================================
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_FROM = "noreply@rowiia.com";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  // RESEND_* viven en env (los helpers los leen así). Intentamos también
  // SystemConfig por si en el futuro se mueven al admin UI.
  let apiKey = process.env.RESEND_API_KEY || "";
  let fromEmail = process.env.RESEND_FROM_EMAIL || "";
  try {
    const { getSystemConfigs } = await import("@/lib/config/systemConfig");
    const cfg = await getSystemConfigs(["RESEND_API_KEY" as any, "RESEND_FROM_EMAIL" as any]);
    apiKey = apiKey || (cfg as any).RESEND_API_KEY || "";
    fromEmail = fromEmail || (cfg as any).RESEND_FROM_EMAIL || "";
  } catch {
    // SystemConfig no disponible — seguimos con env.
  }

  const effectiveFrom = fromEmail || DEFAULT_FROM;
  const fromDomain = effectiveFrom.includes("@")
    ? effectiveFrom.split("@")[1].toLowerCase()
    : null;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "resend_not_configured",
        message: "No hay RESEND_API_KEY configurada. Los emails no se envían.",
        effectiveFrom,
        usingDefaultFrom: !fromEmail,
      },
      { status: 500 },
    );
  }

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          ok: false,
          error: "resend_api_error",
          status: res.status,
          message: text.slice(0, 300),
        },
        { status: 502 },
      );
    }

    const data = await res.json();
    const domains: any[] = data?.data ?? [];

    const domainSummary = domains.map((d) => ({
      name: d.name,
      status: d.status, // "verified" | "pending" | "not_started" | "failed"
      region: d.region,
      // Resend devuelve records[] con SPF/DKIM/DMARC y su status.
      records: (d.records ?? []).map((r: any) => ({
        type: r.type,
        name: r.name,
        status: r.status,
        record: r.record,
      })),
    }));

    const fromDomainEntry = domainSummary.find(
      (d) => d.name?.toLowerCase() === fromDomain,
    );
    const fromDomainVerified = fromDomainEntry?.status === "verified";

    const verdict = !fromDomainEntry
      ? `⚠️ El dominio del FROM (${fromDomain}) NO está registrado en Resend. Los correos se rechazan o caen en spam. Agregá el dominio en Resend o cambiá RESEND_FROM_EMAIL a un dominio verificado.`
      : fromDomainVerified
        ? `✅ El dominio del FROM (${fromDomain}) está verificado en Resend. La entregabilidad es correcta.`
        : `⚠️ El dominio del FROM (${fromDomain}) está en Resend pero NO verificado (estado: ${fromDomainEntry.status}). Completá los registros DNS (SPF/DKIM) hasta que diga "verified".`;

    return NextResponse.json({
      ok: true,
      verdict,
      effectiveFrom,
      fromDomain,
      usingDefaultFrom: !fromEmail,
      fromDomainVerified,
      verifiedDomains: domainSummary
        .filter((d) => d.status === "verified")
        .map((d) => d.name),
      allDomains: domainSummary,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "fetch_failed",
        message: err?.message || "Error consultando Resend.",
      },
      { status: 502 },
    );
  }
}
