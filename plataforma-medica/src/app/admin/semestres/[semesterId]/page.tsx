import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STATUS_OPTIONS, STATUS_BADGE_CLASS, STATUS_LABEL, UNLOCK_MODE_OPTIONS } from "@/lib/labels";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { createSubject, updateSubject, setSubjectStatus, deleteSubject, moveSubject } from "./actions";

export const metadata: Metadata = { title: "Admin · Materias" };

export default async function AdminSemesterDetailPage({ params }: { params: Promise<{ semesterId: string }> }) {
  const { semesterId } = await params;
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    include: { subjects: { orderBy: { order: "asc" }, include: { _count: { select: { sections: true } } } } },
  });
  if (!semester) notFound();

  return (
    <div className="container-page py-8">
      <Link href="/admin/semestres" className="text-sm text-ink-500 hover:text-ink-900">← Semestres</Link>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">{semester.title}</h1>
      <p className="text-ink-500">Materias de este semestre.</p>

      <form action={createSubject.bind(null, semesterId)} className="card mt-6 grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto]">
        <input className="input" type="text" name="title" placeholder="Nombre, ej. Anatomía" required />
        <input className="input" type="text" name="description" placeholder="Descripción (opcional)" />
        <button type="submit" className="btn-primary">Crear materia</button>
      </form>

      <ul className="mt-6 space-y-3">
        {semester.subjects.map((subject, index) => (
          <li key={subject.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <form action={moveSubject.bind(null, semesterId, subject.id, "up")}>
                  <button type="submit" disabled={index === 0} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▲</button>
                </form>
                <form action={moveSubject.bind(null, semesterId, subject.id, "down")}>
                  <button type="submit" disabled={index === semester.subjects.length - 1} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▼</button>
                </form>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-ink-900">{subject.title}</h2>
                  <span className={STATUS_BADGE_CLASS[subject.status]}>{STATUS_LABEL[subject.status]}</span>
                  <span className="badge-muted">Desbloqueo: {UNLOCK_MODE_OPTIONS.find((o) => o.value === subject.unlockMode)?.label}</span>
                </div>
                {subject.description && <p className="text-sm text-ink-500">{subject.description}</p>}
                <p className="mt-1 text-xs text-ink-500">{subject._count.sections} sección/es</p>
              </div>

              <form action={setSubjectStatus.bind(null, semesterId, subject.id)}>
                <AutoSubmitSelect name="status" defaultValue={subject.status} options={STATUS_OPTIONS} />
              </form>

              <Link href={`/admin/materias/${subject.id}`} className="btn-outline">
                Administrar contenido →
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-soft pt-3">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-brand-600">Editar</summary>
                <form action={updateSubject.bind(null, semesterId, subject.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto_auto]">
                  <input className="input" type="text" name="title" defaultValue={subject.title} required />
                  <input className="input" type="text" name="description" defaultValue={subject.description ?? ""} />
                  <select className="input" name="unlockMode" defaultValue={subject.unlockMode}>
                    {UNLOCK_MODE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary">Guardar</button>
                </form>
              </details>

              <form action={deleteSubject.bind(null, semesterId, subject.id)} className="ml-auto">
                <ConfirmButton confirmText={`¿Eliminar "${subject.title}" y todo su contenido?`} className="btn-ghost text-accent-700">
                  Eliminar
                </ConfirmButton>
              </form>
            </div>
          </li>
        ))}
        {semester.subjects.length === 0 && (
          <li className="card p-8 text-center text-ink-500">Todavía no hay materias. Crea la primera arriba.</li>
        )}
      </ul>
    </div>
  );
}
