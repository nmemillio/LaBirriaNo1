import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/stripe";

/**
 * El backend NUNCA confía en lo que el frontend dice sobre el plan del
 * usuario (punto 17). Este webhook es la única fuente de verdad para
 * activar, renovar o cancelar accesos — todo lo demás (checkout) solo
 * inicia el flujo, pero es este endpoint el que persiste el estado real.
 *
 * La clave y el secreto del webhook se resuelven igual que en checkout/
 * portal: primero lo que haya guardado el admin en /admin/configuracion,
 * si no, las variables de entorno.
 */
export async function POST(req: Request) {
  const { secretKey, webhookSecret } = await getStripeConfig();
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }
  const stripe = new Stripe(secretKey);

  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature ?? "", webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Firma inválida: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const userId = checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id;
      const planId = checkoutSession.metadata?.planId;
      if (userId && planId && checkoutSession.subscription && checkoutSession.customer) {
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: String(checkoutSession.subscription) },
          create: {
            userId,
            planId,
            status: "ACTIVE",
            stripeCustomerId: String(checkoutSession.customer),
            stripeSubscriptionId: String(checkoutSession.subscription),
          },
          update: { status: "ACTIVE", planId },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const status = mapStripeStatus(sub.status);
      const currentPeriodEnd = sub.items.data[0]?.current_period_end
        ? new Date(sub.items.data[0].current_period_end * 1000)
        : null;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "CANCELED" },
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription;
      if (subscriptionId) {
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: String(subscriptionId) },
        });
        if (subscription) {
          await prisma.payment.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              stripePaymentIntentId: invoice.id ?? undefined,
              amountCents: invoice.amount_paid,
              currency: invoice.currency,
              status: "SUCCEEDED",
            },
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription;
      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: String(subscriptionId) },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
    case "unpaid":
      return "PAST_DUE" as const;
    case "canceled":
    case "incomplete_expired":
      return "CANCELED" as const;
    default:
      return "INCOMPLETE" as const;
  }
}
