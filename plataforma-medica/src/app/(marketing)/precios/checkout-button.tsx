"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CheckoutButton({
  planId,
  isAuthenticated,
  variant,
  label,
}: {
  planId: string;
  isAuthenticated: boolean;
  variant: "primary" | "accent";
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/registro?plan=${planId}`);
      return;
    }
    setNotice(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice(data.message ?? "No se pudo iniciar la suscripción. Intenta de nuevo.");
          return;
        }
        router.push(data.redirectUrl);
      } catch {
        setNotice("Ocurrió un error de red. Intenta de nuevo.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`${variant === "primary" ? "btn-primary" : "btn-accent"} w-full justify-center py-3`}
      >
        {pending ? "Procesando..." : label}
      </button>
      {notice && <p className="mt-3 text-sm text-accent-700">{notice}</p>}
    </div>
  );
}
