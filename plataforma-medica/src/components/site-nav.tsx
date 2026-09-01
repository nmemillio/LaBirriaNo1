import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { MobileNavToggle } from "@/components/mobile-nav-toggle";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/precios", label: "Precios" },
];

export async function SiteNav() {
  const session = await auth();
  const homeHref = session?.user.role === "ADMIN" ? "/admin" : "/app";

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="Medicación, inicio">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
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

        <div className="hidden items-center gap-2 md:flex">
          {session?.user ? (
            <Link href={homeHref} className="btn-primary">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn-primary">
                Comenzar gratis
              </Link>
            </>
          )}
        </div>

        <MobileNavToggle
          links={links}
          isAuthenticated={Boolean(session?.user)}
          homeHref={homeHref}
        />
      </div>
    </header>
  );
}
