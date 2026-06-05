import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/core/prisma";
import bcrypt from "bcryptjs";
import { logSecurityEvent } from "@/lib/audit/auditLog";
import { rateLimiters } from "@/lib/security/rateLimit";

/* =========================================================
   🔧 Helper: Cargar perfil MINIMO para JWT
   ---------------------------------------------------------
   IMPORTANTE: Solo guardar datos esenciales para evitar
   que la cookie exceda 4KB. Los datos completos se cargan
   en getServerAuthUser() cuando se necesitan.
========================================================= */
async function loadAuthProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      primaryTenant: { select: { id: true, slug: true, name: true } },
      permissions: { select: { id: true, scope: true, scopeType: true, scopeId: true, role: true } },
      memberships: { select: { id: true, role: true, tenantId: true } },
    },
  });

  if (!user) return null;

  // Solo IDs de hubs y superHubs (los detalles se cargan bajo demanda)
  const hubMemberships = await prisma.hubMembership.findMany({
    where: { userId },
    select: { hubId: true, hub: { select: { superHubId: true } } },
  });

  const hubIds = hubMemberships.map((m) => m.hubId);
  const superHubIds = [...new Set(hubMemberships.map((m) => m.hub?.superHubId).filter(Boolean))];

  // Detectar si es SuperAdmin (case-insensitive)
  const normalizedOrgRole = (user.organizationRole || "").toUpperCase().replace(/[^A-Z]/g, "");
  const isSuperAdmin =
    normalizedOrgRole === "SUPERADMIN" ||
    user.permissions?.some(
      (p) =>
        p.role?.toLowerCase() === "superadmin" &&
        (p.scopeType === "rowiverse" || p.scope === "global")
    );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    organizationRole: user.organizationRole,
    primaryTenantId: user.primaryTenantId,
    primaryTenant: user.primaryTenant,
    allowAI: user.allowAI,
    isSuperAdmin,
    // Solo IDs para mantener la cookie pequena
    hubIds,
    superHubIds,
    // Permisos simplificados
    permissions: user.permissions?.map((p) => ({
      scopeType: p.scopeType,
      scopeId: p.scopeId,
      role: p.role,
    })),
    membershipCount: user.memberships?.length || 0,
  };
}

