import path from "node:path";
import fs from "node:fs/promises";

/**
 * Almacenamiento de archivos protegidos (videos/PDFs).
 *
 * IMPORTANTE: estos archivos viven fuera de `public/`, por lo que Next.js
 * nunca los sirve directamente por URL. Solo se accede a ellos a través de
 * las rutas /api/stream/video y /api/stream/document, que verifican sesión,
 * suscripción y un token firmado de corta duración antes de leer el archivo
 * (ver src/lib/content-token.ts).
 *
 * En producción, reemplazar este módulo por un cliente de S3/R2/GCS que
 * genere URLs firmadas (presigned URLs) en vez de leer del disco local —
 * la interfaz (storageKey -> stream) se mantendría igual para no tocar el
 * resto de la aplicación.
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage");

function resolveSafePath(storageKey: string) {
  const normalized = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(STORAGE_ROOT, normalized);
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Ruta de almacenamiento inválida");
  }
  return fullPath;
}

export async function readStoredFile(storageKey: string) {
  const fullPath = resolveSafePath(storageKey);
  return fs.readFile(fullPath);
}

export function getStoredFilePath(storageKey: string) {
  return resolveSafePath(storageKey);
}

export async function storedFileExists(storageKey: string) {
  try {
    await fs.access(resolveSafePath(storageKey));
    return true;
  } catch {
    return false;
  }
}

export async function saveUploadedFile(
  kind: "videos" | "documents" | "thumbnails",
  fileName: string,
  data: Buffer,
) {
  const dir = path.join(STORAGE_ROOT, kind, "uploads");
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fullPath = path.join(dir, safeName);
  await fs.writeFile(fullPath, data);
  return path.join(kind, "uploads", safeName);
}

export function guessContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}
