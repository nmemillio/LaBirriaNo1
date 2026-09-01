import type { Metadata } from "next";
import { isGoogleLoginEnabled } from "@/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta | Medicación" };

export default function RegisterPage() {
  return <RegisterForm googleEnabled={isGoogleLoginEnabled} />;
}
