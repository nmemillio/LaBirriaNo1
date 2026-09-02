import type { Metadata } from "next";
import { isGoogleLoginEnabled } from "@/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return <RegisterForm googleEnabled={isGoogleLoginEnabled} plan={plan} />;
}
