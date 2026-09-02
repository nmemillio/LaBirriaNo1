import type { Metadata } from "next";
import { isGoogleLoginEnabled } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return <LoginForm googleEnabled={isGoogleLoginEnabled} plan={plan} />;
}
