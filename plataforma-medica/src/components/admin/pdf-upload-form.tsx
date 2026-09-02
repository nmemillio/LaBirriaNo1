"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { createPdfContent, createPdfContentFromUrl } from "@/app/admin/materias/[subjectId]/actions";

export function PdfUploadForm({
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
    return (
      <form action={createPdfContent.bind(null, subjectId, sectionId)} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
        <input className="input" type="text" name="title" placeholder="Título del PDF" required />
        <input className="input" type="text" name="description" placeholder="Descripción (opcional)" />
        <input className="input" type="file" name="file" accept="application/pdf" required />
        <button type="submit" className="btn-primary">Subir PDF</button>
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
      setError("Selecciona un archivo PDF.");
      return;
    }

    setPending(true);
    setProgress(0);
    try {
      const blob = await upload(`documents/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        clientPayload: "pdf",
        contentType: "application/pdf",
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });

      data.set("blobUrl", blob.url);
      data.set("fileName", file.name);
      data.set("fileSizeKb", String(Math.round(file.size / 1024)));
      await createPdfContentFromUrl(subjectId, sectionId, data);
      form.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "No se pudo subir el PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg bg-surface-muted p-3">
      <input className="input" type="text" name="title" placeholder="Título del PDF" required />
      <input className="input" type="text" name="description" placeholder="Descripción (opcional)" />
      <input className="input" type="file" name="file" accept="application/pdf" required disabled={pending} />
      {pending && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-xs text-accent-700">{error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? `Subiendo... ${Math.round(progress)}%` : "Subir PDF"}
      </button>
    </form>
  );
}
