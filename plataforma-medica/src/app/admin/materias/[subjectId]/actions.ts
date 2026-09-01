"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");
  return session.user;
}

function revalidate(subjectId: string) {
  revalidatePath(`/admin/materias/${subjectId}`);
}

// ---------- Secciones ----------

export async function createSection(subjectId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!title) return;

  const last = await prisma.section.findFirst({ where: { subjectId, parentId }, orderBy: { order: "desc" } });
  await prisma.section.create({
    data: { subjectId, parentId, title, order: (last?.order ?? 0) + 1 },
  });
  revalidate(subjectId);
}

export async function updateSection(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;
  await prisma.section.update({ where: { id: sectionId }, data: { title, description: description || null } });
  revalidate(subjectId);
}

export async function setSectionStatus(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  await prisma.section.update({ where: { id: sectionId }, data: { status: status as never } });
  revalidate(subjectId);
}

export async function deleteSection(subjectId: string, sectionId: string) {
  await requireAdmin();
  await prisma.section.delete({ where: { id: sectionId } });
  revalidate(subjectId);
}

export async function moveSection(subjectId: string, sectionId: string, direction: "up" | "down") {
  await requireAdmin();
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) return;
  const siblings = await prisma.section.findMany({
    where: { subjectId, parentId: section.parentId },
    orderBy: { order: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === sectionId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

  const a = siblings[index];
  const b = siblings[swapIndex];
  await prisma.$transaction([
    prisma.section.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.section.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidate(subjectId);
}

// ---------- Contenido ----------

async function nextContentOrder(sectionId: string) {
  const last = await prisma.content.findFirst({ where: { sectionId }, orderBy: { order: "desc" } });
  return (last?.order ?? 0) + 1;
}

export async function createVideoContent(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const completionThreshold = Number(formData.get("completionThreshold") ?? 90);
  const file = formData.get("file") as File | null;
  if (!title || !file || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveUploadedFile("videos", file.name, buffer);
  const order = await nextContentOrder(sectionId);

  await prisma.content.create({
    data: {
      sectionId,
      type: "VIDEO",
      title,
      description: description || null,
      order,
      completionThreshold: Number.isFinite(completionThreshold) ? completionThreshold : 90,
      video: { create: { storageKey } },
    },
  });
  revalidate(subjectId);
}

export async function createPdfContent(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file") as File | null;
  if (!title || !file || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveUploadedFile("documents", file.name, buffer);
  const order = await nextContentOrder(sectionId);

  await prisma.content.create({
    data: {
      sectionId,
      type: "PDF",
      title,
      description: description || null,
      order,
      document: { create: { storageKey, fileName: file.name, fileSizeKb: Math.round(file.size / 1024) } },
    },
  });
  revalidate(subjectId);
}

// Variantes usadas cuando el archivo ya se subió directo del navegador a
// Vercel Blob (ver VideoUploadForm/PdfUploadForm) — evita el límite de
// tamaño de body de las funciones serverless de Vercel para archivos
// grandes. Reciben la URL de Blob en vez del archivo.

export async function createVideoContentFromUrl(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const completionThreshold = Number(formData.get("completionThreshold") ?? 90);
  const blobUrl = String(formData.get("blobUrl") ?? "").trim();
  if (!title || !blobUrl) return;

  const order = await nextContentOrder(sectionId);
  await prisma.content.create({
    data: {
      sectionId,
      type: "VIDEO",
      title,
      description: description || null,
      order,
      completionThreshold: Number.isFinite(completionThreshold) ? completionThreshold : 90,
      video: { create: { storageKey: blobUrl } },
    },
  });
  revalidate(subjectId);
}

export async function createPdfContentFromUrl(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const blobUrl = String(formData.get("blobUrl") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "documento.pdf").trim();
  const fileSizeKb = Number(formData.get("fileSizeKb") ?? 0);
  if (!title || !blobUrl) return;

  const order = await nextContentOrder(sectionId);
  await prisma.content.create({
    data: {
      sectionId,
      type: "PDF",
      title,
      description: description || null,
      order,
      document: {
        create: { storageKey: blobUrl, fileName, fileSizeKb: Number.isFinite(fileSizeKb) ? fileSizeKb : null },
      },
    },
  });
  revalidate(subjectId);
}

export async function createQuizContent(subjectId: string, sectionId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const passingScore = Number(formData.get("passingScore") ?? 70);
  const maxAttemptsRaw = String(formData.get("maxAttempts") ?? "").trim();
  if (!title) return;

  const order = await nextContentOrder(sectionId);
  await prisma.content.create({
    data: {
      sectionId,
      type: "QUIZ",
      title,
      order,
      quiz: {
        create: {
          passingScore: Number.isFinite(passingScore) ? passingScore : 70,
          maxAttempts: maxAttemptsRaw ? Number(maxAttemptsRaw) : null,
        },
      },
    },
  });
  revalidate(subjectId);
}

export async function updateContentMeta(subjectId: string, contentId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const thresholdRaw = formData.get("completionThreshold");
  if (!title) return;
  await prisma.content.update({
    where: { id: contentId },
    data: {
      title,
      description: description || null,
      ...(thresholdRaw ? { completionThreshold: Number(thresholdRaw) } : {}),
    },
  });
  revalidate(subjectId);
}

export async function setContentStatus(subjectId: string, contentId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  await prisma.content.update({ where: { id: contentId }, data: { status: status as never } });
  revalidate(subjectId);
}

export async function deleteContent(subjectId: string, contentId: string) {
  await requireAdmin();
  await prisma.content.delete({ where: { id: contentId } });
  revalidate(subjectId);
}

export async function moveContent(subjectId: string, contentId: string, direction: "up" | "down") {
  await requireAdmin();
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return;
  const siblings = await prisma.content.findMany({ where: { sectionId: content.sectionId }, orderBy: { order: "asc" } });
  const index = siblings.findIndex((c) => c.id === contentId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

  const a = siblings[index];
  const b = siblings[swapIndex];
  await prisma.$transaction([
    prisma.content.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.content.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidate(subjectId);
}

// ---------- Preguntas de quiz ----------

export async function addQuizQuestion(subjectId: string, quizId: string, formData: FormData) {
  await requireAdmin();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  const correctIndex = Number(formData.get("correctIndex") ?? 0);
  const answers = [0, 1, 2, 3]
    .map((i) => String(formData.get(`answer${i}`) ?? "").trim())
    .filter((a) => a.length > 0);
  if (!prompt || answers.length < 2) return;

  const last = await prisma.quizQuestion.findFirst({ where: { quizId }, orderBy: { order: "desc" } });
  await prisma.quizQuestion.create({
    data: {
      quizId,
      prompt,
      explanation: explanation || null,
      order: (last?.order ?? 0) + 1,
      answers: {
        create: answers.map((text, i) => ({ text, isCorrect: i === correctIndex, order: i + 1 })),
      },
    },
  });
  revalidate(subjectId);
}

export async function deleteQuizQuestion(subjectId: string, questionId: string) {
  await requireAdmin();
  await prisma.quizQuestion.delete({ where: { id: questionId } });
  revalidate(subjectId);
}
