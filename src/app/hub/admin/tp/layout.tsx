import { ReactNode } from "react";
import Link from "next/link";
import { Shield, Lock } from "lucide-react";
import { getServerAuthUser } from "@/core/auth";

/**
 * Server-side gate for the Teleperformance demo. The previous gate was a
 * client component that checked `session.user.email` in JS — trivial to
 * bypass by editing the bundle or stubbing useSession. This version reads
 * the session on the server before the children ever render.
 *
 * Authorized callers:
 *   - SuperAdmins (Eduardo and any other rowiverse-scoped superadmin)
 *   - Anyone with @6seconds.org email
 *   - Anyone with @cactuscomunidadcreativa.com email
 */
export default async function TPLayout({ children }: { children: ReactNode }) {
  const user = await getServerAuthUser();
  const email = (user?.email || "").toLowerCase();
  const isAuthorized =
    !!user?.isSuperAdmin ||
    email.endsWith("@6seconds.org") ||
    email.endsWith("@cactuscomunidadcreativa.com");

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Access Restricted</h2>
          <p className="text-[var(--rowi-muted)] mb-2">
            The Teleperformance Benchmark Demo is reserved for authorized Six
            Seconds partners.
          </p>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">
            Current email:{" "}
            <span className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
              {email || "not signed in"}
            </span>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--rowi-muted)] mb-6">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Required: @6seconds.org email or SuperAdmin</span>
          </div>
          <Link
            href="/hub/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
