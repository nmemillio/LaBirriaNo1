import { prisma } from "@/lib/prisma";
import type {
  Content,
  Section,
  VideoAsset,
  Document,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  UnlockMode,
  ProgressStatus,
} from "@prisma/client";

export type ContentWithMedia = Content & {
  video: VideoAsset | null;
  document: Document | null;
  quiz: (Quiz & { questions: (QuizQuestion & { answers: QuizAnswer[] })[] }) | null;
};

export type SectionNode = Section & {
  contents: ContentWithMedia[];
  children: SectionNode[];
};

export type ContentState = {
  content: ContentWithMedia;
  order: number; // posición global dentro de la materia (para saber "el siguiente")
  locked: boolean;
  status: ProgressStatus;
  watchedPercent: number;
  manuallyUnlocked: boolean;
};

/**
 * Carga la estructura sección/subsección/contenido de una materia como un
 * árbol. `includeUnpublished` se usa en el panel de administrador para ver
 * también borradores y contenido oculto.
 */
export async function loadSubjectTree(
  subjectId: string,
  opts: { includeUnpublished?: boolean } = {},
): Promise<SectionNode[]> {
  const sections = await prisma.section.findMany({
    where: {
      subjectId,
      ...(opts.includeUnpublished ? {} : { status: "PUBLISHED" }),
    },
    orderBy: { order: "asc" },
  });

  const contents = sections.length
    ? await prisma.content.findMany({
        where: {
          sectionId: { in: sections.map((s) => s.id) },
          ...(opts.includeUnpublished ? {} : { status: "PUBLISHED" }),
        },
        orderBy: { order: "asc" },
        include: {
          video: true,
          document: true,
          quiz: {
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: { answers: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      })
    : [];

  const contentsBySection = new Map<string, ContentWithMedia[]>();
  for (const c of contents) {
    const list = contentsBySection.get(c.sectionId) ?? [];
    list.push(c as ContentWithMedia);
    contentsBySection.set(c.sectionId, list);
  }

  const byId = new Map<string, SectionNode>();
  for (const s of sections) {
    byId.set(s.id, { ...s, contents: contentsBySection.get(s.id) ?? [], children: [] });
  }
  const roots: SectionNode[] = [];
  for (const s of sections) {
    const node = byId.get(s.id)!;
    if (s.parentId && byId.has(s.parentId)) {
      byId.get(s.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function flattenContents(tree: SectionNode[]): ContentWithMedia[] {
  const out: ContentWithMedia[] = [];
  const visit = (nodes: SectionNode[]) => {
    for (const node of nodes) {
      out.push(...node.contents);
      visit(node.children);
    }
  };
  visit(tree);
  return out;
}

export function flattenSections(tree: SectionNode[]): SectionNode[] {
  const out: SectionNode[] = [];
  const visit = (nodes: SectionNode[]) => {
    for (const node of nodes) {
      out.push(node);
      visit(node.children);
    }
  };
  visit(tree);
  return out;
}

/**
 * Calcula, para un usuario, qué contenido está bloqueado/desbloqueado y su
 * estado de progreso — sección 9 y 10 del brief. El resultado nunca se
 * guarda: se recalcula en cada carga a partir del contenido publicado
 * actual y del progreso real del usuario (sección 8).
 */
export async function computeContentStates(
  userId: string,
  unlockMode: UnlockMode,
  tree: SectionNode[],
): Promise<Map<string, ContentState>> {
  const flat = flattenContents(tree);
  const contentIds = flat.map((c) => c.id);

  const [progressRows, manualUnlocks] = await Promise.all([
    contentIds.length
      ? prisma.contentProgress.findMany({ where: { userId, contentId: { in: contentIds } } })
      : Promise.resolve([]),
    contentIds.length
      ? prisma.manualUnlock.findMany({ where: { userId, contentId: { in: contentIds } } })
      : Promise.resolve([]),
  ]);

  const progressById = new Map(progressRows.map((p) => [p.contentId, p]));
  const manualIds = new Set(manualUnlocks.map((m) => m.contentId));

  const states = new Map<string, ContentState>();
  let previousCompleted = true;

  flat.forEach((content, index) => {
    const progress = progressById.get(content.id);
    const manuallyUnlocked = manualIds.has(content.id);
    const status = progress?.status ?? "NOT_STARTED";

    let locked: boolean;
    if (unlockMode === "FREE") {
      locked = false;
    } else if (unlockMode === "MANUAL") {
      locked = !manuallyUnlocked && status === "NOT_STARTED";
    } else {
      locked = !previousCompleted && !manuallyUnlocked;
    }

    states.set(content.id, {
      content,
      order: index,
      locked,
      status,
      watchedPercent: progress?.watchedPercent ?? 0,
      manuallyUnlocked,
    });

    previousCompleted = status === "COMPLETED";
  });

  return states;
}
