"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticateWithCredentials, authenticateWithGoogle } from "./actions";
import { GoogleIcon } from "@/components/google-icon";

export function LoginForm({ googleEnabled, plan }: { googleEnabled: boolean; plan?: string }) {
  const [errorMessage, formAction, pending] = useActionState(authenticateWithCredentials, undefined);
  const registerHref = plan ? `/registro?plan=${plan}` : "/registro";

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-ink-900">Inicia sesión</h1>
      <p className="mt-1 text-sm text-ink-500">
        {plan ? "Inicia sesión para completar tu suscripción." : "Continúa donde te quedaste."}
      </p>

      {googleEnabled && (
        <>
          <form action={authenticateWithGoogle} className="mt-6">
            {plan && <input type="hidden" name="plan" value={plan} />}
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
        {plan && <input type="hidden" name="plan" value={plan} />}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Correo electrónico</span>
            <input className="input" type="email" name="email" required placeholder="tucorreo@ejemplo.com" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Contraseña</span>
            <input className="input" type="password" name="password" required placeholder="••••••••" />
          </label>
        </div>

        {errorMessage && <p className="mt-4 text-sm text-accent-700">{errorMessage}</p>}

        <button type="submit" disabled={pending} className="btn-primary mt-6 w-full justify-center py-2.5">
          {pending ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        ¿Aún no tienes cuenta?{" "}
        <Link href={registerHref} className="font-semibold text-brand-600 hover:underline">
          Regístrate gratis
        </Link>
      </p>

      <div className="mt-6 rounded-xl bg-surface-muted p-4 text-xs text-ink-500">
        <p className="font-semibold text-ink-700">Cuentas de prueba</p>
        <p className="mt-1">Admin: admin@gmail.com / Oswaldo_2008!</p>
        <p>Estudiante: user@gmail.com / Oswalfo_2008!</p>
      </div>
    </div>
  );
}
