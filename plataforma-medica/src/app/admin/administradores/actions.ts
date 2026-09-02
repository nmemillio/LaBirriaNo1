"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");
  return session.user;
}

const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre."),
  email: z.string().trim().email("Correo inválido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Za-z]/, "Incluye al menos una letra.")
    .regex(/[0-9]/, "Incluye al menos un número."),
});

export async function createAdmin(_prevState: string | undefined, formData: FormData) {
  await requireAdmin();

  const parsed = createAdminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Datos inválidos.";

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "Ya existe una cuenta con ese correo.";

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN", emailVerified: new Date() },
  });

  revalidatePath("/admin/administradores");
  return undefined;
}

export async function promoteToAdmin(_prevState: string | undefined, formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return "Escribe el correo de una cuenta existente.";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return "No existe ninguna cuenta con ese correo.";
  if (user.role === "ADMIN") return "Esa cuenta ya es administradora.";

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  revalidatePath("/admin/administradores");
  revalidatePath("/admin/usuarios");
  return undefined;
}

export async function demoteAdmin(userId: string) {
  await requireAdmin();

  // Defensa extra además de que la UI ya oculta este botón para el único
  // admin restante: nunca te quedas sin nadie que pueda entrar a /admin.
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) return;

  await prisma.user.update({ where: { id: userId }, data: { role: "STUDENT" } });
  revalidatePath("/admin/administradores");
  revalidatePath("/admin/usuarios");
}
