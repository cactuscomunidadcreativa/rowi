// src/core/auth/config.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/core/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    /* 🌐 Google Login */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // SECURITY: Disabled dangerous email linking to prevent account takeover
      // If a user signs up with email/password, then tries Google OAuth with same email,
      // this would allow automatic account linking without verification
      allowDangerousEmailAccountLinking: false,
    }),

    /* 🌐 Facebook Login */
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],

  /* ==========================================================
     🚀 JWT STRATEGY — requerido por RowiVerse (policies + middleware)
  ========================================================== */
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/hub/login",
  },

  callbacks: {
    /* ==========================================================
       1) JWT — Cargar datos críticos en el token (solo primer login)
    ========================================================== */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            permissions: true,  // 🟢 userPermission[]
            memberships: true,  // 🟢 tenant/org/hub memberships
          },
        });

        token.primaryTenantId = dbUser?.primaryTenantId ?? null;

        token.permissions = dbUser?.permissions ?? [];
        token.memberships = dbUser?.memberships ?? [];

        token.allowAI = dbUser?.allowAI ?? true;
      }

      return token;
    },

    /* ==========================================================
       2) SESSION — Exponer permisos y roles al cliente + SSR
    ========================================================== */
    async session({ session, token }) {
      if (token?.id && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).email = token.email ?? null;

        (session.user as any).primaryTenantId = token.primaryTenantId ?? null;

        (session.user as any).permissions = token.permissions ?? [];
        (session.user as any).memberships = token.memberships ?? [];

        (session.user as any).allowAI = token.allowAI ?? true;

        // 🔥 SUPERADMIN (RowiVerse Root) — case-insensitive, acepta cualquier scopeId de rowiverse
        const permissions = (token.permissions || []) as any[];
        (session.user as any).isSuperAdmin = permissions.some(
          (p: any) =>
            p.role?.toLowerCase() === "superadmin" &&
            p.scopeType === "rowiverse"
        );
      }

      return session;
    },
  },
};