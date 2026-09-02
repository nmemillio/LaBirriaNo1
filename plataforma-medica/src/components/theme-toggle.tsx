"use client";

import { useSyncExternalStore } from "react";
import { SunIcon, MoonIcon } from "@/components/icons";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", callback);
  };
}

function readTheme(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readServerTheme(): Theme | null {
  return null;
}

export function ThemeToggle({ className }: { className?: string }) {
  // useSyncExternalStore (en vez de useState+useEffect) porque el tema real
  // depende de localStorage/preferencia del sistema, que el servidor no
  // conoce — así React sabe que debe esperar a montar para leerlo, sin
  // arriesgar un mismatch de hidratación ni un setState dentro de un efecto.
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("galeno-theme", next);
    document.documentElement.setAttribute("data-theme", next);
    notify();
  }

  if (theme === null) {
    return <span className={`h-9 w-9 ${className ?? ""}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink-700 transition-colors hover:bg-surface-muted ${className ?? ""}`}
    >
      {theme === "dark" ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
    </button>
  );
}
