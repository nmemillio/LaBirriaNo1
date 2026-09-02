"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { STRIPE_SETTINGS_ID, getStripe } from "@/lib/stripe";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");
  return session.user;
}

export async function saveStripeSettings(_prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();

  const secretKey = String(formData.get("secretKey") ?? "").trim();
  const publishableKey = String(formData.get("publishableKey") ?? "").trim();
  const webhookSecret = String(formData.get("webhookSecret") ?? "").trim();

  if (secretKey && !secretKey.startsWith("sk_") && !secretKey.startsWith("rk_")) {
    return "La Secret Key de Stripe debería empezar con sk_ (o rk_ para una clave restringida).";
  }
  if (webhookSecret && !webhookSecret.startsWith("whsec_")) {
    return "El Webhook Signing Secret debería empezar con whsec_.";
  }
  if (publishableKey && !publishableKey.startsWith("pk_")) {
    return "La Publishable Key debería empezar con pk_.";
  }

  await prisma.stripeSettings.upsert({
    where: { id: STRIPE_SETTINGS_ID },
    create: {
      id: STRIPE_SETTINGS_ID,
      secretKeyEncrypted: secretKey ? encryptSecret(secretKey) : null,
      publishableKey: publishableKey || null,
      webhookSecretEncrypted: webhookSecret ? encryptSecret(webhookSecret) : null,
      updatedById: admin.id,
    },
    update: {
      // Un campo vacío significa "no cambiar" para las claves secretas, así
      // el admin puede actualizar solo una sin tener que volver a pegar las
      // demás. La publishable key sí se puede vaciar (no es sensible).
      ...(secretKey ? { secretKeyEncrypted: encryptSecret(secretKey) } : {}),
      publishableKey: publishableKey || null,
      ...(webhookSecret ? { webhookSecretEncrypted: encryptSecret(webhookSecret) } : {}),
      updatedById: admin.id,
    },
  });

  revalidatePath("/admin/configuracion");
  return undefined;
}

export async function clearStripeSettings() {
  await requireAdmin();
  await prisma.stripeSettings.deleteMany({ where: { id: STRIPE_SETTINGS_ID } });
  revalidatePath("/admin/configuracion");
}

export async function testStripeConnection(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const stripe = await getStripe();
  if (!stripe) {
    return { ok: false, message: "No hay ninguna clave de Stripe configurada todavía." };
  }
  try {
    const balance = await stripe.balance.retrieve();
    const mode = balance.livemode ? "modo Live (cobros reales)" : "modo Test (sin cobros reales)";
    return { ok: true, message: `Conectado correctamente — ${mode}.` };
  } catch (err) {
    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      return { ok: false, message: "La clave guardada no es válida (error de autenticación de Stripe)." };
    }
    return { ok: false, message: `No se pudo conectar: ${(err as Error).message}` };
  }
}
