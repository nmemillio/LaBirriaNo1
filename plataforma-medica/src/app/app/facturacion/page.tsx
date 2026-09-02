import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserActiveSubscription } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ManageBillingButton } from "./manage-billing-button";

export const metadata: Metadata = { title: "Facturación" };

const formatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; activated?: string }>;
}) {
  const { checkout, activated } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const [subscription, payments] = await Promise.all([
    getUserActiveSubscription(userId),
    prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-ink-900">Facturación</h1>

      {checkout === "success" && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          ¡Pago recibido! Tu suscripción se activa en cuanto Stripe confirme el webhook.
        </p>
      )}
      {activated === "free" && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Activaste el plan gratuito. Ya tienes acceso al contenido publicado.
        </p>
      )}

      <div className="card mt-6 p-6">
        <span className="badge-muted">Plan actual</span>
        <p className="mt-3 text-xl font-bold text-ink-900">{subscription?.plan.name ?? "Sin plan activo"}</p>
        <p className="text-sm text-ink-500">
          Estado: {subscription ? subscriptionStatusLabel(subscription.status) : "—"}
        </p>
        {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <p className="mt-2 rounded-xl bg-accent-50 px-3 py-2 text-sm text-accent-700">
            Se cancelará el {subscription.currentPeriodEnd.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.
            Mantienes el acceso hasta esa fecha; puedes reactivarla desde &quot;Administrar facturación&quot;.
          </p>
        )}
        {!subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && subscription.status === "ACTIVE" && (
          <p className="mt-2 text-xs text-ink-500">
            Se renueva el {subscription.currentPeriodEnd.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/precios" className="btn-primary">
            Cambiar de plan
          </Link>
          {subscription?.stripeCustomerId && <ManageBillingButton />}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-ink-900">Historial de pagos</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Todavía no tienes pagos registrados.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border-soft">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink-700">{p.createdAt.toLocaleDateString("es-MX")}</span>
                <span className="text-ink-900">{formatter.format(p.amountCents / 100)}</span>
                <span className="badge-muted">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function subscriptionStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Activa",
    TRIALING: "En prueba",
    PAST_DUE: "Pago pendiente",
    CANCELED: "Cancelada",
    INCOMPLETE: "Incompleta",
    FREE: "Plan gratuito",
  };
  return map[status] ?? status;
}
