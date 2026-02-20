import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/* =========================================================
   📧 POST → Enviar invitación (modo simulación)
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor || !["SUPERADMIN", "ADMIN"].includes(actor.organizationRole || ""))
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { email, name, token, tenantName } = body;

    if (!email || !token)
      return NextResponse.json({ ok: false, error: "Faltan datos requeridos" });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

    /* 💌 Plantilla del correo */
    const html = `
      <body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#31a2e3,#7a59c9,#d797cf);color:#fff;text-align:center;padding:24px 16px;">
              <h1 style="margin:0;font-size:22px;">Invitación a ${tenantName || "Rowi"}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#333;">
              <p style="font-size:16px;">Hola${name ? ` ${name}` : ""}, has sido invitado a unirte a <strong>${tenantName || "Rowi"}</strong>.</p>
              <p style="text-align:center;">
                <a href="${inviteUrl}" target="_blank" 
                   style="background:#31a2e3;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;">
                  Aceptar Invitación
                </a>
              </p>
              <p style="font-size:13px;color:#555;">
                Si el botón no funciona, copia este enlace: <br/>
                <span style="color:#0070f3">${inviteUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding:16px;font-size:12px;color:#999;border-top:1px solid #eee;">
              © ${new Date().getFullYear()} Rowi AI — Comunidad emocional inteligente
            </td>
          </tr>
        </table>
      </body>
    `;

    // 🧪 Simulación
    console.log("📧 Simulando envío de invitación:");
    console.log("→ Destinatario:", email);
    console.log("→ URL:", inviteUrl);
    console.log("→ HTML:", html.slice(0, 200) + "...");

    return NextResponse.json({
      ok: true,
      simulated: true,
      message: `Invitación simulada para ${email}`,
      inviteUrl,
    });
  } catch (e: any) {
    console.error("❌ Error /api/emails/invite:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno al enviar correo" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";