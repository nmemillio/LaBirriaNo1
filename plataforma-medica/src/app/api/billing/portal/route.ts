import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  const appUrl = getAppUrl(req);
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, stripeCustomerId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "no_stripe_customer" }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/app/facturacion`,
  });

  return NextResponse.json({ redirectUrl: portalSession.url });
}
