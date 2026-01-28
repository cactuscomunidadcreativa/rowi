// src/app/api/invites/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/config";
import { promises as fs } from "fs";
import path from "path";

type Invite = {
  token: string;
  contact: string;
  kind: "email" | "phone";
  inviterEmail: string;
  createdAt: string;
  acceptedAt?: string | null;
};

const FILE = path.join(process.cwd(), "src", "data", "invites.json");

async function readInvites(): Promise<Invite[]> {
  const txt = await fs.readFile(FILE, "utf8").catch(() => "[]");
  try {
    return JSON.parse(txt || "[]");
  } catch {
    return [];
  }
}

async function writeInvites(list: Invite[]) {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

// Marcar una invitación como aceptada
export async function PUT(_req: NextRequest, { params }: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = params?.token as string | undefined;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const list = await readInvites();
  const idx = list.findIndex((i) => i.token === token);
  if (idx === -1) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  list[idx].acceptedAt = new Date().toISOString();
  await writeInvites(list);

  return NextResponse.json({ ok: true, invite: list[idx] });
}