"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session.user;
}

export async function createSemester(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const last = await prisma.semester.findFirst({ orderBy: { order: "desc" } });
  await prisma.semester.create({
    data: { title, description: description || null, order: (last?.order ?? 0) + 1 },
  });
  revalidatePath("/admin/semestres");
}

export async function updateSemester(id: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;
  await prisma.semester.update({ where: { id }, data: { title, description: description || null } });
  revalidatePath("/admin/semestres");
}

export async function setSemesterStatus(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  await prisma.semester.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/admin/semestres");
}

export async function deleteSemester(id: string) {
  await requireAdmin();
  await prisma.semester.delete({ where: { id } });
  revalidatePath("/admin/semestres");
}

export async function moveSemester(id: string, direction: "up" | "down") {
  await requireAdmin();
  const semesters = await prisma.semester.findMany({ orderBy: { order: "asc" } });
  const index = semesters.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= semesters.length) return;

  const a = semesters[index];
  const b = semesters[swapIndex];
  await prisma.$transaction([
    prisma.semester.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.semester.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath("/admin/semestres");
}
