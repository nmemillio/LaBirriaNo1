import crypto from "node:crypto";

/**
 * Cifra/descifra secretos que el admin guarda desde la UI (claves de
 * Stripe, por ahora) para poder almacenarlos en la base de datos en vez de
 * variables de entorno. AES-256-GCM con una clave derivada de AUTH_SECRET
 * — ese secreto ya es obligatorio y solo vive en el servidor, así que no
 * hace falta pedir una variable de entorno más solo para esto.
 */
function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado — hace falta para cifrar/leer secretos guardados.");
  }
  return crypto.createHash("sha256").update(secret).update("galeno-settings-v1").digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** Muestra solo los últimos 4 caracteres, para confirmar sin exponer el valor. */
export function maskSecret(plain: string): string {
  if (plain.length <= 4) return "••••";
  return `••••••••${plain.slice(-4)}`;
}
