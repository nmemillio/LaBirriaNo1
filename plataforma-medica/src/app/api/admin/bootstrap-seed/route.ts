import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// Ruta temporal de un solo uso: siembra los planes y las 2 cuentas de
// demo en producción cuando no hay forma de correr `npm run db:seed`
// directamente contra la base (Neon detrás de un pooler sin acceso de
// red directo desde el entorno de despliegue). Protegida por
// CONTENT_SIGNING_SECRET porque ya está configurada en producción; se
// elimina en cuanto se usa una vez.
export async function POST(req: Request) {
  const secret = req.headers.get("x-bootstrap-secret");
  if (!secret || !process.env.CONTENT_SIGNING_SECRET || secret !== process.env.CONTENT_SIGNING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const PLAN_FEATURES = JSON.stringify([
    "Acceso a todos los semestres publicados",
    "Video clases en el reproductor propio de la plataforma",
    "Material PDF descargable",
    "Quizzes de autoevaluación",
    "Preguntas y respuestas con profesores",
  ]);

  await prisma.plan.upsert({
    where: { id: "plan-free" },
    create: {
      id: "plan-free",
      name: "Plan Gratuito",
      description: "Empieza a estudiar sin costo. Mismas ventajas que los demás planes por ahora.",
      priceCents: 0,
      currency: "mxn",
      interval: "MONTH",
      features: PLAN_FEATURES,
      order: 1,
    },
    update: {},
  });

  await prisma.plan.upsert({
    where: { id: "plan-estudiantes" },
    create: {
      id: "plan-estudiantes",
      name: "Plan Estudiantes",
      description: "Precio especial para estudiantes. Mismas ventajas que los demás planes por ahora.",
      priceCents: 25000,
      currency: "mxn",
      interval: "MONTH",
      features: PLAN_FEATURES,
      order: 2,
    },
    update: {},
  });

  await prisma.plan.upsert({
    where: { id: "plan-premium" },
    create: {
      id: "plan-premium",
      name: "Plan Premium",
      description: "Apoya el desarrollo de la plataforma. Mismas ventajas que los demás planes por ahora.",
      priceCents: 49900,
      currency: "mxn",
      interval: "MONTH",
      features: PLAN_FEATURES,
      order: 3,
    },
    update: {},
  });

  const adminPasswordHash = await hashPassword("Oswaldo_2008!");
  const studentPasswordHash = await hashPassword("Oswalfo_2008!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    create: {
      email: "admin@gmail.com",
      name: "Admin Demo",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    update: { passwordHash: adminPasswordHash, role: "ADMIN" },
  });

  const student = await prisma.user.upsert({
    where: { email: "user@gmail.com" },
    create: {
      email: "user@gmail.com",
      name: "Estudiante Demo",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      emailVerified: new Date(),
    },
    update: { passwordHash: studentPasswordHash, role: "STUDENT" },
  });

  await prisma.subscription.upsert({
    where: { id: `sub-${student.id}-plan-free` },
    create: { id: `sub-${student.id}-plan-free`, userId: student.id, planId: "plan-free", status: "FREE" },
    update: {},
  });

  return NextResponse.json({ ok: true, adminId: admin.id, studentId: student.id });
}
