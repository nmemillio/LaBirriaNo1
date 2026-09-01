import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loadSubjectTree } from "@/lib/content-tree";
import { isBlobConfigured } from "@/lib/storage";
import { AdminSectionBlock } from "@/components/admin/admin-section-block";
import { createSection } from "./actions";

export const metadata: Metadata = { title: "Admin · Contenido de la materia" };

export default async function AdminSubjectDetailPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const subject = await prisma.subject.findUnique({ where: { id: subjectId }, include: { semester: true } });
  if (!subject) notFound();

  const tree = await loadSubjectTree(subjectId, { includeUnpublished: true });
  const blobEnabled = isBlobConfigured();

  return (
    <div className="container-page py-8">
      <Link href={`/admin/semestres/${subject.semesterId}`} className="text-sm text-ink-500 hover:text-ink-900">
        ← {subject.semester.title}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">{subject.title}</h1>
      <p className="text-ink-500">Secciones y contenido de esta materia.</p>

      <form action={createSection.bind(null, subjectId)} className="card mt-6 flex flex-wrap gap-2 p-5">
        <input className="input flex-1" type="text" name="title" placeholder="Nombre de la sección, ej. Generalidades" required />
        <button type="submit" className="btn-primary">Crear sección</button>
      </form>

      <div className="mt-6 space-y-4">
        {tree.map((section, i) => (
          <AdminSectionBlock key={section.id} subjectId={subjectId} section={section} depth={0} siblingCount={tree.length} index={i} blobEnabled={blobEnabled} />
        ))}
        {tree.length === 0 && (
          <div className="card p-8 text-center text-ink-500">Todavía no hay secciones. Crea la primera arriba.</div>
        )}
      </div>
    </div>
  );
}
