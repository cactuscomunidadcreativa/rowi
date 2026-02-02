import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../core/auth/config"; // ← FIX aquí
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
  return JSON.parse(txt || "[]");
}
async function writeInvites(list: Invite[]) {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

function detectKind(contact: string): "email" | "phone" {
  const c = contact.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
  if (isEmail) return "email";
  const digits = c.replace(/[^\d+]/g, "");
  if (/^\+?\d{6,15}$/.test(digits)) return "phone";
  throw new Error("Contacto inválido. Usa email o teléfono con código país, ej: +51999999999");
}

function makeBaseUrl(req: NextRequest) {
  const hdr = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${hdr}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invites = await readInvites();
  const mine = invites.filter(i => i.inviterEmail === session.user!.email);
  return NextResponse.json({ ok: true, invites: mine });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contact } = await req.json().catch(() => ({}));
  if (!contact || typeof contact !== "string") {
    return NextResponse.json({ error: "Falta 'contact'" }, { status: 400 });
  }

  let kind: "email" | "phone";
  try { kind = detectKind(contact); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const list = await readInvites();
  const token = crypto.randomUUID();
  const base = makeBaseUrl(req);
  const url = `${base}/invite/${token}`;

  const inv: Invite = {
    token,
    contact: contact.trim(),
    kind,
    inviterEmail: session.user.email!,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
  };
  list.push(inv);
  await writeInvites(list);

  const msg = encodeURIComponent(`¡Te invito a Rowi! Crea tu perfil aquí: ${url}`);
  const mailto = kind === "email" ? `mailto:${inv.contact}?subject=${encodeURIComponent("Te invito a Rowi")}&body=${msg}` : null;
  const sms = kind === "phone" ? `sms:${inv.contact}?&body=${msg}` : null;

  return NextResponse.json({ ok: true, invite: inv, url, mailto, sms });
}
