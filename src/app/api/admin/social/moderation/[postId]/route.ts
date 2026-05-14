import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ postId: string }> },
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { postId } = await ctx.params;
  if (!postId) {
    return NextResponse.json(
      { ok: false, error: "Missing postId" },
      { status: 400 },
    );
  }

  try {
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
