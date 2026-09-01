import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard";
import { ProgressBar } from "@/components/progress-bar";

export const metadata: Metadata = { title: "Mi panel" };

export default async function StudentDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const firstName = (session!.user.name ?? "Estudiante").split(" ")[0];

  const { overall, semesters, continueLearning } = await getDashboardData(userId);
  const hasAnyContent = semesters.some((s) => s.total > 0);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Hola, {firstName}</h1>
        <p className="text-ink-500">
          {overall.total === 0
            ? "Todavía no hay contenido publicado. Vuelve pronto."
            : "Continúa aprendiendo donde te quedaste."}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {continueLearning ? (
          <Link
            href={`/app/materias/${continueLearning.subject.id}?item=${continueLearning.contentId}`}
            className="card group flex flex-col justify-between overflow-hidden p-6 transition-shadow hover:shadow-md"
          >
            <div>
              <span className="badge-brand">Continuar aprendiendo</span>
              <h2 className="mt-3 text-xl font-bold text-ink-900">{continueLearning.subject.title}</h2>
              <p className="mt-1 text-sm text-ink-500">{continueLearning.contentTitle}</p>
            </div>
            <span className="btn-primary mt-6 w-fit">Continuar →</span>
          </Link>
        ) : hasAnyContent ? (
          <div className="card flex flex-col items-start justify-center p-6">
            <span className="badge-brand">¡Vas muy bien!</span>
            <p className="mt-3 text-lg font-semibold text-ink-900">
              Completaste todo el contenido disponible por ahora.
            </p>
            <p className="mt-1 text-sm text-ink-500">Vuelve pronto por más materias.</p>
          </div>
        ) : (
          <div className="card flex flex-col items-start justify-center p-6">
            <p className="text-lg font-semibold text-ink-900">Aún no hay semestres publicados</p>
            <p className="mt-1 text-sm text-ink-500">El administrador está preparando el contenido.</p>
          </div>
        )}

        <div className="card p-6">
          <span className="badge-muted">Progreso general</span>
          <p className="mt-3 text-3xl font-extrabold text-ink-900">{overall.percent}%</p>
          <p className="text-sm text-ink-500">
            {overall.completed} / {overall.total} contenidos completados
          </p>
          <div className="mt-4">
            <ProgressBar percent={overall.percent} />
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-10">
        {semesters
          .filter((s) => s.total > 0)
          .map(({ semester, percent, subjects }) => (
            <section key={semester.id}>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink-900">{semester.title}</h2>
                  {semester.description && (
                    <p className="text-sm text-ink-500">{semester.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-brand-600">{percent}%</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map(({ subject, percent: subjectPercent, completed, total }) => (
                  <Link
                    key={subject.id}
                    href={`/app/materias/${subject.id}`}
                    className="card p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-ink-900">{subject.title}</h3>
                      {percent === 100 && total > 0 && (
                        <span className="badge-brand">Completado</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {completed} / {total} contenidos
                    </p>
                    <div className="mt-4">
                      <ProgressBar percent={subjectPercent} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
