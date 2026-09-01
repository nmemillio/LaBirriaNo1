import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/semestres", label: "Semestres" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/app");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border-soft bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <Logo />
            </Link>
            <span className="badge-accent hidden sm:inline-flex">Administración</span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
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
          <div className="flex items-center gap-3">
            <Link href="/app" className="btn-ghost hidden sm:inline-flex">
              Ver como estudiante
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
