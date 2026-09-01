import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compatible con edge (sin Prisma/bcrypt) para que el
 * middleware pueda verificar la sesión sin tocar la base de datos.
 * La configuración completa (providers, adapter) vive en src/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;

      if (path.startsWith("/admin")) {
        return isLoggedIn && auth?.user?.role === "ADMIN";
      }
      if (path.startsWith("/app")) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "STUDENT" | "PROFESSOR" | "MODERATOR";
      }
      return session;
    },
  },
};
