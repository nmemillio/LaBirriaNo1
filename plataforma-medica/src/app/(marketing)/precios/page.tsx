import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutButton } from "./checkout-button";

export const metadata: Metadata = { title: "Precios" };

const formatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export default async function PricingPage() {
  const [session, plans] = await Promise.all([
    auth(),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge-brand">Precios</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink-900">
          Un plan para cada momento del semestre.
        </h1>
        <p className="mt-4 text-lg text-ink-700">
          Por ahora, el plan Gratuito y el Premium incluyen exactamente las mismas ventajas.
          El plan Premium existe para quienes quieren apoyar el desarrollo de la plataforma —
          las funciones exclusivas llegarán más adelante.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
        {plans.map((plan, index) => {
          const features: string[] = JSON.parse(plan.features);
          const isPremium = index === 1;
          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col p-8 ${isPremium ? "border-brand-300 ring-1 ring-brand-200" : ""}`}
            >
              {isPremium && (
                <span className="badge-accent absolute -top-3 left-8">Apoya la plataforma</span>
              )}
              <h2 className="text-xl font-bold text-ink-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-ink-500">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-ink-900">
                  {plan.priceCents === 0 ? "Gratis" : formatter.format(plan.priceCents / 100)}
                </span>
                {plan.priceCents > 0 && (
                  <span className="text-sm text-ink-500">
                    / {plan.interval === "YEAR" ? "año" : "mes"}
                  </span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-brand-600">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <CheckoutButton
                  planId={plan.id}
                  isAuthenticated={Boolean(session?.user)}
                  variant={isPremium ? "accent" : "primary"}
                  label={plan.priceCents === 0 ? "Empezar gratis" : "Suscribirme"}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-sm text-ink-500">
        Los pagos con tarjeta se procesan de forma segura con Stripe. Puedes cancelar tu
        suscripción Premium cuando quieras desde tu panel de facturación.
      </p>
    </div>
  );
}
