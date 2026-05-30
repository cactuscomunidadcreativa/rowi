// apps/rowi/src/app/api/alerts/route.ts
import { NextResponse } from "next/server";
import { emitAlert } from "@/lib/kernel/alerts.service";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export async function POST(req: Request) {
  // 🔐 Emitir alertas con tenant/hub/user del body permite spoofing/spam:
  // solo admins, y el tenant destino debe estar en su scope.
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();

  const allowedTenantIds = await tenantIdsForScope(auth.scope);
  if (allowedTenantIds !== null && body.tenantId && !allowedTenantIds.includes(body.tenantId)) {
    return NextResponse.json({ ok: false, error: "No autorizado para este tenant" }, { status: 403 });
  }

  const alert = await emitAlert({
    tenantId: body.tenantId,
    hubId: body.hubId,
    userId: body.userId,
    type: body.type ?? "system",
    title: body.title,
    message: body.message,
    severity: body.severity,
    emotionTag: body.emotionTag,
    metadata: body.metadata,
  });
  return NextResponse.json({ ok: true, alert });
}