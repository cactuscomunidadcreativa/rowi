// src/app/api/admin/ui/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type NavItem = { label: string; href: string; visible: boolean };
type UIButton = { id: string; text: string; href: string; style: string };
type UIConfig = { navigation: NavItem[]; buttons: UIButton[]; updatedAt?: string };

const DEFAULT_UI: UIConfig = {
  navigation: [
    { label: "Dashboard", href: "/dashboard", visible: true },
    { label: "Community", href: "/community", visible: true },
    { label: "Feed", href: "/feed", visible: true },
    { label: "Settings", href: "/settings/profile", visible: true },
  ],
  buttons: [
    { id: "primary", text: "Primary", href: "/feed", style: "button button--primary" },
    { id: "secondary", text: "Secondary", href: "/community", style: "button" },
  ],
  updatedAt: "",
};

// Memoria en proceso (sobrevive mientras viva el worker)
let UI_MEM: UIConfig = { ...DEFAULT_UI };

// En Vercel no persistas a disco; en local sí (para tu comodidad)
const IS_VERCEL = !!process.env.VERCEL;
const DATA_PATH = path.join(process.cwd(), "src/data/ui.json");

async function readUI(): Promise<UIConfig> {
  // Primero intenta devolver desde memoria
  if (UI_MEM.navigation.length || UI_MEM.buttons.length) return UI_MEM;

  // En local, intenta leer el archivo; si falla, regresa default
  try {
    const buf = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(buf);
    UI_MEM = {
      navigation: Array.isArray(parsed.navigation) ? parsed.navigation : DEFAULT_UI.navigation,
      buttons: Array.isArray(parsed.buttons) ? parsed.buttons : DEFAULT_UI.buttons,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
    return UI_MEM;
  } catch {
    return { ...DEFAULT_UI };
  }
}

async function writeUI(next: UIConfig) {
  UI_MEM = next; // siempre actualiza memoria
  if (IS_VERCEL) {
    // En Vercel, no intentes escribir a disco; solo memoria
    return;
  }
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(next, null, 2), "utf8");
  } catch {
    // Silencia errores de escritura local (no rompas la API)
  }
}

export async function GET() {
  try {
    const ui = await readUI();
    return NextResponse.json({ ok: true, ui });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error leyendo UI" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<UIConfig>;
    const navSrc = Array.isArray(body.navigation) ? body.navigation : [];
    const btnSrc = Array.isArray(body.buttons) ? body.buttons : [];

    const navigation: NavItem[] = navSrc.map((n: any) => ({
      label: String(n?.label ?? ""),
      href: String(n?.href ?? "#"),
      visible: Boolean(n?.visible ?? true),
    }));

    const buttons: UIButton[] = btnSrc.map((b: any) => ({
      id: String(b?.id ?? ""),
      text: String(b?.text ?? ""),
      href: String(b?.href ?? "#"),
      style: String(b?.style ?? "button"),
    }));

    const updated: UIConfig = {
      navigation,
      buttons,
      updatedAt: new Date().toISOString(),
    };

    await writeUI(updated);
    return NextResponse.json({ ok: true, ui: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error guardando UI" },
      { status: 400 }
    );
  }
}