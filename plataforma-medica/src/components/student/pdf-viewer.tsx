"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PdfViewer({
  contentId,
  src,
  token,
  fileName,
  alreadyCompleted,
}: {
  contentId: string;
  src: string;
  token: string;
  fileName: string;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [pending, setPending] = useState(false);

  async function markRead() {
    setPending(true);
    try {
      const res = await fetch(`/api/content/${contentId}/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setCompleted(true);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <iframe src={src} title={fileName} className="h-[70vh] w-full" />
      <div className="flex flex-col items-start gap-3 border-t border-border-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <a href={src} download={fileName} className="btn-outline">
          Descargar PDF
        </a>
        {completed ? (
          <span className="badge-brand">Marcado como leído</span>
        ) : (
          <button type="button" onClick={markRead} disabled={pending} className="btn-primary">
            {pending ? "Guardando..." : "Marcar como leído"}
          </button>
        )}
      </div>
    </div>
  );
}
