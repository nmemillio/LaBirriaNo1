import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/app", label: "Aprendizaje" },
  { href: "/app/facturacion", label: "Facturación" },
  { href: "/app/perfil", label: "Mi perfil" },
];

export function StudentShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border-soft bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/app">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted hover:text-ink-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-900">{userName}</p>
              <p className="text-xs text-ink-500">{userEmail}</p>
            </div>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 sm:flex">
              {userName.charAt(0).toUpperCase()}
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <nav className="container-page flex gap-1 overflow-x-auto pb-3 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-border-soft px-3 py-1.5 text-xs font-medium text-ink-700"
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
