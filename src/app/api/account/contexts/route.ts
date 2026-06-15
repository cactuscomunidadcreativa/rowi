// src/app/api/account/contexts/route.ts
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getServerAuthUser } from "@/core/auth";
import { getActiveContexts } from "@/lib/account/contexts";
import { telemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

/**
 * Cache POR USUARIO. getActiveContexts pega ~8 queries a Neon en cada
 * page-load; cacheamos 30s por userId para aliviar el pooler sin servir los
 * contextos de un usuario a otro (la key incluye el userId, NUNCA global).
 * TTL corto: cambiar de hat se refleja casi al instante.
 */
const cachedContexts = (userId: string) =>
  unstable_cache(
    () => getActiveContexts(userId),
    ["account-contexts", userId],
    { revalidate: 30, tags: [`contexts:${userId}`] },
  )();

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "No autenticado", contexts: [] },
        { status: 401 },
      );
    }

    const contexts = await cachedContexts(auth.id);

    return NextResponse.json({
      ok: true,
      userId: auth.id,
      contexts,
    });
  } catch (err: any) {
    telemetry.captureException(err, { route: "/api/account/contexts", op: "GET" });
    return NextResponse.json(
      { ok: false, error: "Error interno", contexts: [] },
      { status: 500 },
    );
  }
}
