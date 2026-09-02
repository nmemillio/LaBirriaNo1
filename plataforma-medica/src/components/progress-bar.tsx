export function ProgressBar({
  percent,
  label,
  compact = false,
}: {
  percent: number;
  label?: string;
  compact?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      {label && (
        <div className={`flex items-center justify-between ${compact ? "mb-1 text-xs" : "mb-1.5 text-sm"} font-medium text-ink-500`}>
          <span>{label}</span>
          <span className="text-ink-900">{clamped}%</span>
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
