function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function barWidthPct(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return "0%";
  const pct = clamp01(value / max) * 100;
  return `${pct.toFixed(0)}%`;
}

export function MiniBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const w = barWidthPct(value, max);

  return (
    <div className="relative h-6 w-full overflow-hidden rounded-md border border-border bg-background">
      <div className="absolute inset-y-0 left-0 bg-muted/70" style={{ width: w }} aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent to-background/30"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-6 items-center justify-end px-2 tabular-nums">
        <span className="text-foreground">{value}</span>
        {label ? <span className="ml-1 text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}