"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo."),
  email: z.string().trim().email("Correo inválido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Za-z]/, "Incluye al menos una letra.")
    .regex(/[0-9]/, "Incluye al menos un número."),
});

export async function registerStudent(_prevState: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Datos inválidos.";
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return "Ya existe una cuenta con ese correo. Intenta iniciar sesión.";
  }

  const passwordHash = await hashPassword(password);
  const freePlan = await prisma.plan.findFirst({ where: { priceCents: 0, isActive: true } });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      emailVerified: null,
      ...(freePlan
        ? { subscriptions: { create: { planId: freePlan.id, status: "FREE" } } }
        : {}),
    },
  });

  try {
    await signIn("credentials", { email: user.email, password, redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Tu cuenta se creó, pero no pudimos iniciar sesión automáticamente. Intenta entrar manualmente.";
    }
    throw error;
  }

  return undefined;
}
