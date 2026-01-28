import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function PATCH(req: Request, { params }: any) {
  try {
    const { hubId } = params;
    const body = await req.json();

    const { superHubId } = body;

    const updated = await prisma.hub.update({
      where: { id: hubId },
      data: { superHubId },
      include: {
        superHub: true,
      },
    });

    return NextResponse.json({ ok: true, hub: updated });
  } catch (err: any) {
    console.error("❌ Error updating superhub:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}