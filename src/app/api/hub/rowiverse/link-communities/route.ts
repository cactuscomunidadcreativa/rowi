import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const verse = await prisma.rowiVerse.findFirst();
    if (!verse) return NextResponse.json({ error: "❌ No existe RowiVerse Global" });

    const result = await prisma.rowiCommunity.updateMany({
      data: { rowiVerseId: verse.id },
    });

    return NextResponse.json({
      ok: true,
      message: `✅ ${result.count} comunidades vinculadas al RowiVerse Global.`,
    });
  } catch (err: any) {
    console.error("❌ Error vinculando comunidades:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}