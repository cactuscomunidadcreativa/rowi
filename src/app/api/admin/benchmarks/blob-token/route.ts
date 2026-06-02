/**
 * 📊 API: Generate Vercel Blob Upload Token
 * POST /api/admin/benchmarks/blob-token
 *
 * Genera token para subir archivos directamente desde el cliente a Vercel Blob.
 * Esto permite uploads directos desde el cliente sin pasar por el servidor.
 */

import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    // Obtener email del header si está disponible (para logging)
    const userEmail = req.headers.get("x-user-email") || "anonymous";

    const body = await req.json() as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        console.log("📋 Blob token request:", { pathname, multipart, userEmail });

        // Validar que sea un archivo permitido
        const ext = pathname.toLowerCase();
        if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
          throw new Error('Solo se permiten archivos CSV o Excel');
        }

        return {
          // Solo los MIME reales de hoja de cálculo. NO se permite
          // 'application/octet-stream' ni wildcards: aceptar tipos arbitrarios
          // anula la validación del lado del servidor y abre abuso/upload de
          // binarios. .csv → text/csv · .xls → application/vnd.ms-excel ·
          // .xlsx → ...spreadsheetml.sheet.
          allowedContentTypes: [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
          // 50MB. Un benchmark CSV/XLSX realista (decenas de miles de filas)
          // pesa muy por debajo de esto. El límite anterior de 500MB era un
          // riesgo de DoS/coste/abuso. Debe mantenerse consistente con
          // MAX_FILE_SIZE_BYTES en src/lib/benchmarks/process-benchmark.ts.
          maximumSizeInBytes: 52428800, // 50MB
          addRandomSuffix: true,
          multipart, // Pasar el flag multipart al token
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
