/**
 * POST /api/account/finalize-oauth
 * Finaliza el setup de un usuario que se registró vía OAuth (Google/Facebook).
 * Aplica plan elegido, idioma, país y otros datos guardados antes del redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { mapSourceToEnum } from "@/lib/acquisition/source";
import { claimPreSeiSession } from "@/lib/pre-sei/claim";
import { claimRelationshipInvite } from "@/lib/relationships/claimInvite";
import { telemetry } from "@/lib/telemetry";
import { trackFunnel } from "@/domains/metrics/lib/funnel";

export const runtime = "nodejs";

interface FinalizeBody {
  planSlug?: string;
  language?: string;
  country?: string;
  wantsSei?: boolean;
  referralCode?: string;
  // Atribución preservada a través del redirect de OAuth.
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  // Pre-SEI: diagnóstico anónimo hecho antes de registrarse vía OAuth.
  preSeiToken?: string;
  intent?: string;
  // Invitación relacional: token de /r/[token] para vincular la díada.
  relToken?: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: FinalizeBody = await req.json().catch(() => ({}));
    const {
      planSlug,
      language,
      country,
      referralCode,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      preSeiToken,
      relToken,
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        planId: true,
        language: true,
        country: true,
        onboardingStatus: true,
        trialEndsAt: true,
        termsAcceptedAt: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 },
      );
    }

    // ¿Es una finalización de registro nueva? (aún no activado). Gatea el evento
    // de embudo "registered" para no contar logins OAuth de usuarios ya activos.
    const isFreshRegistration = user.onboardingStatus !== "ACTIVE";

    // Resolver plan (solo si el usuario no tiene plan asignado todavía)
    let planId = user.planId;
    let onboardingStatus = user.onboardingStatus;
    let trialEndsAt = user.trialEndsAt;

    // Solo se asignan aquí planes GRATUITOS. Un plan de pago jamás se otorga
    // sin checkout: el usuario queda en free y elige/paga el plan después en
    // /pricing (antes esto asignaba el plan pago + PAYMENT_PENDING sin cobrar,
    // y el paso "payment" al que redirigía el cliente no existía).
    let desiredPlanSlug: string | null = null;
    if (!planId && planSlug) {
      const plan = await prisma.plan.findFirst({
        where: { slug: planSlug, isActive: true },
        select: { id: true, priceCents: true, trialDays: true },
      });
      if (plan) {
        if (plan.priceCents > 0) {
          desiredPlanSlug = planSlug;
        } else {
          planId = plan.id;
          if (plan.trialDays > 0) {
            trialEndsAt = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000);
          }
        }
      }
    }

    // Resolver referrer si corresponde
    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { OR: [{ id: referralCode }, { email: referralCode }] },
        select: { id: true },
      });
      referredBy = referrer?.id ?? null;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        planId: planId ?? undefined,
        language: language ?? user.language ?? "es",
        country: country ?? user.country ?? "Unknown",
        onboardingStatus,
        trialStartedAt: trialEndsAt && !user.trialEndsAt ? new Date() : undefined,
        trialEndsAt,
        // El registro OAuth también pasa por la página con el aviso de
        // términos enlazado; se registra la aceptación una sola vez.
        termsAcceptedAt: user.termsAcceptedAt ?? new Date(),
        ...(referredBy ? { referredBy } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingStatus: true,
        planId: true,
      },
    });

    // Atribución de adquisición para usuarios OAuth (antes no se registraba).
    // Upsert idempotente por userId; solo escribe la fuente en la creación —
    // un re-finalize no debe pisar la atribución original.
    const mappedSource = mapSourceToEnum(source);
    await prisma.userAcquisition.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        source: mappedSource
          ? mappedSource
          : referredBy
          ? "REFERRAL"
          : utmSource
          ? "PAID_SEARCH"
          : "ORGANIC",
        channel: source || utmSource || null,
        referredBy: referredBy ?? null,
        referralCode: referralCode || null,
        utmSource: utmSource ?? null,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
      },
    });

    // Pre-SEI: si el usuario hizo el diagnóstico anónimo antes del OAuth,
    // reclamar la sesión (materializa EqSnapshot + señales). No crítico.
    if (preSeiToken) {
      try {
        await claimPreSeiSession(preSeiToken, user.id);
      } catch (claimErr) {
        telemetry.captureException(claimErr, { route: "/api/account/finalize-oauth", op: "claim_pre_sei", fatal: false });
      }
    }

    // Invitación relacional: vincular la díada si el OAuth nació en /r/[token].
    if (relToken) {
      await claimRelationshipInvite(relToken, user.id);
    }

    // Embudo de activación: cuenta creada vía OAuth (solo registros nuevos).
    if (isFreshRegistration) {
      await trackFunnel("registered", { userId: user.id, req, details: { provider: "oauth" } });
    }

    return NextResponse.json({
      ok: true,
      user: updated,
      // El plan de pago deseado se devuelve para que el cliente pueda llevar
      // al usuario a /pricing tras el onboarding; nunca se asigna sin pago.
      desiredPlanSlug,
      nextStep: "onboarding",
    });
  } catch (err) {
    telemetry.captureException(err, { route: "/api/account/finalize-oauth" });
    return NextResponse.json(
      { ok: false, error: "finalize_failed" },
      { status: 500 },
    );
  }
}
