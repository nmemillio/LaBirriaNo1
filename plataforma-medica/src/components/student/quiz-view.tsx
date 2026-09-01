"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Answer = { id: string; text: string };
type Question = { id: string; prompt: string; answers: Answer[]; explanation: string | null };

type Result = {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  detail: { questionId: string; correctId: string | null; isCorrect: boolean; explanation: string | null }[];
};

export function QuizView({
  contentId,
  title,
  questions,
  passingScore,
}: {
  contentId: string;
  title: string;
  questions: Question[];
  passingScore: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = questions.every((q) => selected[q.id]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/content/${contentId}/quiz-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar el quiz.");
        return;
      }
      setResult(data);
      if (data.passed) router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setResult(null);
    setSelected({});
  }

  if (result) {
    return (
      <div className="card p-6 sm:p-8">
        <span className={result.passed ? "badge-brand" : "badge-accent"}>
          {result.passed ? "Aprobado" : "No aprobado"}
        </span>
        <p className="mt-3 text-3xl font-extrabold text-ink-900">
          {result.correct} / {result.total}
        </p>
        <p className="text-ink-500">{result.score}% · Mínimo para aprobar: {passingScore}%</p>

        <div className="mt-6 space-y-4">
          {questions.map((q) => {
            const detail = result.detail.find((d) => d.questionId === q.id);
            return (
              <div key={q.id} className="rounded-xl border border-border-soft p-4">
                <p className="text-sm font-semibold text-ink-900">{q.prompt}</p>
                <p className={`mt-1 text-sm ${detail?.isCorrect ? "text-brand-600" : "text-accent-700"}`}>
                  {detail?.isCorrect ? "Correcto" : "Incorrecto"}
                </p>
                {detail?.explanation && <p className="mt-1 text-sm text-ink-500">{detail.explanation}</p>}
              </div>
            );
          })}
        </div>

        {!result.passed && (
          <button type="button" onClick={retry} className="btn-primary mt-6">
            Intentar de nuevo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">Necesitas {passingScore}% para aprobar.</p>

      <div className="mt-6 space-y-6">
        {questions.map((q, i) => (
          <fieldset key={q.id}>
            <legend className="text-sm font-semibold text-ink-900">
              Pregunta {i + 1}. {q.prompt}
            </legend>
            <div className="mt-3 space-y-2">
              {q.answers.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                    selected[q.id] === a.id
                      ? "border-brand-400 bg-brand-50 text-brand-800"
                      : "border-border-soft hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={a.id}
                    checked={selected[q.id] === a.id}
                    onChange={() => setSelected((s) => ({ ...s, [q.id]: a.id }))}
                    className="accent-brand-600"
                  />
                  {a.text}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-accent-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="btn-primary mt-6"
      >
        {submitting ? "Enviando..." : "Responder"}
      </button>
    </div>
  );
}
