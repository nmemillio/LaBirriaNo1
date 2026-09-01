"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { grantManualUnlock } from "@/lib/progress";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");
  return session.user;
}

export async function toggleSuspend(userId: string, formData: FormData) {
  await requireAdmin();
  const suspend = String(formData.get("suspend")) === "true";
  await prisma.user.update({ where: { id: userId }, data: { suspendedAt: suspend ? new Date() : null } });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
}

export async function changeUserPlan(userId: string, formData: FormData) {
  await requireAdmin();
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return;
  await prisma.subscription.upsert({
    where: { id: `sub-${userId}-${planId}` },
    create: { id: `sub-${userId}-${planId}`, userId, planId, status: "ACTIVE" },
    update: { planId, status: "ACTIVE" },
  });
  revalidatePath(`/admin/usuarios/${userId}`);
}

export async function unlockContentForUser(userId: string, contentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  await grantManualUnlock(admin.id, userId, contentId, reason || undefined);
  revalidatePath(`/admin/usuarios/${userId}`);
}
