import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/config";

type Profile = { email: string; username: string; bio?: string };

function usernameFromEmail(email: string) {
  const base = (email.split("@")[0] || "rowi").toLowerCase().replace(/[^a-z0-9_]/g, "");
  return base || "rowi";
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // “Perfil” derivado (sin DB)
  const profile: Profile = { email, username: usernameFromEmail(email), bio: "" };
  return NextResponse.json({ ok: true, profile });
}
