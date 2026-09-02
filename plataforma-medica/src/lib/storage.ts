import path from "node:path";
import fs from "node:fs/promises";
import { put, del, head } from "@vercel/blob";

/**
 * Almacenamiento de archivos protegidos (videos/PDFs).
 *
 * Con `BLOB_READ_WRITE_TOKEN` configurada (Vercel Blob habilitado en el
 * proyecto), los archivos se suben ahí — necesario en Vercel, cuyo
 * filesystem es efímero y no sirve para guardar uploads. Sin esa variable
 * (desarrollo local sin Blob), se usa disco local bajo `storage/` como
 * antes. La URL de Blob nunca se manda al navegador: todo pasa siempre por
 * las rutas /api/content/.../video|document, que verifican sesión,
 * suscripción y desbloqueo antes de leer el archivo (ver stream-guard.ts).
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage");

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isRemoteKey(storageKey: string) {
  return storageKey.startsWith("https://") || storageKey.startsWith("http://");
}

function resolveSafePath(storageKey: string) {
  const normalized = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(STORAGE_ROOT, normalized);
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Ruta de almacenamiento inválida");
  }
  return fullPath;
}

export async function readStoredFile(storageKey: string) {
  if (isRemoteKey(storageKey)) {
    const res = await fetch(storageKey);
    if (!res.ok) throw new Error(`No se pudo leer el archivo remoto (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(resolveSafePath(storageKey));
}

export function getStoredFilePath(storageKey: string) {
  return resolveSafePath(storageKey);
}

export async function storedFileExists(storageKey: string) {
  if (isRemoteKey(storageKey)) {
    try {
      if (isBlobConfigured()) {
        await head(storageKey);
        return true;
      }
      const res = await fetch(storageKey, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }
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
): Promise<string> {
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (isBlobConfigured()) {
    const blob = await put(`${kind}/${safeName}`, data, {
      access: "public",
      addRandomSuffix: true,
      contentType: guessContentType(fileName),
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    // El filesystem de Vercel es de solo lectura (salvo /tmp, que no
    // persiste entre invocaciones) — sin Blob configurada, un upload aquí
    // fallaría de forma confusa. Mejor un error claro que EROFS.
    throw new Error(
      "Sube BLOB_READ_WRITE_TOKEN en las variables de entorno del proyecto para poder subir archivos en producción.",
    );
  }

  const dir = path.join(STORAGE_ROOT, kind, "uploads");
  await fs.mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, safeName);
  await fs.writeFile(fullPath, data);
  return path.join(kind, "uploads", safeName);
}

export async function deleteStoredFile(storageKey: string) {
  if (isRemoteKey(storageKey)) {
    if (isBlobConfigured()) await del(storageKey).catch(() => {});
    return;
  }
  await fs.unlink(resolveSafePath(storageKey)).catch(() => {});
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
