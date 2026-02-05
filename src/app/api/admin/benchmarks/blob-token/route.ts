/**
 * 📊 API: Generate Vercel Blob Upload Token
 * POST /api/admin/benchmarks/blob-token
 *
 * Genera token para subir archivos directamente desde el cliente a Vercel Blob.
 * Esto permite uploads de hasta 500MB sin pasar por el servidor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(req: NextRequest) {
  try {
    // Intentar obtener email del header (enviado desde el cliente)
    // o del token JWT como fallback
    const headerEmail = req.headers.get("x-user-email");
    console.log("📧 Header x-user-email:", headerEmail);

    let userEmail = headerEmail;

    if (!userEmail || userEmail === "") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      console.log("🔑 JWT token email:", token?.email);
      userEmail = token?.email as string;
    }

    console.log("👤 Final userEmail:", userEmail);

    if (!userEmail || userEmail === "") {
      console.log("❌ No email found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Validar que sea un archivo permitido
        const ext = pathname.toLowerCase();
        if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
          throw new Error('Solo se permiten archivos CSV o Excel');
        }

        return {
          allowedContentTypes: [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream', // Para archivos sin MIME type específico
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
          addRandomSuffix: true, // Evitar conflictos con archivos existentes
          tokenPayload: JSON.stringify({
            uploadedBy: userEmail,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log(`📤 Blob upload completed: ${blob.url}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("❌ Error generating blob token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error generating upload token" },
      { status: 500 }
    );
  }
}
// Build trigger: 1770312248
