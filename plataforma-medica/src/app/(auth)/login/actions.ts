"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticateWithCredentials(_prevState: string | undefined, formData: FormData) {
  const planId = formData.get("plan");
  const redirectTo = typeof planId === "string" && planId ? `/app/facturacion?comprar=${planId}` : "/app";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Correo o contraseña incorrectos.";
        default:
          return "No se pudo iniciar sesión. Intenta de nuevo.";
      }
    }
    throw error;
  }
}

export async function authenticateWithGoogle(formData: FormData) {
  const planId = formData.get("plan");
  const redirectTo = typeof planId === "string" && planId ? `/app/facturacion?comprar=${planId}` : "/app";
  await signIn("google", { redirectTo });
}