/* =========================================================
   ⚙️ NEXTAUTH CONFIG
========================================================= */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // SEGURIDAD: Deshabilitado para prevenir account takeover.
      // El linking seguro se maneja en el callback signIn.
      allowDangerousEmailAccountLinking: false,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase();

        // 🛡️ Rate limit de login: frena brute-force / credential stuffing.
        // Por email (siempre disponible) y por IP cuando viene en headers.
        // authStrict = 5 intentos / 5 min. Con Upstash es distribuido; sin
        // credenciales cae a in-memory (fail-open) — comportamiento histórico.
        const fwd =
          (req?.headers as Record<string, string> | undefined)?.[
            "x-forwarded-for"
          ] ?? "";
        const ip = fwd.split(",")[0]?.trim() || "unknown";
        const loginRl = await rateLimiters.authStrict(`login:${ip}:${email}`);
        if (!loginRl.success) {
          logSecurityEvent("LOGIN_FAILED", {
            email,
            reason: "Rate limited",
          }).catch(() => {});
          // NextAuth interpreta el throw como error de credenciales genérico.
          throw new Error("rate_limited");
        }
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            accounts: {
              where: { provider: "credentials" },
              select: { access_token: true },
            },
          },
        });

        if (!user) {
          // 🔐 Log failed login - user not found
          logSecurityEvent("LOGIN_FAILED", {
            email,
            reason: "User not found",
          }).catch(() => {}); // Non-blocking
          return null;
        }

        // 🔐 Password hash: campo dedicado User.passwordHash. Fallback al
        // legacy Account.access_token para usuarios creados antes de la
        // migración. Tras backfill el fallback puede eliminarse.
        const hashedPassword = user.passwordHash || user.accounts?.[0]?.access_token;

        if (!hashedPassword) {
          // Usuario existe pero no tiene cuenta de credentials (solo OAuth)
          logSecurityEvent("LOGIN_FAILED", {
            email,
            reason: "No credentials account",
          }).catch(() => {}); // Non-blocking
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, hashedPassword);
        if (!valid) {
          // 🔐 Log failed login attempt
          logSecurityEvent("LOGIN_FAILED", {
            email,
            reason: "Invalid password",
          }).catch(() => {}); // Non-blocking
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // 🔐 Token expira en 7 días (más corto = más seguro)
    maxAge: 7 * 24 * 60 * 60, // 7 días
    // 🔐 Actualizar el token cada 24 horas (rotation)
    updateAge: 24 * 60 * 60, // 24 horas
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000);

      // 🔐 Nuevo login: cargar perfil completo y establecer timestamps
      if (user) {
        const profile = await loadAuthProfile(user.id as string);
        if (profile) {
          Object.assign(token, profile);
          // Timestamps para rotation
          token.iat = now;
          token.refreshedAt = now;
        }
        return token;
      }

      // 🔐 JWT Rotation: refrescar token cada 24 horas
      // Esto previene que tokens robados sean usados indefinidamente
      const refreshedAt = (token.refreshedAt as number) || now;
      const shouldRefresh = now - refreshedAt > 24 * 60 * 60; // 24 horas

      if (shouldRefresh || trigger === "update") {
        // Recargar datos del usuario para mantenerlos actualizados
        const userId = token.id as string;
        if (userId) {
          try {
            const profile = await loadAuthProfile(userId);
            if (profile) {
              Object.assign(token, profile);
              token.refreshedAt = now;
            }
          } catch (error) {
            console.error("Error refreshing token:", error);
            // En caso de error, mantener token existente
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, {
          id: token.id,
          name: token.name,
          email: token.email,
          image: token.image,
          primaryTenantId: token.primaryTenantId,
          organizationRole: token.organizationRole,
          primaryTenant: token.primaryTenant,
          allowAI: token.allowAI,
          isSuperAdmin: token.isSuperAdmin,
          // Solo IDs - los detalles se cargan bajo demanda
          hubIds: token.hubIds,
          superHubIds: token.superHubIds,
          permissions: token.permissions,
        });
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Handle OAuth providers (Google, etc.)
      if (account?.provider && account.provider !== "credentials" && user.email) {
        const email = user.email.toLowerCase();
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true }
        });

        if (existingUser) {
          // Check if this OAuth account is already linked
          const existingAccount = existingUser.accounts.find(
            (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
          );

          if (!existingAccount) {
            // 🔐 SEGURIDAD: Solo enlazar una cuenta OAuth nueva a un usuario
            // existente si el proveedor confirma que el email está verificado.
            // Sin esto, un atacante con un proveedor OAuth que no verifica
            // emails podría reclamar el email de otra persona y secuestrar su
            // cuenta (account takeover). Si el proveedor no entrega el flag,
            // asumimos NO verificado y rechazamos el linking automático.
            const emailVerified =
              (profile as { email_verified?: boolean })?.email_verified === true;

            if (!emailVerified) {
              await logSecurityEvent("ACCOUNT_LINK_BLOCKED", {
                userId: existingUser.id,
                email,
                reason: `Blocked ${account.provider} auto-link: email not verified by provider`,
              }).catch(() => {});
              // Rechazar el sign-in: el usuario debe iniciar sesión con su
              // método original y vincular OAuth desde ajustes de cuenta.
              return false;
            }

            // Link the OAuth account to the existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            // Log the account linking
            await logSecurityEvent("ACCOUNT_LINKED", {
              userId: existingUser.id,
              email,
              reason: `Linked ${account.provider} account`,
            }).catch(() => {});
          }

          // Update user info from OAuth provider if needed
          if (!existingUser.image && (user.image || (profile as { picture?: string })?.picture)) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image: user.image || (profile as { picture?: string })?.picture },
            });
          }

          // Set the user id for the session
          user.id = existingUser.id;
        } else {
          // Create new user for OAuth
          const newUser = await prisma.user.create({
            data: {
              email,
              name: user.name || "Usuario Rowi",
              image: user.image || (profile as { picture?: string })?.picture,
              organizationRole: "VIEWER",
            },
          });

          // Link the OAuth account
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });

          user.id = newUser.id;
        }
      }

      // 🔐 Log successful login
      try {
        await logSecurityEvent("LOGIN_SUCCESS", {
          userId: user.id as string,
          email: user.email || undefined,
          reason: `Login via ${account?.provider || "credentials"}`,
        });
      } catch {
        // Non-blocking logging
      }

      return true;
    },
  },

  pages: {
    signIn: "/hub/login",
    // El callbackUrl se maneja en el frontend basado en el rol
  },

  // ⚠️ SEGURIDAD: El secret es obligatorio, no usar fallbacks predecibles
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

/* =========================================================
   🚀 HANDLER NextAuth
========================================================= */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };