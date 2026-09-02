"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticateWithCredentials(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/app",
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

export async function authenticateWithGoogle() {
  await signIn("google", { redirectTo: "/app" });
}
