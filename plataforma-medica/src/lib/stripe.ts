import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

/**
 * Devuelve el cliente de Stripe solo si STRIPE_SECRET_KEY está configurada.
 * En desarrollo, sin esa variable, las rutas de facturación responden con
 * un aviso claro en vez de fallar — así el resto de la plataforma (planes,
 * suscripción "gratuita", progreso) funciona sin depender de Stripe todavía.
 */
export function getStripe(): Stripe | null {
  if (stripeClient !== undefined) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  stripeClient = key ? new Stripe(key) : null;
  return stripeClient;
}

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
