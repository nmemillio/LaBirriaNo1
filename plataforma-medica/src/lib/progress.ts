import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Scope = { subjectId?: string; semesterId?: string };

function contentScopeWhere(scope: Scope): Prisma.ContentWhereInput {
  return {
    status: "PUBLISHED",
    section: {
      status: "PUBLISHED",
      ...(scope.subjectId ? { subjectId: scope.subjectId } : {}),
      subject: {
        status: "PUBLISHED",
        ...(scope.semesterId ? { semesterId: scope.semesterId } : {}),
        semester: { status: "PUBLISHED" },
      },
    },
  };
}

export type ProgressSummary = { total: number; completed: number; percent: number };

/**
 * El progreso SIEMPRE se calcula desde el contenido publicado actual y las
 * filas de ContentProgress completadas — nunca desde un porcentaje
 * guardado. Así, si el admin agrega contenido nuevo, el porcentaje baja
 * automáticamente la próxima vez que se consulta (punto 8 del brief).
 */
export async function getProgressSummary(userId: string, scope: Scope = {}): Promise<ProgressSummary> {
  const where = contentScopeWhere(scope);
  const [total, completed] = await Promise.all([
    prisma.content.count({ where }),
    prisma.contentProgress.count({ where: { userId, status: "COMPLETED", content: where } }),
  ]);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}

export async function getSemesterBreakdown(userId: string, semesterId: string) {
  const subjects = await prisma.subject.findMany({
    where: { semesterId, status: "PUBLISHED" },
    orderBy: { order: "asc" },
  });
  return Promise.all(
    subjects.map(async (subject) => ({
      subject,
      ...(await getProgressSummary(userId, { subjectId: subject.id })),
    })),
  );
}

export async function getAllSemestersProgress(userId: string) {
  const semesters = await prisma.semester.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
  });
  return Promise.all(
    semesters.map(async (semester) => ({
      semester,
      ...(await getProgressSummary(userId, { semesterId: semester.id })),
    })),
  );
}

/**
 * Registra el avance de un video. No marca "completado" solo por abrirlo
 * (punto 32): se necesita alcanzar el umbral configurado por el admin
 * (content.completionThreshold, 90% por defecto). El porcentaje nunca
 * retrocede si el usuario vuelve a ver el video desde el inicio.
 */
export async function recordVideoProgress(userId: string, contentId: string, watchedSeconds: number, watchedPercentRaw: number) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content || content.type !== "VIDEO") throw new Error("Contenido de video no encontrado");

  const watchedPercent = Math.max(0, Math.min(100, Math.round(watchedPercentRaw)));

  const existing = await prisma.contentProgress.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  const bestPercent = Math.max(existing?.watchedPercent ?? 0, watchedPercent);
  const alreadyCompleted = existing?.status === "COMPLETED";
  const nowCompleted = alreadyCompleted || bestPercent >= content.completionThreshold;

  const progress = await prisma.contentProgress.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: {
      userId,
      contentId,
      watchedSeconds,
      watchedPercent: bestPercent,
      status: nowCompleted ? "COMPLETED" : bestPercent > 0 ? "IN_PROGRESS" : "NOT_STARTED",
      completedAt: nowCompleted ? new Date() : null,
    },
    update: {
      watchedSeconds: Math.max(existing?.watchedSeconds ?? 0, watchedSeconds),
      watchedPercent: bestPercent,
      status: nowCompleted ? "COMPLETED" : bestPercent > 0 ? "IN_PROGRESS" : "NOT_STARTED",
      completedAt: nowCompleted && !alreadyCompleted ? new Date() : existing?.completedAt,
    },
  });

  await prisma.videoView.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: {
      userId,
      contentId,
      secondsWatched: watchedSeconds,
      maxPercent: bestPercent,
      completed: nowCompleted,
    },
    update: {
      secondsWatched: Math.max(watchedSeconds, 0),
      maxPercent: bestPercent,
      completed: nowCompleted,
    },
  });

  return progress;
}

export async function recordQuizAttempt(
  userId: string,
  quizId: string,
  selectedAnswerIdsByQuestion: Record<string, string>,
) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { answers: true } }, content: true },
  });
  if (!quiz) throw new Error("Quiz no encontrado");

  if (quiz.maxAttempts) {
    const attemptsSoFar = await prisma.quizAttempt.count({ where: { quizId, userId } });
    if (attemptsSoFar >= quiz.maxAttempts) {
      throw new Error("Se alcanzó el número máximo de intentos permitidos");
    }
  }

  let correct = 0;
  const detail = quiz.questions.map((question) => {
    const selectedId = selectedAnswerIdsByQuestion[question.id];
    const correctAnswer = question.answers.find((a) => a.isCorrect);
    const isCorrect = Boolean(selectedId && correctAnswer && selectedId === correctAnswer.id);
    if (isCorrect) correct += 1;
    return {
      questionId: question.id,
      selectedId: selectedId ?? null,
      correctId: correctAnswer?.id ?? null,
      isCorrect,
      explanation: question.explanation,
    };
  });

  const score = quiz.questions.length === 0 ? 0 : Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  await prisma.quizAttempt.create({ data: { quizId, userId, score, passed } });

  if (passed) {
    const existing = await prisma.contentProgress.findUnique({
      where: { userId_contentId: { userId, contentId: quiz.contentId } },
    });
    await prisma.contentProgress.upsert({
      where: { userId_contentId: { userId, contentId: quiz.contentId } },
      create: {
        userId,
        contentId: quiz.contentId,
        status: "COMPLETED",
        watchedPercent: 100,
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        watchedPercent: 100,
        completedAt: existing?.completedAt ?? new Date(),
      },
    });
  }

  return { score, passed, correct, total: quiz.questions.length, detail };
}

/**
 * Marca un PDF (u otro contenido sin métrica de % de avance) como
 * completado — se usa cuando el estudiante confirma que lo revisó.
 */
export async function markContentViewed(userId: string, contentId: string) {
  const existing = await prisma.contentProgress.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
  return prisma.contentProgress.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId, status: "COMPLETED", watchedPercent: 100, completedAt: new Date() },
    update: { status: "COMPLETED", watchedPercent: 100, completedAt: existing?.completedAt ?? new Date() },
  });
}

export async function grantManualUnlock(adminId: string, userId: string, contentId: string, reason?: string) {
  return prisma.manualUnlock.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId, unlockedById: adminId, reason },
    update: { unlockedById: adminId, reason, createdAt: new Date() },
  });
}
