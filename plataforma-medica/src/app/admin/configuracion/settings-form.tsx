"use client";

import { useActionState } from "react";
import { saveStripeSettings } from "./actions";

export function StripeSettingsForm({
  maskedSecretKey,
  currentPublishableKey,
  maskedWebhookSecret,
}: {
  maskedSecretKey: string | null;
  currentPublishableKey: string | null;
  maskedWebhookSecret: string | null;
}) {
  const [errorMessage, formAction, pending] = useActionState(saveStripeSettings, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Secret Key</span>
        <input
          className="input font-mono"
          type="password"
          name="secretKey"
          placeholder={maskedSecretKey ?? "sk_live_..."}
          autoComplete="off"
        />
        {maskedSecretKey && (
          <p className="mt-1 text-xs text-ink-500">Guardada: {maskedSecretKey}. Deja vacío para no cambiarla.</p>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Publishable Key</span>
        <input
          className="input font-mono"
          type="text"
          name="publishableKey"
          defaultValue={currentPublishableKey ?? ""}
          placeholder="pk_live_..."
          autoComplete="off"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Webhook Signing Secret</span>
        <input
          className="input font-mono"
          type="password"
          name="webhookSecret"
          placeholder={maskedWebhookSecret ?? "whsec_..."}
          autoComplete="off"
        />
        {maskedWebhookSecret && (
          <p className="mt-1 text-xs text-ink-500">Guardado: {maskedWebhookSecret}. Deja vacío para no cambiarlo.</p>
        )}
      </label>

      {errorMessage && <p className="text-sm text-accent-700">{errorMessage}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
