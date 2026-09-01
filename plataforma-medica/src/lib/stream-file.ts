import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { Readable } from "node:stream";
import { getStoredFilePath } from "@/lib/storage";

/**
 * Sirve un archivo protegido con soporte de Range para permitir el
 * "scrubbing" del reproductor de video. Dos backends:
 *  - Local (desarrollo sin Blob): lee de disco y arma la respuesta 206/200
 *    a mano.
 *  - Vercel Blob (storageKey es una URL https): reenvía la solicitud al
 *    origen de Blob con el mismo header Range — su CDN ya soporta Range
 *    nativamente — y devuelve esa respuesta tal cual, así el navegador
 *    nunca ve la URL real de Blob (solo la de nuestra propia ruta).
 */
export async function streamStoredFile(
  storageKey: string,
  contentType: string,
  rangeHeader: string | null,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  if (storageKey.startsWith("https://") || storageKey.startsWith("http://")) {
    return streamRemoteFile(storageKey, contentType, rangeHeader, extraHeaders);
  }
  return streamLocalFile(storageKey, contentType, rangeHeader, extraHeaders);
}

async function streamRemoteFile(
  url: string,
  contentType: string,
  rangeHeader: string | null,
  extraHeaders: Record<string, string>,
): Promise<Response> {
  const upstream = await fetch(url, {
    headers: rangeHeader ? { Range: rangeHeader } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(JSON.stringify({ error: "Archivo no disponible todavía." }), {
      status: upstream.status === 404 ? 404 : 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Accept-Ranges": "bytes",
    ...extraHeaders,
  };
  const contentRange = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");
  if (contentRange) headers["Content-Range"] = contentRange;
  if (contentLength) headers["Content-Length"] = contentLength;

  return new Response(upstream.body, { status: upstream.status, headers });
}

async function streamLocalFile(
  storageKey: string,
  contentType: string,
  rangeHeader: string | null,
  extraHeaders: Record<string, string>,
): Promise<Response> {
  const filePath = getStoredFilePath(storageKey);

  let stat;
  try {
    stat = await fsPromises.stat(filePath);
  } catch {
    return new Response(JSON.stringify({ error: "Archivo no disponible todavía." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Accept-Ranges": "bytes",
    ...extraHeaders,
  };

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      const safeEnd = Math.min(end, stat.size - 1);

      if (start >= stat.size || start > safeEnd) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${stat.size}` },
        });
      }

      const nodeStream = fs.createReadStream(filePath, { start, end: safeEnd });
      return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${safeEnd}/${stat.size}`,
          "Content-Length": String(safeEnd - start + 1),
        },
      });
    }
  }

  const nodeStream = fs.createReadStream(filePath);
  return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(stat.size) },
  });
}
