import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_OPTIONS, STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/labels";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { createSemester, updateSemester, setSemesterStatus, deleteSemester, moveSemester } from "./actions";

export const metadata: Metadata = { title: "Admin · Semestres" };

export default async function AdminSemestersPage() {
  const semesters = await prisma.semester.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { subjects: true } } },
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-ink-900">Semestres</h1>
      <p className="mt-1 text-ink-500">Crea y ordena los semestres del temario.</p>

      <form action={createSemester} className="card mt-6 grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto]">
        <input className="input" type="text" name="title" placeholder="Nombre, ej. Semestre 9" required />
        <input className="input" type="text" name="description" placeholder="Descripción (opcional)" />
        <button type="submit" className="btn-primary">
          Crear semestre
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {semesters.map((semester, index) => (
          <li key={semester.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <form action={moveSemester.bind(null, semester.id, "up")}>
                  <button type="submit" disabled={index === 0} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▲</button>
                </form>
                <form action={moveSemester.bind(null, semester.id, "down")}>
                  <button type="submit" disabled={index === semesters.length - 1} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▼</button>
                </form>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink-900">{semester.title}</h2>
                  <span className={STATUS_BADGE_CLASS[semester.status]}>{STATUS_LABEL[semester.status]}</span>
                </div>
                {semester.description && <p className="text-sm text-ink-500">{semester.description}</p>}
                <p className="mt-1 text-xs text-ink-500">{semester._count.subjects} materia(s)</p>
              </div>

              <form action={setSemesterStatus.bind(null, semester.id)}>
                <AutoSubmitSelect name="status" defaultValue={semester.status} options={STATUS_OPTIONS} />
              </form>

              <Link href={`/admin/semestres/${semester.id}`} className="btn-outline">
                Ver materias →
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-soft pt-3">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-brand-600">Editar</summary>
                <form action={updateSemester.bind(null, semester.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <input className="input" type="text" name="title" defaultValue={semester.title} required />
                  <input className="input" type="text" name="description" defaultValue={semester.description ?? ""} />
                  <button type="submit" className="btn-primary">Guardar</button>
                </form>
              </details>

              <form action={deleteSemester.bind(null, semester.id)} className="ml-auto">
                <ConfirmButton confirmText={`¿Eliminar "${semester.title}" y todo su contenido?`} className="btn-ghost text-accent-700">
                  Eliminar
                </ConfirmButton>
              </form>
            </div>
          </li>
        ))}
        {semesters.length === 0 && (
          <li className="card p-8 text-center text-ink-500">Todavía no hay semestres. Crea el primero arriba.</li>
        )}
      </ul>
    </div>
  );
}
