import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/core/prisma";
import bcrypt from "bcryptjs";
import { logSecurityEvent } from "@/lib/audit/auditLog";

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

  // Detectar si es SuperAdmin
  const isSuperAdmin =
    user.organizationRole === "SUPERADMIN" ||
    user.permissions?.some(
      (p) => p.role === "superadmin" && (p.scopeType === "rowiverse" || p.scope === "global")
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
      // ⚠️ SEGURIDAD: Deshabilitado para prevenir account takeover
      // Un atacante podría vincular su cuenta Google a cualquier email existente
      allowDangerousEmailAccountLinking: false,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
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

        // Password está guardado en access_token de la cuenta credentials
        const credentialsAccount = user.accounts?.[0];
        const hashedPassword = credentialsAccount?.access_token;

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

    async signIn({ user, account }) {
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

      // Auto-create user for Google OAuth
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });

        if (!existing) {
          await prisma.user.create({
            data: {
              email,
              name: user.name || "Usuario Rowi",
              image: user.image,
              organizationRole: "VIEWER",
            },
          });
        }
      }
      return true;
    },
  },

  pages: { signIn: "/hub/login" },

  // ⚠️ SEGURIDAD: El secret es obligatorio, no usar fallbacks predecibles
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

/* =========================================================
   🚀 HANDLER NextAuth
========================================================= */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };