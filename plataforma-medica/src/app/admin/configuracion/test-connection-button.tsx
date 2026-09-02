"use client";

import { useState, useTransition } from "react";
import { testStripeConnection } from "./actions";

export function TestConnectionButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await testStripeConnection();
      setResult(res);
    });
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className="btn-outline">
        {pending ? "Probando..." : "Probar conexión"}
      </button>
      {result && (
        <p className={`mt-2 text-sm ${result.ok ? "text-brand-600" : "text-accent-700"}`}>{result.message}</p>
      )}
    </div>
  );
}
