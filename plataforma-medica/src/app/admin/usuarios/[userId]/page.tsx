import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAllSemestersProgress, getProgressSummary } from "@/lib/progress";
import { loadSubjectTree, computeContentStates, flattenContents } from "@/lib/content-tree";
import { changeUserPlan, unlockContentForUser } from "../actions";

export const metadata: Metadata = { title: "Detalle de usuario | Administración" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptions: { include: { plan: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
  });
  if (!user) notFound();

  const [plans, overall, semesters, subjects] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    getProgressSummary(userId),
    getAllSemestersProgress(userId),
    prisma.subject.findMany({ where: { status: "PUBLISHED" }, orderBy: { order: "asc" } }),
  ]);

  const lockedBySubject = await Promise.all(
    subjects.map(async (subject) => {
      const tree = await loadSubjectTree(subject.id);
      const states = await computeContentStates(userId, subject.unlockMode, tree);
      const locked = flattenContents(tree).filter((c) => states.get(c.id)?.locked);
      return { subject, locked };
    }),
  );

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href="/admin/usuarios" className="text-sm text-ink-500 hover:text-ink-900">← Usuarios</Link>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">{user.name}</h1>
      <p className="text-ink-500">{user.email}</p>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Plan y suscripción</h2>
        <p className="mt-1 text-sm text-ink-500">
          Plan actual: <strong>{user.subscriptions[0]?.plan.name ?? "Sin plan"}</strong> ·{" "}
          Estado: {user.subscriptions[0]?.status ?? "—"}
        </p>
        <form action={changeUserPlan.bind(null, userId)} className="mt-3 flex flex-wrap gap-2">
          <select name="planId" className="input" defaultValue={user.subscriptions[0]?.planId ?? ""}>
            <option value="" disabled>Cambiar plan a...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-outline">Asignar plan</button>
        </form>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Progreso</h2>
        <p className="mt-1 text-sm text-ink-500">General: {overall.percent}% ({overall.completed}/{overall.total})</p>
        <ul className="mt-3 space-y-1 text-sm">
          {semesters.filter((s) => s.total > 0).map((s) => (
            <li key={s.semester.id} className="flex justify-between">
              <span className="text-ink-700">{s.semester.title}</span>
              <span className="font-medium text-ink-900">{s.percent}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Contenido bloqueado</h2>
        <p className="mt-1 text-sm text-ink-500">Desbloquea contenido específico para este estudiante.</p>
        <div className="mt-4 space-y-4">
          {lockedBySubject.filter((s) => s.locked.length > 0).map(({ subject, locked }) => (
            <div key={subject.id}>
              <p className="text-sm font-semibold text-ink-900">{subject.title}</p>
              <ul className="mt-2 divide-y divide-border-soft rounded-lg border border-border-soft">
                {locked.map((content) => (
                  <li key={content.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                    <span className="text-ink-700">{content.title}</span>
                    <form action={unlockContentForUser.bind(null, userId, content.id)} className="flex items-center gap-2">
                      <input type="text" name="reason" placeholder="Motivo (opcional)" className="input py-1 text-xs" />
                      <button type="submit" className="btn-primary px-3 py-1.5 text-xs">Desbloquear</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {lockedBySubject.every((s) => s.locked.length === 0) && (
            <p className="text-sm text-ink-500">Este estudiante no tiene contenido bloqueado pendiente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
