import { getUserActiveSubscription } from "@/lib/access";

export async function getActivePlanForUser(userId: string) {
  const subscription = await getUserActiveSubscription(userId);
  return subscription ? subscription.plan.name : null;
}
