"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  links: { href: string; label: string }[];
  isAuthenticated: boolean;
  homeHref: string;
};

export function MobileNavToggle({ links, isAuthenticated, homeHref }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-ink-700"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-border-soft bg-white p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border-soft pt-3">
              {isAuthenticated ? (
                <Link href={homeHref} className="btn-primary justify-center" onClick={() => setOpen(false)}>
                  Ir a mi panel
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-outline justify-center" onClick={() => setOpen(false)}>
                    Iniciar sesión
                  </Link>
                  <Link href="/registro" className="btn-primary justify-center" onClick={() => setOpen(false)}>
                    Comenzar gratis
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
