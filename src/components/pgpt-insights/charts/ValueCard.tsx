import { cn } from "@/lib/utils";

type Tone = "default" | "positive" | "warning" | "critical";

const TONE_CLASSES: Record<Tone, string> = {
  default: "border-border/80 bg-card/80",
  positive: "border-emerald-500/40 bg-emerald-500/5",
  warning: "border-amber-500/50 bg-amber-500/5",
  critical: "border-red-500/50 bg-red-500/5",
};

type ValueCardProps = {
  title: string;
  value: string;
  tone?: Tone;
  description?: string;
  kicker?: string;
  className?: string;
};

export function ValueCard({ title, value, tone = "default", description, kicker, className }: ValueCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 rounded-2xl border shadow-sm px-4 py-4",
        TONE_CLASSES[tone] ?? TONE_CLASSES.default,
        className,
      )}
    >
      <div className="space-y-1">
        {kicker ? <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{kicker}</div> : null}
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
      </div>
      <div className="text-3xl font-semibold leading-tight text-foreground">{value}</div>
    </div>
  );
}
