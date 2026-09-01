import { prisma } from "@/lib/prisma";
import { loadSubjectTree, computeContentStates, flattenContents } from "@/lib/content-tree";
import { getProgressSummary, getAllSemestersProgress } from "@/lib/progress";

export async function getContinueLearning(userId: string) {
  const subjects = await prisma.subject.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ semester: { order: "asc" } }, { order: "asc" }],
    include: { semester: true },
  });

  let fallback: {
    subject: (typeof subjects)[number];
    contentId: string;
    contentTitle: string;
  } | null = null;

  for (const subject of subjects) {
    const tree = await loadSubjectTree(subject.id);
    const flat = flattenContents(tree);
    if (flat.length === 0) continue;

    const states = await computeContentStates(userId, subject.unlockMode, tree);

    for (const content of flat) {
      const state = states.get(content.id)!;
      if (state.status === "IN_PROGRESS") {
        return { subject, contentId: content.id, contentTitle: content.title };
      }
    }
    if (!fallback) {
      const nextUnlocked = flat.find((c) => {
        const s = states.get(c.id)!;
        return !s.locked && s.status === "NOT_STARTED";
      });
      if (nextUnlocked) {
        fallback = { subject, contentId: nextUnlocked.id, contentTitle: nextUnlocked.title };
      }
    }
  }

  return fallback;
}

export async function getDashboardData(userId: string) {
  const [overall, semesters, continueLearning] = await Promise.all([
    getProgressSummary(userId),
    getAllSemestersProgress(userId),
    getContinueLearning(userId),
  ]);

  const semesterBreakdowns = await Promise.all(
    semesters.map(async ({ semester, ...summary }) => {
      const subjects = await prisma.subject.findMany({
        where: { semesterId: semester.id, status: "PUBLISHED" },
        orderBy: { order: "asc" },
      });
      const subjectSummaries = await Promise.all(
        subjects.map(async (subject) => ({
          subject,
          ...(await getProgressSummary(userId, { subjectId: subject.id })),
        })),
      );
      return { semester, ...summary, subjects: subjectSummaries };
    }),
  );

  return { overall, semesters: semesterBreakdowns, continueLearning };
}
