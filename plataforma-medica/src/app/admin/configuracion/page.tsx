import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { STRIPE_SETTINGS_ID } from "@/lib/stripe";
import { decryptSecret, maskSecret } from "@/lib/crypto";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StripeSettingsForm } from "./settings-form";
import { TestConnectionButton } from "./test-connection-button";
import { clearStripeSettings } from "./actions";

export const metadata: Metadata = { title: "Admin · Configuración" };

export default async function AdminSettingsPage() {
  const settings = await prisma.stripeSettings.findUnique({ where: { id: STRIPE_SETTINGS_ID } });

  const maskedSecretKey = settings?.secretKeyEncrypted ? maskSecret(decryptSecret(settings.secretKeyEncrypted)) : null;
  const maskedWebhookSecret = settings?.webhookSecretEncrypted
    ? maskSecret(decryptSecret(settings.webhookSecretEncrypted))
    : null;

  const usingEnvFallback = !settings?.secretKeyEncrypted && Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-ink-900">Configuración de Stripe</h1>
      <p className="mt-1 text-ink-500">
        Conecta tu cuenta de Stripe pegando tus claves aquí — se guardan cifradas en la base de datos, no hace
        falta tocar variables de entorno en Vercel.
      </p>

      {usingEnvFallback && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Ahora mismo estás usando las claves de las variables de entorno del servidor. En cuanto guardes algo
          aquí, esta configuración toma prioridad.
        </p>
      )}

      <div className="card mt-6 p-6">
        <StripeSettingsForm
          maskedSecretKey={maskedSecretKey}
          currentPublishableKey={settings?.publishableKey ?? null}
          maskedWebhookSecret={maskedWebhookSecret}
        />
      </div>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-semibold text-ink-900">Probar la conexión</h2>
          <p className="mt-1 text-sm text-ink-500">Verifica que la clave guardada funciona antes de anunciar los pagos.</p>
        </div>
        <TestConnectionButton />
      </div>

      {settings?.secretKeyEncrypted && (
        <div className="card mt-6 p-6">
          <h2 className="font-semibold text-ink-900">Quitar configuración guardada</h2>
          <p className="mt-1 text-sm text-ink-500">
            Borra lo guardado aquí y vuelve a usar las variables de entorno del servidor (si existen).
          </p>
          <form action={clearStripeSettings} className="mt-3">
            <ConfirmButton confirmText="¿Quitar la configuración de Stripe guardada aquí?" className="btn-ghost text-accent-700">
              Quitar configuración
            </ConfirmButton>
          </form>
        </div>
      )}

      <div className="card mt-6 p-6 text-sm text-ink-500">
        <h2 className="font-semibold text-ink-900">¿Dónde consigo estas claves?</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>
            Entra a{" "}
            <span className="font-medium text-ink-700">dashboard.stripe.com/apikeys</span> con tu cuenta de
            Stripe.
          </li>
          <li>Copia la <strong>Secret key</strong> y la <strong>Publishable key</strong> (usa modo Test primero para probar sin cobrar de verdad).</li>
          <li>
            En <span className="font-medium text-ink-700">Developers → Webhooks</span>, agrega un endpoint a
            esta URL: <code className="rounded bg-surface-muted px-1.5 py-0.5">/api/webhooks/stripe</code> con
            los eventos de suscripciones y pagos, y copia el <strong>Signing secret</strong> que te dé.
          </li>
        </ol>
      </div>
    </div>
  );
}
