"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticateWithGoogle } from "../login/actions";
import { registerStudent } from "./actions";
import { GoogleIcon } from "@/components/google-icon";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [errorMessage, formAction, pending] = useActionState(registerStudent, undefined);

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-ink-900">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-ink-500">Empieza gratis con el semestre 1.</p>

      {googleEnabled && (
        <>
          <form action={authenticateWithGoogle} className="mt-6">
            <button type="submit" className="btn-outline w-full justify-center gap-3 py-2.5">
              <GoogleIcon />
              Continuar con Google
            </button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-300">
            <span className="h-px flex-1 bg-border-soft" />
            o con tu correo
            <span className="h-px flex-1 bg-border-soft" />
          </div>
        </>
      )}

      <form action={formAction} className={googleEnabled ? "" : "mt-6"} noValidate>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre completo</span>
            <input className="input" type="text" name="name" required placeholder="Tu nombre" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Correo electrónico</span>
            <input className="input" type="email" name="email" required placeholder="tucorreo@ejemplo.com" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Contraseña</span>
            <input className="input" type="password" name="password" required placeholder="Mínimo 8 caracteres" />
          </label>
        </div>

        {errorMessage && <p className="mt-4 text-sm text-accent-600">{errorMessage}</p>}

        <button type="submit" disabled={pending} className="btn-primary mt-6 w-full justify-center py-2.5">
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
