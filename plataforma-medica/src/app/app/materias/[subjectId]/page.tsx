import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadSubjectTree, computeContentStates, flattenContents, type ContentWithMedia } from "@/lib/content-tree";
import { userHasActiveAccess } from "@/lib/access";
import { signContentToken } from "@/lib/content-token";
import { ContentList } from "@/components/student/content-list";
import { VideoPlayer } from "@/components/student/video-player";
import { PdfViewer } from "@/components/student/pdf-viewer";
import { QuizView } from "@/components/student/quiz-view";
import { LockIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ item?: string }>;
}) {
  const { subjectId } = await params;
  const { item } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { semester: true },
  });
  if (!subject || subject.status !== "PUBLISHED") notFound();

  const tree = await loadSubjectTree(subjectId);
  const flat = flattenContents(tree);
  const states = await computeContentStates(userId, subject.unlockMode, tree);

  const hasAccess = await userHasActiveAccess(userId);

  const activeContent = item
    ? flat.find((c) => c.id === item)
    : flat.find((c) => !states.get(c.id)?.locked && states.get(c.id)?.status !== "COMPLETED") ?? flat[0];

  const activeIndex = activeContent ? flat.findIndex((c) => c.id === activeContent.id) : -1;
  const prev = activeIndex > 0 ? flat[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < flat.length - 1 ? flat[activeIndex + 1] : null;
  const activeState = activeContent ? states.get(activeContent.id) : undefined;

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <p className="text-sm text-ink-500">
          {subject.semester.title} · {subject.title}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">{subject.title}</h1>
        {subject.description && <p className="mt-1 max-w-2xl text-ink-500">{subject.description}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          {!activeContent ? (
            <div className="card p-8 text-center text-ink-500">
              Todavía no hay contenido publicado en esta materia.
            </div>
          ) : !hasAccess ? (
            <LockedUpsell />
          ) : activeState?.locked ? (
            <div className="card p-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-300">
                <LockIcon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-semibold text-ink-900">Este contenido todavía está bloqueado</p>
              <p className="mt-1 text-sm text-ink-500">Completa el contenido anterior para desbloquearlo.</p>
            </div>
          ) : (
            <ActiveContentViewer
              userId={userId}
              content={activeContent}
              completed={activeState?.status === "COMPLETED"}
              watchedPercent={activeState?.watchedPercent ?? 0}
            />
          )}

          {activeContent && hasAccess && !activeState?.locked && (
            <div className="mt-4 flex items-center justify-between">
              {prev ? (
                <Link href={`/app/materias/${subjectId}?item=${prev.id}`} className="btn-outline">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              {next && !states.get(next.id)?.locked && (
                <Link href={`/app/materias/${subjectId}?item=${next.id}`} className="btn-primary">
                  Siguiente
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <ContentList subjectId={subjectId} tree={tree} states={states} activeContentId={activeContent?.id ?? null} />
        </div>

        <details className="lg:hidden">
          <summary className="cursor-pointer rounded-full border border-border-soft bg-surface px-4 py-2.5 text-sm font-medium text-ink-700">
            Ver contenido de la materia
          </summary>
          <div className="mt-3">
            <ContentList subjectId={subjectId} tree={tree} states={states} activeContentId={activeContent?.id ?? null} />
          </div>
        </details>
      </div>
    </div>
  );
}

function LockedUpsell() {
  return (
    <div className="card p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
        <LockIcon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-lg font-semibold text-ink-900">Contenido premium</p>
      <p className="mt-1 text-sm text-ink-500">Este contenido requiere una suscripción activa.</p>
      <Link href="/precios" className="btn-primary mt-5 inline-flex">
        Ver planes
      </Link>
    </div>
  );
}

async function ActiveContentViewer({
  userId,
  content,
  completed,
  watchedPercent,
}: {
  userId: string;
  content: ContentWithMedia;
  completed: boolean;
  watchedPercent: number;
}) {
  if (content.type === "VIDEO" && content.video) {
    const token = signContentToken({ contentId: content.id, userId, kind: "video" });
    return (
      <div>
        <VideoPlayer
          contentId={content.id}
          src={`/api/content/${content.id}/video?t=${token}`}
          token={token}
          completionThreshold={content.completionThreshold}
          initialPercent={watchedPercent}
        />
        <ContentHeader title={content.title} description={content.description} completed={completed} />
      </div>
    );
  }

  if (content.type === "PDF" && content.document) {
    const token = signContentToken({ contentId: content.id, userId, kind: "document" });
    return (
      <div>
        <PdfViewer
          contentId={content.id}
          src={`/api/content/${content.id}/document?t=${token}`}
          token={token}
          fileName={content.document.fileName}
          alreadyCompleted={completed}
        />
        <ContentHeader title={content.title} description={content.description} completed={completed} />
      </div>
    );
  }

  if (content.type === "QUIZ" && content.quiz) {
    return (
      <QuizView
        contentId={content.id}
        title={content.title}
        passingScore={content.quiz.passingScore}
        questions={content.quiz.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          explanation: q.explanation,
          answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
        }))}
      />
    );
  }

  return <div className="card p-8 text-center text-ink-500">Este contenido no está disponible todavía.</div>;
}

function ContentHeader({ title, description, completed }: { title: string; description: string | null; completed: boolean }) {
  return (
    <div className="mt-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
        {completed && <span className="badge-brand shrink-0">Completado</span>}
      </div>
      {description && (
        <div className="mt-3 rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Explicación</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{description}</p>
        </div>
      )}
    </div>
  );
}
