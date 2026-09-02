"use client";

import { useActionState } from "react";
import { createAdmin } from "./actions";

export function CreateAdminForm() {
  const [errorMessage, formAction, pending] = useActionState(createAdmin, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input className="input" type="text" name="name" placeholder="Nombre completo" required />
      <input className="input" type="email" name="email" placeholder="correo@ejemplo.com" required />
      <input className="input" type="password" name="password" placeholder="Contraseña (mínimo 8 caracteres)" required />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Creando..." : "Crear administrador"}
      </button>
      {errorMessage && <p className="sm:col-span-2 text-sm text-accent-700">{errorMessage}</p>}
    </form>
  );
}
