import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { EyeIcon } from "@/components/icons";

const links = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/semestres", label: "Semestres" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/administradores", label: "Administradores" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/app");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border-soft bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/admin" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/app"
              aria-label="Ver como estudiante"
              title="Ver como estudiante"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-700 transition-colors hover:bg-surface-muted"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <nav className="container-page flex items-center gap-1 overflow-x-auto pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
