"use client";

import { useActionState } from "react";
import { promoteToAdmin } from "./actions";

export function PromoteForm() {
  const [errorMessage, formAction, pending] = useActionState(promoteToAdmin, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
      <input className="input sm:flex-1" type="email" name="email" placeholder="correo@de-un-estudiante-existente.com" required />
      <button type="submit" disabled={pending} className="btn-outline shrink-0">
        {pending ? "Promoviendo..." : "Promover a administrador"}
      </button>
      {errorMessage && <p className="text-sm text-accent-700">{errorMessage}</p>}
    </form>
  );
}
