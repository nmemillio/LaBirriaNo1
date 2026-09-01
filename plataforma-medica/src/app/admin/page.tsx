import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Panel de administración | Medicación" };

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    activeSubscriptions,
    semesters,
    subjects,
    videos,
    documents,
    quizzes,
    payments,
    recentUsers,
    mostViewed,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING", "FREE"] } } }),
    prisma.semester.count(),
    prisma.subject.count(),
    prisma.videoAsset.count(),
    prisma.document.count(),
    prisma.quiz.count(),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountCents: true } }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.videoView.findMany({
      orderBy: { secondsWatched: "desc" },
      take: 5,
      include: { content: true },
    }),
  ]);

  const revenue = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    (payments._sum.amountCents ?? 0) / 100,
  );

  const stats = [
    { label: "Estudiantes", value: totalUsers },
    { label: "Suscripciones activas", value: activeSubscriptions },
    { label: "Ingresos totales", value: revenue },
    { label: "Semestres", value: semesters },
    { label: "Materias", value: subjects },
    { label: "Videos", value: videos },
    { label: "PDFs", value: documents },
    { label: "Quizzes", value: quizzes },
  ];

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Panel de administración</h1>
        <Link href="/admin/semestres" className="btn-primary">
          Administrar contenido
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{s.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Estudiantes recientes</h2>
          {recentUsers.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">Todavía no hay estudiantes registrados.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border-soft">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">{u.name}</p>
                    <p className="text-xs text-ink-500">{u.email}</p>
                  </div>
                  <span className="text-xs text-ink-500">{u.createdAt.toLocaleDateString("es-MX")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-ink-900">Videos más vistos</h2>
          {mostViewed.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">Aún no hay reproducciones registradas.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border-soft">
              {mostViewed.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-ink-900">{v.content.title}</span>
                  <span className="text-xs text-ink-500">{v.secondsWatched}s · {v.maxPercent}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
