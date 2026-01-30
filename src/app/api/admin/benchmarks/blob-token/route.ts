/**
 * 📊 API: Generate Vercel Blob Upload Token
 * POST /api/admin/benchmarks/blob-token
 *
 * Genera token para subir archivos directamente desde el cliente a Vercel Blob.
 * Esto permite uploads de hasta 500MB sin pasar por el servidor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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
          tokenPayload: JSON.stringify({
            uploadedBy: session.user.email,
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
