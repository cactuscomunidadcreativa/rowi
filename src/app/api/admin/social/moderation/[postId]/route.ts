import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export const preferredRegion = "iad1";

/**
 * DELETE /api/admin/social/moderation/[postId]
 *
 * Scope-aware: the admin can delete a post only if the post's community
 * belongs to a tenant the admin can reach. Rowiverse admins can delete
 * anything.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ postId: string }> },
) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const { postId } = await ctx.params;
  if (!postId) {
    return NextResponse.json(
      { ok: false, error: "Missing postId" },
      { status: 400 },
    );
  }

  try {
    const post = await prisma.rowiCommunityPost.findUnique({
      where: { id: postId },
      select: { community: { select: { tenantId: true } } },
    });
    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post no encontrado" },
        { status: 404 },
      );
    }

    const allowed = await tenantIdsForScope(auth.scope);
    if (allowed !== null) {
      const tenantId = post.community?.tenantId;
      if (!tenantId || !allowed.includes(tenantId)) {
        return NextResponse.json(
          { ok: false, error: "Post fuera de tu scope" },
          { status: 403 },
        );
      }
    }

    await prisma.rowiCommunityPost.delete({ where: { id: postId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/social/moderation DELETE] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
