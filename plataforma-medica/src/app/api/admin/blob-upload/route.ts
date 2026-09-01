import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Autoriza subidas de video/PDF directamente del navegador a Vercel Blob
 * (sin pasar el archivo por nuestro servidor). Necesario para que los
 * videos reales (cientos de MB) no choquen con el límite de tamaño de
 * body de las funciones serverless de Vercel (~4.5 MB) — con esta ruta,
 * el servidor solo emite un token de subida de corta duración; los bytes
 * viajan directo del navegador al storage.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
          throw new Error("No autorizado");
        }

        const isPdf = clientPayload === "pdf";
        return {
          allowedContentTypes: isPdf
            ? ["application/pdf"]
            : ["video/mp4", "video/webm", "video/quicktime"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ adminId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // La fila en la base de datos se crea desde una server action aparte
        // en cuanto el navegador confirma que la subida terminó (ver
        // createVideoContentFromUrl/createPdfContentFromUrl) — no depende de
        // este callback, que además no llega en desarrollo local.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
