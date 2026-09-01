import type { SectionNode } from "@/lib/content-tree";
import { STATUS_OPTIONS, STATUS_BADGE_CLASS, STATUS_LABEL, CONTENT_TYPE_LABEL } from "@/lib/labels";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  createSection,
  updateSection,
  setSectionStatus,
  deleteSection,
  moveSection,
  createVideoContent,
  createPdfContent,
  createQuizContent,
  updateContentMeta,
  setContentStatus,
  deleteContent,
  moveContent,
  addQuizQuestion,
  deleteQuizQuestion,
} from "@/app/admin/materias/[subjectId]/actions";

export function AdminSectionBlock({
  subjectId,
  section,
  depth,
  siblingCount,
  index,
}: {
  subjectId: string;
  section: SectionNode;
  depth: number;
  siblingCount: number;
  index: number;
}) {
  return (
    <div className="card p-5" style={{ marginLeft: depth * 20 }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <form action={moveSection.bind(null, subjectId, section.id, "up")}>
            <button type="submit" disabled={index === 0} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▲</button>
          </form>
          <form action={moveSection.bind(null, subjectId, section.id, "down")}>
            <button type="submit" disabled={index === siblingCount - 1} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▼</button>
          </form>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink-900">{section.title}</h3>
            <span className={STATUS_BADGE_CLASS[section.status]}>{STATUS_LABEL[section.status]}</span>
          </div>
          {section.description && <p className="text-sm text-ink-500">{section.description}</p>}
        </div>
        <form action={setSectionStatus.bind(null, subjectId, section.id)}>
          <AutoSubmitSelect name="status" defaultValue={section.status} options={STATUS_OPTIONS} />
        </form>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-soft pt-3">
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-brand-600">Editar sección</summary>
          <form action={updateSection.bind(null, subjectId, section.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input className="input" type="text" name="title" defaultValue={section.title} required />
            <input className="input" type="text" name="description" defaultValue={section.description ?? ""} />
            <button type="submit" className="btn-primary">Guardar</button>
          </form>
        </details>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-brand-600">+ Subsección</summary>
          <form action={createSection.bind(null, subjectId)} className="mt-3 flex gap-2">
            <input type="hidden" name="parentId" value={section.id} />
            <input className="input" type="text" name="title" placeholder="Nombre de la subsección" required />
            <button type="submit" className="btn-outline">Crear</button>
          </form>
        </details>

        <form action={deleteSection.bind(null, subjectId, section.id)} className="ml-auto">
          <ConfirmButton confirmText={`¿Eliminar "${section.title}" y su contenido?`} className="btn-ghost text-accent-600">
            Eliminar sección
          </ConfirmButton>
        </form>
      </div>

      {section.contents.length > 0 && (
        <ul className="mt-4 divide-y divide-border-soft rounded-xl border border-border-soft">
          {section.contents.map((content, cIndex) => (
            <li key={content.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <form action={moveContent.bind(null, subjectId, content.id, "up")}>
                    <button type="submit" disabled={cIndex === 0} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▲</button>
                  </form>
                  <form action={moveContent.bind(null, subjectId, content.id, "down")}>
                    <button type="submit" disabled={cIndex === section.contents.length - 1} className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30">▼</button>
                  </form>
                </div>
                <span className="badge-muted">{CONTENT_TYPE_LABEL[content.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900">{content.title}</p>
                  {content.type === "VIDEO" && (
                    <p className="text-xs text-ink-500">Umbral de finalización: {content.completionThreshold}%</p>
                  )}
                  {content.type === "PDF" && content.document && (
                    <p className="text-xs text-ink-500">{content.document.fileName}</p>
                  )}
                  {content.type === "QUIZ" && content.quiz && (
                    <p className="text-xs text-ink-500">
                      {content.quiz.questions.length} pregunta(s) · Aprobación: {content.quiz.passingScore}%
                    </p>
                  )}
                </div>
                <span className={STATUS_BADGE_CLASS[content.status]}>{STATUS_LABEL[content.status]}</span>
                <form action={setContentStatus.bind(null, subjectId, content.id)}>
                  <AutoSubmitSelect name="status" defaultValue={content.status} options={STATUS_OPTIONS} />
                </form>
                {(content.type === "VIDEO" || content.type === "PDF") && (
                  <a
                    href={`/api/content/${content.id}/${content.type === "VIDEO" ? "video" : "document"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-xs"
                  >
                    Ver archivo
                  </a>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-brand-600">Editar</summary>
                  <form action={updateContentMeta.bind(null, subjectId, content.id)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
                    <input className="input" type="text" name="title" defaultValue={content.title} required />
                    <input className="input" type="text" name="description" defaultValue={content.description ?? ""} placeholder="Descripción" />
                    {content.type === "VIDEO" && (
                      <input
                        className="input"
                        type="number"
                        name="completionThreshold"
                        min={1}
                        max={100}
                        defaultValue={content.completionThreshold}
                        title="% para marcar como completado"
                      />
                    )}
                    <button type="submit" className="btn-primary">Guardar</button>
                  </form>
                </details>

                {content.type === "QUIZ" && content.quiz && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-brand-600">Gestionar preguntas</summary>
                    <div className="mt-3 space-y-3">
                      {content.quiz.questions.map((q) => (
                        <div key={q.id} className="rounded-lg border border-border-soft p-3 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-ink-900">{q.prompt}</p>
                            <form action={deleteQuizQuestion.bind(null, subjectId, q.id)}>
                              <ConfirmButton confirmText="¿Eliminar esta pregunta?" className="text-accent-600">
                                Eliminar
                              </ConfirmButton>
                            </form>
                          </div>
                          <ul className="mt-1 space-y-0.5 text-ink-500">
                            {q.answers.map((a) => (
                              <li key={a.id} className={a.isCorrect ? "font-semibold text-brand-600" : ""}>
                                {a.isCorrect ? "✓ " : "— "}
                                {a.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      <form action={addQuizQuestion.bind(null, subjectId, content.quiz.id)} className="space-y-2 rounded-lg bg-surface-muted p-3">
                        <input className="input" type="text" name="prompt" placeholder="Pregunta" required />
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="radio" name="correctIndex" value={i} defaultChecked={i === 0} />
                            <input className="input" type="text" name={`answer${i}`} placeholder={`Respuesta ${i + 1}`} required={i < 2} />
                          </div>
                        ))}
                        <input className="input" type="text" name="explanation" placeholder="Explicación (opcional)" />
                        <button type="submit" className="btn-outline">Agregar pregunta</button>
                      </form>
                    </div>
                  </details>
                )}

                <form action={deleteContent.bind(null, subjectId, content.id)} className="ml-auto">
                  <ConfirmButton confirmText={`¿Eliminar "${content.title}"?`} className="btn-ghost text-xs text-accent-600">
                    Eliminar
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-4 border-t border-border-soft pt-4 text-sm">
        <details>
          <summary className="cursor-pointer font-medium text-brand-600">+ Video</summary>
          <form action={createVideoContent.bind(null, subjectId, section.id)} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
            <input className="input" type="text" name="title" placeholder="Título del video" required />
            <input className="input" type="text" name="description" placeholder="Descripción (opcional)" />
            <label className="block text-xs text-ink-500">
              % para completar
              <input className="input mt-1" type="number" name="completionThreshold" defaultValue={90} min={1} max={100} />
            </label>
            <input className="input" type="file" name="file" accept="video/*" required />
            <button type="submit" className="btn-primary">Subir video</button>
          </form>
        </details>

        <details>
          <summary className="cursor-pointer font-medium text-brand-600">+ PDF</summary>
          <form action={createPdfContent.bind(null, subjectId, section.id)} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
            <input className="input" type="text" name="title" placeholder="Título del PDF" required />
            <input className="input" type="text" name="description" placeholder="Descripción (opcional)" />
            <input className="input" type="file" name="file" accept="application/pdf" required />
            <button type="submit" className="btn-primary">Subir PDF</button>
          </form>
        </details>

        <details>
          <summary className="cursor-pointer font-medium text-brand-600">+ Quiz</summary>
          <form action={createQuizContent.bind(null, subjectId, section.id)} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
            <input className="input" type="text" name="title" placeholder="Título del quiz" required />
            <label className="block text-xs text-ink-500">
              % mínimo para aprobar
              <input className="input mt-1" type="number" name="passingScore" defaultValue={70} min={1} max={100} />
            </label>
            <label className="block text-xs text-ink-500">
              Intentos permitidos (vacío = ilimitados)
              <input className="input mt-1" type="number" name="maxAttempts" min={1} />
            </label>
            <button type="submit" className="btn-primary">Crear quiz</button>
          </form>
        </details>
      </div>

      {section.children.map((child, i) => (
        <div key={child.id} className="mt-4">
          <AdminSectionBlock subjectId={subjectId} section={child} depth={depth + 1} siblingCount={section.children.length} index={i} />
        </div>
      ))}
    </div>
  );
}
