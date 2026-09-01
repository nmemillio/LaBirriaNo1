import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { saveUploadedFile } from "../src/lib/storage";

const prisma = new PrismaClient();

// Si BLOB_READ_WRITE_TOKEN está configurada (producción en Vercel), los
// archivos de ejemplo se suben a Vercel Blob igual que lo haría el admin;
// si no, se referencian tal cual en storage/ (disco local en desarrollo).
// Se cachean por nombre de archivo porque varios contenidos de ejemplo
// reutilizan los mismos 3 archivos de demo.
const assetKeyCache = new Map<string, string>();
async function demoAssetKey(kind: "videos" | "documents", localFileName: string) {
  const cacheKey = `${kind}/${localFileName}`;
  const cached = assetKeyCache.get(cacheKey);
  if (cached) return cached;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    assetKeyCache.set(cacheKey, cacheKey);
    return cacheKey;
  }

  const fullPath = path.join(__dirname, "..", "storage", kind, localFileName);
  const data = await fs.readFile(fullPath);
  const key = await saveUploadedFile(kind, localFileName, data);
  assetKeyCache.set(cacheKey, key);
  return key;
}

const PLAN_FEATURES = JSON.stringify([
  "Acceso a todos los semestres publicados",
  "Video clases en el reproductor propio de la plataforma",
  "Material PDF descargable",
  "Quizzes de autoevaluación",
  "Preguntas y respuestas con profesores",
]);

