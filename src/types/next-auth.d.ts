// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Tenant the user identified as primary at sign-in. */
      primaryTenantId?: string | null;
      /** Aggregated roles from memberships + permissions. */
      roles?: string[];
      /** Whether the user's plan enables AI features (derived in jwt callback). */
      planAiEnabled?: boolean;
      /** Org-level role flag (SUPERADMIN / ADMIN / VIEWER). */
      organizationRole?: string | null;
      /** Set by the session callback when isSuperAdmin derivation runs. */
      isSuperAdmin?: boolean;
    };
  }
}