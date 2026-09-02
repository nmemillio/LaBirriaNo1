import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export const STRIPE_SETTINGS_ID = "singleton";

/**
 * La configuración de Stripe se puede guardar desde /admin/configuracion
 * (queda cifrada en la base de datos) o, si el admin no configuró nada
 * ahí, se usan las variables de entorno de siempre. Se resuelve en cada
 * llamada (sin caché) porque el admin puede actualizarla en cualquier
 * momento y el próximo checkout/webhook debe verla de inmediato.
 */
export async function getStripeConfig() {
  const settings = await prisma.stripeSettings.findUnique({ where: { id: STRIPE_SETTINGS_ID } }).catch(() => null);

  const secretKey = settings?.secretKeyEncrypted
    ? decryptSecret(settings.secretKeyEncrypted)
    : (process.env.STRIPE_SECRET_KEY ?? null);

  const webhookSecret = settings?.webhookSecretEncrypted
    ? decryptSecret(settings.webhookSecretEncrypted)
    : (process.env.STRIPE_WEBHOOK_SECRET ?? null);

  const publishableKey = settings?.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;

  const source: "database" | "env" | "none" = settings?.secretKeyEncrypted
    ? "database"
    : process.env.STRIPE_SECRET_KEY
      ? "env"
      : "none";

  return { secretKey, webhookSecret, publishableKey, source };
}

export async function getStripe(): Promise<Stripe | null> {
  const { secretKey } = await getStripeConfig();
  return secretKey ? new Stripe(secretKey) : null;
}

export async function isStripeConfigured(): Promise<boolean> {
  const { secretKey } = await getStripeConfig();
  return Boolean(secretKey);
}
