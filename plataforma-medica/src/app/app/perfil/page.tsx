import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getAllSemestersProgress, getProgressSummary } from "@/lib/progress";
import { getActivePlanForUser } from "@/lib/plan-label";
import { ProgressBar } from "@/components/progress-bar";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [overall, semesters, planLabel] = await Promise.all([
    getProgressSummary(userId),
    getAllSemestersProgress(userId),
    getActivePlanForUser(userId),
  ]);

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-ink-900">Mi perfil</h1>

      <div className="card mt-6 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Nombre</dt>
            <dd className="mt-1 text-ink-900">{session!.user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Correo</dt>
            <dd className="mt-1 text-ink-900">{session!.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Plan actual</dt>
            <dd className="mt-1 text-ink-900">{planLabel ?? "Sin plan activo"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Progreso general</dt>
            <dd className="mt-1 text-ink-900">{overall.percent}%</dd>
          </div>
        </dl>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Mi progreso</h2>
        <div className="mt-4 space-y-4">
          {semesters.filter((s) => s.total > 0).map(({ semester, percent }) => (
            <ProgressBar key={semester.id} percent={percent} label={semester.title} compact />
          ))}
          {semesters.every((s) => s.total === 0) && (
            <p className="text-sm text-ink-500">Aún no hay contenido publicado.</p>
          )}
        </div>
        <Link href="/app" className="btn-primary mt-6 inline-flex">
          Continuar estudiando
        </Link>
      </div>
    </div>
  );
}
