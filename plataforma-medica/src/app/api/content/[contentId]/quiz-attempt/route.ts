import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasActiveAccess } from "@/lib/access";
import { loadSubjectTree, computeContentStates } from "@/lib/content-tree";
import { recordQuizAttempt } from "@/lib/progress";

export async function POST(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { quiz: true, section: { include: { subject: true } } },
  });
  if (!content || !content.quiz) {
    return NextResponse.json({ error: "Quiz no encontrado." }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) {
    if (content.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Este quiz no está publicado." }, { status: 403 });
    }
    const hasAccess = await userHasActiveAccess(session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Este contenido requiere una suscripción activa." }, { status: 402 });
    }
    const tree = await loadSubjectTree(content.section.subjectId);
    const states = await computeContentStates(session.user.id, content.section.subject.unlockMode, tree);
    const state = states.get(contentId);
    if (!state || state.locked) {
      return NextResponse.json({ error: "Este quiz todavía está bloqueado." }, { status: 423 });
    }
  }

  const body = await req.json().catch(() => null);
  const answers = (body?.answers ?? {}) as Record<string, string>;

  try {
    const result = await recordQuizAttempt(session.user.id, content.quiz.id, answers);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
