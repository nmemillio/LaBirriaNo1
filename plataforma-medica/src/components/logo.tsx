export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {/* Tres nodos enlazados: un codón es el trío de nucleótidos que el ADN
          usa para "programar" una proteína — el mismo símbolo lee como una
          cadena de código. */}
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-sm shadow-accent-600/25">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="4" cy="12" r="3.1" fill="currentColor" />
          <circle cx="12" cy="12" r="3.1" fill="currentColor" />
          <circle cx="20" cy="12" r="3.1" fill="currentColor" />
        </svg>
      </span>
      <span className="logo-wordmark text-[1.75rem] leading-none text-ink-900">Codón</span>
    </span>
  );
}
