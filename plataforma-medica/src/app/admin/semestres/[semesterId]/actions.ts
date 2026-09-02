"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");
  return session.user;
}

export async function createSubject(semesterId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const last = await prisma.subject.findFirst({ where: { semesterId }, orderBy: { order: "desc" } });
  await prisma.subject.create({
    data: { semesterId, title, description: description || null, order: (last?.order ?? 0) + 1 },
  });
  revalidatePath(`/admin/semestres/${semesterId}`);
}

export async function updateSubject(semesterId: string, subjectId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unlockMode = String(formData.get("unlockMode") ?? "SEQUENTIAL");
  if (!title) return;
  await prisma.subject.update({
    where: { id: subjectId },
    data: { title, description: description || null, unlockMode: unlockMode as never },
  });
  revalidatePath(`/admin/semestres/${semesterId}`);
}

export async function setSubjectStatus(semesterId: string, subjectId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  await prisma.subject.update({ where: { id: subjectId }, data: { status: status as never } });
  revalidatePath(`/admin/semestres/${semesterId}`);
}

export async function deleteSubject(semesterId: string, subjectId: string) {
  await requireAdmin();
  await prisma.subject.delete({ where: { id: subjectId } });
  revalidatePath(`/admin/semestres/${semesterId}`);
}

export async function moveSubject(semesterId: string, subjectId: string, direction: "up" | "down") {
  await requireAdmin();
  const subjects = await prisma.subject.findMany({ where: { semesterId }, orderBy: { order: "asc" } });
  const index = subjects.findIndex((s) => s.id === subjectId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= subjects.length) return;

  const a = subjects[index];
  const b = subjects[swapIndex];
  await prisma.$transaction([
    prisma.subject.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.subject.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath(`/admin/semestres/${semesterId}`);
}
