import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-soft bg-surface-muted">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-500">
            Plataforma educativa para estudiantes de medicina: video clases, material descargable
            y quizzes organizados por semestre.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink-900">Plataforma</span>
            <Link href="/" className="text-ink-500 hover:text-ink-900">Inicio</Link>
            <Link href="/precios" className="text-ink-500 hover:text-ink-900">Precios</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink-900">Cuenta</span>
            <Link href="/login" className="text-ink-500 hover:text-ink-900">Iniciar sesión</Link>
            <Link href="/registro" className="text-ink-500 hover:text-ink-900">Crear cuenta</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border-soft py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Galeno. Plataforma educativa — no sustituye la formación clínica supervisada.
      </div>
    </footer>
  );
}
