import { prisma } from "@/lib/prisma";

/**
 * El backend nunca confía en el plan mostrado en el frontend: aquí se
 * consulta el estado real de la suscripción (que a su vez Stripe mantiene
 * al día vía webhooks — ver src/app/api/webhooks/stripe/route.ts).
 */
const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING", "FREE"]);

export async function userHasActiveAccess(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: { in: Array.from(ACTIVE_STATUSES) as never } },
    orderBy: { updatedAt: "desc" },
  });
  return Boolean(subscription);
}

export async function getUserActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: Array.from(ACTIVE_STATUSES) as never } },
    include: { plan: true },
    orderBy: { updatedAt: "desc" },
  });
}
