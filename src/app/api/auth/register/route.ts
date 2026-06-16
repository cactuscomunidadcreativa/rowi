/**
 * 🚀 API: User Registration
 * POST /api/auth/register - Registrar nuevo usuario
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/core/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import { getServerAppBaseUrl } from "@/core/utils/base-url";
import { claimPreSeiSession } from "@/lib/pre-sei/claim";
import { claimRelationshipInvite } from "@/lib/relationships/claimInvite";
import { mapSourceToEnum } from "@/lib/acquisition/source";
import { rateLimiters } from "@/lib/security/rateLimit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { telemetry } from "@/lib/telemetry";
import { trackFunnel } from "@/domains/metrics/lib/funnel";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  planId?: string;
  /** Slug del plan elegido en el wizard (la UI envía slug, no id). */
  planSlug?: string;
  language?: string;
  country?: string;
  // Referral & UTM
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  // Canal de adquisición libre (?source=...): rel_invite, coach_invite,
  // eco_general, register, etc. Se mapea al enum AcquisitionSource y se
  // conserva el valor crudo en UserAcquisition.channel.
  source?: string;
  // Pre-SEI: token de la sesión anónima a reclamar tras crear la cuenta.
  preSeiToken?: string;
  // Invitación relacional: token de /r/[token] para vincular la díada.
  relToken?: string;
  // Cloudflare Turnstile (captcha). Se verifica solo si está configurado.
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const {
      email,
      password,
      name,
      planId,
      planSlug,
      language = "es",
      country,
      referralCode,
      utmSource,
      utmMedium,
      utmCampaign,
      source,
    } = body;

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: "email_password_required" },
        { status: 400 }
      );
    }

    // 🛡️ Rate limit anti-abuso: frena registro masivo automatizado.
    // Por IP: 5 cuentas / 5 min. Con Upstash es distribuido entre instancias;
    // sin credenciales cae a in-memory (fail-open).
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimiters.authStrict(`register:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)),
            ),
          },
        },
      );
    }

    // 🛡️ Captcha (Cloudflare Turnstile). Omitido si no está configurado.
    const captcha = await verifyTurnstile(body.turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.error || "captcha_failed" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password_too_short" },
        { status: 400 }
      );
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 12);

    /* =========================================================
       🔓 CLAIM: Si el usuario fue importado via CSV (sin credentials),
       permitir que "reclame" su cuenta seteando password.
       Preserva todos los datos importados (EQ, membresías, etc.)
    ========================================================= */
    if (existingUser) {
      // Verificar si ya tiene cuenta de credentials (ya se registró)
      const existingCredentials = await prisma.account.findFirst({
        where: { userId: existingUser.id, provider: "credentials" },
      });

      if (existingCredentials) {
        // Ya tiene password → rechazar registro duplicado
        return NextResponse.json(
          { error: "email_already_exists" },
          { status: 409 }
        );
      }

      // No tiene credentials → fue importado via CSV, permitir claim
      const claimedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name || existingUser.name,
          language: language || existingUser.language || "es",
          country: country || existingUser.country || "Unknown",
          onboardingStatus: existingUser.onboardingStatus || "REGISTERED",
          // 🔐 Hash en campo dedicado (no más Account.access_token)
          passwordHash: hashedPassword,
        },
      });

      // Crear cuenta de credentials para que NextAuth registre el provider.
      // El hash vive en User.passwordHash, no aquí.
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: normalizedEmail,
        },
      });

      // Vincular a RowiVerse/Tenant si no está vinculado
      try {
        if (!existingUser.rowiverseId) {
          const rowiverse = await prisma.rowiVerse.findFirst({ where: { slug: "rowiverse" } });
          if (rowiverse) {
            let rvUser = await prisma.rowiVerseUser.findUnique({ where: { userId: existingUser.id } });
            if (!rvUser) rvUser = await prisma.rowiVerseUser.findUnique({ where: { email: normalizedEmail } });
            if (!rvUser) {
              rvUser = await prisma.rowiVerseUser.create({
                data: {
                  userId: existingUser.id, email: normalizedEmail, name: claimedUser.name,
                  language: claimedUser.language || "es", rowiVerseId: rowiverse.id,
                  verified: false, active: true, status: "pending",
                },
              });
            }
            await prisma.user.update({ where: { id: existingUser.id }, data: { rowiverseId: rvUser.id } });
          }
        }

        if (!existingUser.primaryTenantId) {
          const rowiTenant = await prisma.tenant.findFirst({
            where: { OR: [{ slug: "rowi-global" }, { slug: "rowi-community" }] },
          });
          if (rowiTenant) {
            const existingMembership = await prisma.membership.findFirst({
              where: { userId: existingUser.id, tenantId: rowiTenant.id },
            });
            if (!existingMembership) {
              await prisma.membership.create({
                data: { userId: existingUser.id, tenantId: rowiTenant.id, role: "VIEWER" },
              });
            }
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { primaryTenantId: rowiTenant.id },
            });
          }
        }
      } catch (rvError) {
        telemetry.captureException(rvError, { route: "/api/auth/register", op: "claim_link_rowiverse", fatal: false });
      }

      console.log(`✅ Cuenta reclamada: ${normalizedEmail} (importada → registrada)`);

      return NextResponse.json({
        ok: true,
        claimed: true,
        user: {
          id: claimedUser.id,
          email: claimedUser.email,
          name: claimedUser.name,
          onboardingStatus: claimedUser.onboardingStatus,
          planId: claimedUser.planId,
          trialEndsAt: claimedUser.trialEndsAt,
        },
        nextStep: "onboarding",
      });
    }

    // Determinar plan inicial. La UI envía planSlug (el wizard); planId queda
    // por compatibilidad. Regla: aquí solo se asignan planes GRATUITOS — un
    // plan de pago jamás se otorga sin checkout (antes esto creaba usuarios
    // PAYMENT_PENDING con el plan pago ya puesto y sin cobro).
    let selectedPlanId: string | undefined;
    const onboardingStatus: "REGISTERED" | "PAYMENT_PENDING" = "REGISTERED";
    let trialEndsAt: Date | null = null;

    const requestedPlan = planSlug
      ? await prisma.plan.findFirst({ where: { slug: planSlug, isActive: true } })
      : planId
      ? await prisma.plan.findUnique({ where: { id: planId } })
      : null;

    if (requestedPlan && requestedPlan.priceCents === 0) {
      selectedPlanId = requestedPlan.id;
      if (requestedPlan.trialDays > 0) {
        trialEndsAt = new Date(
          Date.now() + requestedPlan.trialDays * 24 * 60 * 60 * 1000
        );
      }
    } else {
      // Buscar plan free por defecto
      const freePlan = await prisma.plan.findFirst({
        where: {
          OR: [
            { slug: "free-trial" },
            { slug: "free" },
            { priceCents: 0, isActive: true },
          ],
        },
      });
      selectedPlanId = freePlan?.id;

      if (freePlan?.trialDays && freePlan.trialDays > 0) {
        trialEndsAt = new Date(
          Date.now() + freePlan.trialDays * 24 * 60 * 60 * 1000
        );
      }
    }

    // Buscar referente si hay código
    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({
        where: {
          OR: [{ id: referralCode }, { email: referralCode }],
        },
      });
      referredBy = referrer?.id || null;
    }

    // Crear usuario con password hasheado
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        language,
        country: country || "Unknown",
        planId: selectedPlanId,
        onboardingStatus,
        onboardingStep: 0,
        trialStartedAt: trialEndsAt ? new Date() : null,
        trialEndsAt,
        // El form de registro muestra el aviso con links a /legal/terms y
        // /legal/privacy; crear la cuenta = aceptación (con timestamp).
        termsAcceptedAt: new Date(),
        // Opt-in real: la contribución al Rowiverse nace APAGADA y solo se
        // enciende con el consentimiento benchmarking_contribution del
        // onboarding (promesa de /legal/research). Antes nacía en true.
        contributeToRowiverse: false,
        organizationRole: "VIEWER", // Rol por defecto
        // 🔐 Hash en campo dedicado (no más Account.access_token)
        passwordHash: hashedPassword,
      },
    });

    // Pre-SEI: si el usuario hizo el diagnóstico anónimo, reclamar la sesión
    // (materializa EqSnapshot + señales). No crítico: un fallo aquí no debe
    // romper el registro.
    if (body.preSeiToken) {
      try {
        await claimPreSeiSession(body.preSeiToken, user.id);
      } catch (claimErr) {
        telemetry.captureException(claimErr, { route: "/api/auth/register", op: "claim_pre_sei", fatal: false });
      }
    }

    // Invitación relacional: si el invitado se registra desde /r/[token],
    // vincular la díada (dyad.otherUserId) — el eslabón del efecto red.
    if (body.relToken) {
      await claimRelationshipInvite(body.relToken, user.id);
    }

    // Crear registro de adquisición.
    // Prioridad del enum source: ?source= explícito > referido > UTM > orgánico.
    // El canal crudo (rel_invite, coach_invite, ...) se conserva en `channel`
    // aunque el enum lo agrupe, para no perder la atribución fina del ad/invite.
    const mappedSource = mapSourceToEnum(source);
    await prisma.userAcquisition.create({
      data: {
        userId: user.id,
        source: mappedSource
          ? mappedSource
          : referredBy
          ? "REFERRAL"
          : utmSource
          ? "PAID_SEARCH"
          : "ORGANIC",
        channel: source || utmSource || null,
        referredBy,
        referralCode: referralCode || null,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });

    // Crear cuenta de credentials para que NextAuth registre el provider.
    // El hash vive en User.passwordHash, no aquí.
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: normalizedEmail,
      },
    });

    // =========================================================
    // 🌐 Auto-vincular a RowiVerse (comunidad global)
    // =========================================================
    try {
      // Buscar el RowiVerse principal
      const rowiverse = await prisma.rowiVerse.findFirst({
        where: { slug: "rowiverse" },
      });

      if (rowiverse) {
        // Crear RowiVerseUser (identidad global)
        const rowiverseUser = await prisma.rowiVerseUser.create({
          data: {
            email: normalizedEmail,
            name: name || null,
            country: country || "NONE",
            language,
            verified: false,
            active: true,
            rowiVerseId: rowiverse.id,
            userId: user.id,
          },
        });

        // Vincular usuario con RowiVerseUser
        await prisma.user.update({
          where: { id: user.id },
          data: { rowiverseId: rowiverseUser.id },
        });

        console.log(`✅ Usuario ${normalizedEmail} vinculado a RowiVerse`);
      }

      // Buscar tenant GLOBAL de Rowi para dar acceso básico a usuarios públicos
      // (NO Six Seconds, que es un cliente específico)
      const rowiTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { slug: "rowi-global" },      // Tenant global de Rowi
            { slug: "rowi-community" },   // Alternativa
          ]
        },
      });

      if (rowiTenant && !user.primaryTenantId) {
        // Crear membership al tenant principal
        await prisma.membership.create({
          data: {
            userId: user.id,
            tenantId: rowiTenant.id,
            role: "VIEWER",
          },
        });

        // Asignar como primaryTenant
        await prisma.user.update({
          where: { id: user.id },
          data: { primaryTenantId: rowiTenant.id },
        });

        console.log(`✅ Usuario ${normalizedEmail} vinculado a tenant ${rowiTenant.slug}`);
      }
    } catch (rvError) {
      // No fallar el registro si hay error vinculando a RowiVerse
      telemetry.captureException(rvError, { route: "/api/auth/register", op: "link_rowiverse", fatal: false });
    }

    // Verification email (no bloqueante — si falla, el usuario puede pedir
    // un reenvío más tarde desde /verify-email).
    try {
      const verifyToken = crypto.randomBytes(24).toString("hex");
      const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          email: user.email,
          token: verifyToken,
          expiresAt: verifyExpiresAt,
        },
      });
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl: `${getServerAppBaseUrl(req)}/verify-email?token=${encodeURIComponent(verifyToken)}`,
        locale: language,
      });
    } catch (verifyErr) {
      telemetry.captureException(verifyErr, { route: "/api/auth/register", op: "send_verification_email", fatal: false });
    }

    // Welcome email — independiente del verification email. Va siempre.
    try {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
        appUrl: `${getServerAppBaseUrl(req)}/hub`,
        locale: language,
      });
    } catch (welcomeErr) {
      telemetry.captureException(welcomeErr, { route: "/api/auth/register", op: "send_welcome_email", fatal: false });
    }

    // Embudo de activación: cuenta creada (inicio del flujo Registro→Today).
    await trackFunnel("registered", { userId: user.id, req, details: { provider: "credentials" } });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingStatus: user.onboardingStatus,
        planId: user.planId,
        trialEndsAt: user.trialEndsAt,
      },
      // Si pidió un plan de pago, el cliente lo resuelve en /pricing después
      // de activarse — nunca se asigna sin pago.
      desiredPlanSlug:
        requestedPlan && requestedPlan.priceCents > 0 ? requestedPlan.slug : null,
      nextStep: "onboarding",
    });
  } catch (error) {
    telemetry.captureException(error, { route: "/api/auth/register" });
    return NextResponse.json(
      { error: "registration_failed" },
      { status: 500 }
    );
  }
}
