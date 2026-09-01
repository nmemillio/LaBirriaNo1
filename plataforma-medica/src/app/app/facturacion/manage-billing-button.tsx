"use client";

import { useState, useTransition } from "react";

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function handleClick() {
    setNotice(null);
    startTransition(async () => {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(
          data.error === "stripe_not_configured"
            ? "Stripe todavía no está conectado en este entorno."
            : "No se pudo abrir el portal de facturación.",
        );
        return;
      }
      window.location.href = data.redirectUrl;
    });
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className="btn-outline">
        {pending ? "Abriendo..." : "Administrar facturación"}
      </button>
      {notice && <p className="mt-2 text-sm text-ink-500">{notice}</p>}
    </div>
  );
}
