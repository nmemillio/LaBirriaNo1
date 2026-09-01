import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  const appUrl = getAppUrl(req);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const planId = body?.planId as string | undefined;
  if (!planId) {
    return NextResponse.json({ error: "missing_plan" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  }

  // Plan gratuito: no pasa por Stripe, se activa directamente.
  if (plan.priceCents === 0) {
    await prisma.subscription.upsert({
      where: { id: `sub-${session.user.id}-${plan.id}` },
      create: { id: `sub-${session.user.id}-${plan.id}`, userId: session.user.id, planId: plan.id, status: "FREE" },
      update: { planId: plan.id, status: "FREE" },
    });
    return NextResponse.json({ redirectUrl: "/app/facturacion?activated=free" });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "stripe_not_configured",
        message:
          "Stripe todavía no está conectado en este entorno. Configura STRIPE_SECRET_KEY para habilitar pagos con tarjeta.",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe()!;

  let stripeCustomerId = (
    await prisma.subscription.findFirst({
      where: { userId: session.user.id, stripeCustomerId: { not: null } },
      select: { stripeCustomerId: true },
    })
  )?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    stripeCustomerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: session.user.id,
    line_items: [
      plan.stripePriceId
        ? { price: plan.stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: plan.currency,
              unit_amount: plan.priceCents,
              recurring: { interval: plan.interval === "YEAR" ? "year" : "month" },
              product_data: { name: plan.name, description: plan.description ?? undefined },
            },
            quantity: 1,
          },
    ],
    success_url: `${appUrl}/app/facturacion?checkout=success`,
    cancel_url: `${appUrl}/precios?checkout=cancelado`,
    metadata: { userId: session.user.id, planId: plan.id },
    subscription_data: { metadata: { userId: session.user.id, planId: plan.id } },
  });

  return NextResponse.json({ redirectUrl: checkoutSession.url });
}
