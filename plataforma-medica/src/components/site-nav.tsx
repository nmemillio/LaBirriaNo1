import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { MobileNavToggle } from "@/components/mobile-nav-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/precios", label: "Precios" },
];

export async function SiteNav() {
  const session = await auth();
  const homeHref = session?.user.role === "ADMIN" ? "/admin" : "/app";

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-surface/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        {/* <a> a propósito en toda esta barra, no <Link>: esta cabecera
            depende de la sesión, y Next.js reutiliza el layout compartido
            entre navegaciones internas en vez de re-ejecutarlo — eso hacía
            que a veces se quedara mostrando el estado de sesión anterior.
            Una carga completa la garantiza siempre fresca. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" aria-label="Codón, inicio">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {session?.user ? (
            <a href={homeHref} className="btn-primary">
              Ir a mi panel
            </a>
          ) : (
            <>
              <a href="/login" className="btn-ghost">
                Iniciar sesión
              </a>
              <a href="/registro" className="btn-primary">
                Comenzar gratis
              </a>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileNavToggle
            links={links}
            isAuthenticated={Boolean(session?.user)}
            homeHref={homeHref}
          />
        </div>
      </div>
    </header>
  );
}
