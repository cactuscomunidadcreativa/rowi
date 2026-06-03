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

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  planId?: string;
  language?: string;
  country?: string;
  // Referral & UTM
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const {
      email,
      password,
      name,
      planId,
      language = "es",
      country,
      referralCode,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: "email_password_required" },
        { status: 400 }
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
        console.warn("⚠️ Error vinculando claim a RowiVerse (no crítico):", rvError);
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

    // Determinar plan inicial
    let selectedPlanId = planId;
    let onboardingStatus: "REGISTERED" | "PAYMENT_PENDING" = "REGISTERED";
    let trialEndsAt: Date | null = null;

    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (plan) {
        // Si el plan tiene precio, el usuario necesita pagar
        if (plan.priceCents > 0) {
          onboardingStatus = "PAYMENT_PENDING";
        }

        // Si el plan tiene trial, calcular fecha de fin
        if (plan.trialDays > 0) {
          trialEndsAt = new Date(
            Date.now() + plan.trialDays * 24 * 60 * 60 * 1000
          );
        }
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
        contributeToRowiverse: true,
        organizationRole: "VIEWER", // Rol por defecto
        // 🔐 Hash en campo dedicado (no más Account.access_token)
        passwordHash: hashedPassword,
      },
    });

    // Crear registro de adquisición
    await prisma.userAcquisition.create({
      data: {
        userId: user.id,
        source: referredBy
          ? "REFERRAL"
          : utmSource
          ? "PAID_SEARCH"
          : "ORGANIC",
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
      console.warn("⚠️ Error vinculando a RowiVerse (no crítico):", rvError);
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
      console.warn("⚠️ Error enviando verification email (no crítico):", verifyErr);
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
      console.warn("⚠️ Error enviando welcome email (no crítico):", welcomeErr);
    }

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
      nextStep:
        onboardingStatus === "PAYMENT_PENDING"
          ? "payment"
          : "onboarding",
    });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    return NextResponse.json(
      { error: "registration_failed" },
      { status: 500 }
    );
  }
}