async function main() {
  console.log("Sembrando planes...");
  await prisma.plan.upsert({
    where: { id: "plan-free" },
    create: {
      id: "plan-free",
      name: "Plan Gratuito",
      description: "Empieza a estudiar sin costo. Mismas ventajas que Premium por ahora.",
      priceCents: 0,
      currency: "mxn",
      interval: "MONTH",
      features: PLAN_FEATURES,
      order: 1,
    },
    update: { features: PLAN_FEATURES },
  });

  await prisma.plan.upsert({
    where: { id: "plan-premium" },
    create: {
      id: "plan-premium",
      name: "Plan Premium",
      description: "Apoya el desarrollo de la plataforma. Mismas ventajas que el plan gratuito por ahora.",
      priceCents: 39900,
      currency: "mxn",
      interval: "MONTH",
      features: PLAN_FEATURES,
      order: 2,
    },
    update: { features: PLAN_FEATURES },
  });

  console.log("Sembrando usuarios de prueba...");
  const adminPasswordHash = await bcrypt.hash("Oswaldo_2008!", 12);
  const studentPasswordHash = await bcrypt.hash("Oswalfo_2008!", 12);

  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    create: {
      id: "user-admin",
      name: "Administrador",
      email: "admin@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
    update: { passwordHash: adminPasswordHash, role: "ADMIN" },
  });

  const student = await prisma.user.upsert({
    where: { email: "user@gmail.com" },
    create: {
      id: "user-student",
      name: "Estudiante Demo",
      email: "user@gmail.com",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      emailVerified: new Date(),
    },
    update: { passwordHash: studentPasswordHash, role: "STUDENT" },
  });

  await prisma.subscription.upsert({
    where: { id: "sub-student-free" },
    create: {
      id: "sub-student-free",
      userId: student.id,
      planId: "plan-free",
      status: "FREE",
    },
    update: {},
  });

  console.log("Sembrando Semestre 1...");
  const semester = await prisma.semester.upsert({
    where: { id: "semester-1" },
    create: {
      id: "semester-1",
      title: "Semestre 1",
      description: "Fundamentos de ciencias básicas: anatomía, fisiología y biología celular.",
      order: 1,
      status: "PUBLISHED",
    },
    update: {},
  });

  const anatomia = await prisma.subject.upsert({
    where: { id: "subject-anatomia" },
    create: {
      id: "subject-anatomia",
      semesterId: semester.id,
      title: "Anatomía",
      description: "Estructura del cuerpo humano.",
      order: 1,
      status: "PUBLISHED",
      unlockMode: "SEQUENTIAL",
    },
    update: {},
  });

  const fisiologia = await prisma.subject.upsert({
    where: { id: "subject-fisiologia" },
    create: {
      id: "subject-fisiologia",
      semesterId: semester.id,
      title: "Fisiología",
      description: "Función de los sistemas del cuerpo humano.",
      order: 2,
      status: "PUBLISHED",
      unlockMode: "SEQUENTIAL",
    },
    update: {},
  });

  const biologia = await prisma.subject.upsert({
    where: { id: "subject-biologia-celular" },
    create: {
      id: "subject-biologia-celular",
      semesterId: semester.id,
      title: "Biología celular",
      description: "La célula como unidad básica de la vida.",
      order: 3,
      status: "PUBLISHED",
      unlockMode: "FREE",
    },
    update: {},
  });

  const seccionAnatomia = await prisma.section.upsert({
    where: { id: "section-anatomia-general" },
    create: {
      id: "section-anatomia-general",
      subjectId: anatomia.id,
      title: "Generalidades",
      order: 1,
      status: "PUBLISHED",
    },
    update: {},
  });

  const seccionFisiologia = await prisma.section.upsert({
    where: { id: "section-fisiologia-general" },
    create: {
      id: "section-fisiologia-general",
      subjectId: fisiologia.id,
      title: "Generalidades",
      order: 1,
      status: "PUBLISHED",
    },
    update: {},
  });

  const seccionCicloCelular = await prisma.section.upsert({
    where: { id: "section-ciclo-celular" },
    create: {
      id: "section-ciclo-celular",
      subjectId: biologia.id,
      title: "Ciclo celular",
      order: 1,
      status: "PUBLISHED",
    },
    update: {},
  });

  console.log("Sembrando contenido...");

  // ---- Anatomía ----
  const anatVideo1 = await prisma.content.upsert({
    where: { id: "content-anat-video-1" },
    create: {
      id: "content-anat-video-1",
      sectionId: seccionAnatomia.id,
      type: "VIDEO",
      title: "Introducción y terminología anatómica",
      description: "Planos anatómicos, posición anatómica estándar y términos de dirección.",
      order: 1,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: anatVideo1.id },
    create: { contentId: anatVideo1.id, storageKey: await demoAssetKey("videos", "demo-intro.mp4"), durationSeconds: 10 },
    update: {},
  });

  const anatVideo2 = await prisma.content.upsert({
    where: { id: "content-anat-video-2" },
    create: {
      id: "content-anat-video-2",
      sectionId: seccionAnatomia.id,
      type: "VIDEO",
      title: "Sistema óseo",
      description: "Huesos largos, cortos, planos e irregulares. Clasificación general.",
      order: 2,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: anatVideo2.id },
    create: { contentId: anatVideo2.id, storageKey: await demoAssetKey("videos", "demo-g1.mp4"), durationSeconds: 8 },
    update: {},
  });

  const anatPdf = await prisma.content.upsert({
    where: { id: "content-anat-pdf-1" },
    create: {
      id: "content-anat-pdf-1",
      sectionId: seccionAnatomia.id,
      type: "PDF",
      title: "Apuntes — Terminología anatómica",
      order: 3,
      status: "PUBLISHED",
    },
    update: {},
  });
  await prisma.document.upsert({
    where: { contentId: anatPdf.id },
    create: {
      contentId: anatPdf.id,
      storageKey: await demoAssetKey("documents", "demo-apuntes.pdf"),
      fileName: "Terminologia-anatomica.pdf",
    },
    update: {},
  });

  const anatQuiz = await prisma.content.upsert({
    where: { id: "content-anat-quiz-1" },
    create: {
      id: "content-anat-quiz-1",
      sectionId: seccionAnatomia.id,
      type: "QUIZ",
      title: "Quiz — Terminología anatómica",
      order: 4,
      status: "PUBLISHED",
    },
    update: {},
  });
  const anatQuizModel = await prisma.quiz.upsert({
    where: { contentId: anatQuiz.id },
    create: { contentId: anatQuiz.id, passingScore: 70, maxAttempts: 3 },
    update: {},
  });
  await seedQuestion(anatQuizModel.id, "q-anat-1", "¿Qué plano divide el cuerpo en mitades izquierda y derecha?", [
    ["Plano sagital", true],
    ["Plano coronal", false],
    ["Plano transverso", false],
    ["Plano oblicuo", false],
  ]);

  // ---- Fisiología ----
  const fisioVideo1 = await prisma.content.upsert({
    where: { id: "content-fisio-video-1" },
    create: {
      id: "content-fisio-video-1",
      sectionId: seccionFisiologia.id,
      type: "VIDEO",
      title: "Potencial de reposo",
      description: "Bases iónicas del potencial de membrana en reposo.",
      order: 1,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: fisioVideo1.id },
    create: { contentId: fisioVideo1.id, storageKey: await demoAssetKey("videos", "demo-intro.mp4"), durationSeconds: 10 },
    update: {},
  });

  const fisioVideo2 = await prisma.content.upsert({
    where: { id: "content-fisio-video-2" },
    create: {
      id: "content-fisio-video-2",
      sectionId: seccionFisiologia.id,
      type: "VIDEO",
      title: "Potencial de acción",
      description: "Fases de despolarización y repolarización.",
      order: 2,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: fisioVideo2.id },
    create: { contentId: fisioVideo2.id, storageKey: await demoAssetKey("videos", "demo-g1.mp4"), durationSeconds: 8 },
    update: {},
  });

  // Contenido en borrador: demuestra el flujo de publicación (punto 28).
  await prisma.content.upsert({
    where: { id: "content-fisio-video-3-draft" },
    create: {
      id: "content-fisio-video-3-draft",
      sectionId: seccionFisiologia.id,
      type: "VIDEO",
      title: "Transporte a través de la membrana",
      description: "Borrador: pendiente de revisión antes de publicar.",
      order: 3,
      status: "DRAFT",
      completionThreshold: 90,
    },
    update: {},
  });

  const fisioQuiz = await prisma.content.upsert({
    where: { id: "content-fisio-quiz-1" },
    create: {
      id: "content-fisio-quiz-1",
      sectionId: seccionFisiologia.id,
      type: "QUIZ",
      title: "Quiz — Potencial de membrana",
      order: 4,
      status: "PUBLISHED",
    },
    update: {},
  });
  const fisioQuizModel = await prisma.quiz.upsert({
    where: { contentId: fisioQuiz.id },
    create: { contentId: fisioQuiz.id, passingScore: 70, maxAttempts: null },
    update: {},
  });
  await seedQuestion(fisioQuizModel.id, "q-fisio-1", "¿Qué ion es principalmente responsable del potencial de reposo?", [
    ["Sodio (Na+)", false],
    ["Potasio (K+)", true],
    ["Calcio (Ca2+)", false],
    ["Cloro (Cl-)", false],
  ]);

  // ---- Biología celular > Ciclo celular ----
  const bioVideo1 = await prisma.content.upsert({
    where: { id: "content-bio-video-1" },
    create: {
      id: "content-bio-video-1",
      sectionId: seccionCicloCelular.id,
      type: "VIDEO",
      title: "Introducción al ciclo celular",
      order: 1,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: bioVideo1.id },
    create: { contentId: bioVideo1.id, storageKey: await demoAssetKey("videos", "demo-intro.mp4"), durationSeconds: 10 },
    update: {},
  });

  const bioVideo2 = await prisma.content.upsert({
    where: { id: "content-bio-video-2" },
    create: {
      id: "content-bio-video-2",
      sectionId: seccionCicloCelular.id,
      type: "VIDEO",
      title: "Fase G1",
      order: 2,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: bioVideo2.id },
    create: { contentId: bioVideo2.id, storageKey: await demoAssetKey("videos", "demo-g1.mp4"), durationSeconds: 8 },
    update: {},
  });

  const bioVideo3 = await prisma.content.upsert({
    where: { id: "content-bio-video-3" },
    create: {
      id: "content-bio-video-3",
      sectionId: seccionCicloCelular.id,
      type: "VIDEO",
      title: "Fase S — Replicación del ADN",
      order: 3,
      status: "PUBLISHED",
      completionThreshold: 90,
    },
    update: {},
  });
  await prisma.videoAsset.upsert({
    where: { contentId: bioVideo3.id },
    create: { contentId: bioVideo3.id, storageKey: await demoAssetKey("videos", "demo-intro.mp4"), durationSeconds: 10 },
    update: {},
  });

  const bioPdf = await prisma.content.upsert({
    where: { id: "content-bio-pdf-1" },
    create: {
      id: "content-bio-pdf-1",
      sectionId: seccionCicloCelular.id,
      type: "PDF",
      title: "Apuntes — Ciclo celular",
      order: 4,
      status: "PUBLISHED",
    },
    update: {},
  });
  await prisma.document.upsert({
    where: { contentId: bioPdf.id },
    create: { contentId: bioPdf.id, storageKey: await demoAssetKey("documents", "demo-apuntes.pdf"), fileName: "Ciclo-celular.pdf" },
    update: {},
  });

  const bioQuiz = await prisma.content.upsert({
    where: { id: "content-bio-quiz-1" },
    create: {
      id: "content-bio-quiz-1",
      sectionId: seccionCicloCelular.id,
      type: "QUIZ",
      title: "Quiz — Ciclo celular",
      order: 5,
      status: "PUBLISHED",
    },
    update: {},
  });
  const bioQuizModel = await prisma.quiz.upsert({
    where: { contentId: bioQuiz.id },
    create: { contentId: bioQuiz.id, passingScore: 70, maxAttempts: 3 },
    update: {},
  });
  await seedQuestion(bioQuizModel.id, "q-bio-1", "¿Cuál es la fase donde ocurre la replicación del ADN?", [
    ["G1", false],
    ["S", true],
    ["G2", false],
    ["M", false],
  ]);

  console.log("Sembrando progreso de ejemplo para el estudiante demo...");
  await prisma.contentProgress.upsert({
    where: { userId_contentId: { userId: student.id, contentId: anatVideo1.id } },
    create: {
      userId: student.id,
      contentId: anatVideo1.id,
      status: "COMPLETED",
      watchedPercent: 100,
      watchedSeconds: 10,
      completedAt: new Date(),
    },
    update: {},
  });

  console.log("Listo.");
  console.log("  Admin:     admin@gmail.com / Oswaldo_2008!");
  console.log("  Estudiante: user@gmail.com / Oswalfo_2008!");
}

async function seedQuestion(
  quizId: string,
  id: string,
  prompt: string,
  answers: [string, boolean][],
) {
  await prisma.quizQuestion.upsert({
    where: { id },
    create: {
      id,
      quizId,
      prompt,
      order: 1,
      answers: {
        create: answers.map(([text, isCorrect], i) => ({
          id: `${id}-a${i + 1}`,
          text,
          isCorrect,
          order: i + 1,
        })),
      },
    },
    update: {},
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
