"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createVideoContent, createVideoContentFromUrl } from "@/app/admin/materias/[subjectId]/actions";

export function VideoUploadForm({
  subjectId,
  sectionId,
  blobEnabled,
}: {
  subjectId: string;
  sectionId: string;
  blobEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!blobEnabled) {
    // Sin Vercel Blob configurado (desarrollo local): el archivo va en el
    // body de la server action de siempre — funciona bien para archivos
    // moderados en local, donde no existe el límite de payload de Vercel.
    return (
      <form action={createVideoContent.bind(null, subjectId, sectionId)} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
        <input className="input" type="text" name="title" placeholder="Título del video" required />
        <textarea className="input" name="description" placeholder="Explicación para el estudiante (opcional) — aparece debajo del video" rows={2} />
        <label className="block text-xs text-ink-500">
          % para completar
          <input className="input mt-1" type="number" name="completionThreshold" defaultValue={90} min={1} max={100} />
        </label>
        <input className="input" type="file" name="file" accept="video/*" required />
        <button type="submit" className="btn-primary">Subir video</button>
      </form>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Selecciona un archivo de video.");
      return;
    }

    setPending(true);
    setProgress(0);
    try {
      const blob = await upload(`videos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        clientPayload: "video",
        contentType: file.type || "video/mp4",
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });

      data.set("blobUrl", blob.url);
      await createVideoContentFromUrl(subjectId, sectionId, data);
      form.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "No se pudo subir el video.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
      <input className="input" type="text" name="title" placeholder="Título del video" required />
      <textarea className="input" name="description" placeholder="Explicación para el estudiante (opcional) — aparece debajo del video" rows={2} />
      <label className="block text-xs text-ink-500">
        % para completar
        <input className="input mt-1" type="number" name="completionThreshold" defaultValue={90} min={1} max={100} />
      </label>
      <input className="input" type="file" name="file" accept="video/*" required disabled={pending} />
      {pending && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-xs text-accent-700">{error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? `Subiendo... ${Math.round(progress)}%` : "Subir video"}
      </button>
    </form>
  );
}
