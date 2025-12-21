import { cn } from "@/lib/utils";

export type StackedAreaPoint = {
  label: string;
  segments: Record<string, number>;
  line?: number | null;
};

// Minimum number of points required to render a trend area chart
const MIN_POINTS = 2;

type StackedAreaChartProps = {
  points: StackedAreaPoint[];
  order: string[];
  colors: Record<string, string>;
  title?: string;
  subtitle?: string;
  lineLabel?: string;
  height?: number;
  className?: string;
};

type SegmentBounds = { start: number; end: number };

function buildBoundsForPoint(
  point: StackedAreaPoint,
  order: string[],
): Map<string, SegmentBounds> {
  const bounds = new Map<string, SegmentBounds>();
  let cursor = 0;
  order.forEach((key) => {
    const raw = point.segments[key] ?? 0;
    const value = Number.isFinite(raw) && raw > 0 ? Number(raw) : 0;
    const start = cursor;
    const end = cursor + value;
    bounds.set(key, { start, end });
    cursor = end;
  });
  return bounds;
}

export function buildStackedAreaDataset(
  points: StackedAreaPoint[],
  order: string[],
) {
  const bounds = points.map((p) => buildBoundsForPoint(p, order));
  const totals = points.map((p) =>
    order.reduce((sum, key) => sum + (p.segments[key] ?? 0), 0),
  );
  const maxTotal = Math.max(...totals, 1);

  const marginValues = points
    .map((p) => (p.line === null || p.line === undefined ? null : Number(p.line)))
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const maxMargin = Math.max(...marginValues, 0.2);

  return { bounds, maxTotal, maxMargin };
}

export function StackedAreaChart({
  points,
  order,
  colors,
  title,
  subtitle,
  lineLabel = "Margin",
  height = 320,
  className,
}: StackedAreaChartProps) {
  // Fail-soft when there are no points or not enough data to construct a trend
  if (points.length < MIN_POINTS || order.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card/80 p-4 text-xs text-muted-foreground", className)}>
        Need at least 2 data points to draw a trend.
      </div>
    );
  }

  // Virtual SVG width – keeps math deterministic while allowing responsive scaling via width="100%"
  const width = 1000;
  const padX = 52;
  const padY = 36;
  const innerHeight = height - padY * 2;
  const step = points.length <= 1 ? 0 : (width - padX * 2) / Math.max(points.length - 1, 1);

  const { bounds, maxTotal, maxMargin } = buildStackedAreaDataset(points, order);

  const yForTotal = (value: number) => height - padY - (value / maxTotal) * innerHeight;
  const yForMargin = (value: number) => height - padY - (value / maxMargin) * innerHeight;

  const areaPaths = order.map((key) => {
    const top: string[] = [];
    const bottom: string[] = [];
    let hasArea = false;

    points.forEach((point, idx) => {
      const x = padX + idx * step;
      const bound = bounds[idx]?.get(key) ?? { start: 0, end: 0 };
      const y0 = yForTotal(bound.start);
      const y1 = yForTotal(bound.end);
      if (bound.end > bound.start) hasArea = true;
      top.push(`${x.toFixed(2)},${y1.toFixed(2)}`);
      bottom.unshift(`${x.toFixed(2)},${y0.toFixed(2)}`);
    });

    if (!hasArea) return null;
    const path = `M ${top[0]} L ${top.slice(1).join(" L ")} L ${bottom.join(" L ")} Z`;
    return { key, path };
  }).filter(Boolean) as Array<{ key: string; path: string }>;

  // Build margin overlay path
  const marginPath = points.reduce((acc, point, idx) => {
    if (point.line === null || point.line === undefined || !Number.isFinite(point.line)) return acc;
    const x = padX + idx * step;
    const y = yForMargin(point.line);
    const cmd = `${x.toFixed(2)} ${y.toFixed(2)}`;
    return acc === "" ? `M ${cmd}` : `${acc} L ${cmd}`;
  }, "");

  const labelEvery = points.length <= 12 ? 1 : Math.ceil(points.length / 12);

  // Determine if we have a usable margin line (>=2 points)
  const showMarginLegend = marginPath !== "";

  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {title ? <div className="text-sm font-semibold text-foreground">{title}</div> : null}
          {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {showMarginLegend ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-blue-500/80" aria-hidden="true" />
              {lineLabel}
            </span>
          ) : null}
          {order.map((key) => (
            <span key={key} className="inline-flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: colors[key] ?? "#94a3b8" }}
                aria-hidden="true"
              />
              {key}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="mt-3 w-full" role="img" aria-label="Archetype trend stacked area">
        <defs>
          <linearGradient id="margin-line" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#3b82f6" stopOpacity="0.9" offset="0%" />
            <stop stopColor="#3b82f6" stopOpacity="0.4" offset="100%" />
          </linearGradient>
        </defs>

        {Array.from({ length: 4 }, (_, idx) => {
          const t = idx / 3;
          const y = padY + (1 - t) * innerHeight;
          return (
            <line
              key={`grid-${idx}`}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              opacity={idx === 0 ? 0.12 : 0.08}
            />
          );
        })}

        {areaPaths.map(({ key, path }) => (
          <path key={key} d={path} fill={colors[key] ?? "#94a3b8"} opacity="0.85" />
        ))}

        {marginPath ? (
          <path d={marginPath} fill="none" stroke="url(#margin-line)" strokeWidth={3} strokeLinecap="round" />
        ) : null}

        {points.map((point, idx) => {
          const x = padX + idx * step;
          const showLabel = idx === 0 || idx === points.length - 1 || idx % labelEvery === 0;
          return showLabel ? (
            <text
              key={`label-${point.label}-${idx}`}
              x={x}
              y={height - padY + 16}
              fontSize="10"
              fill="currentColor"
              textAnchor="middle"
              opacity="0.65"
            >
              {point.label}
            </text>
          ) : null;
        })}

        <g aria-hidden="true">
          <text x={width - padX + 10} y={padY + 4} fontSize="10" fill="currentColor" opacity="0.65">
            {(maxMargin * 100).toFixed(0)}%
          </text>
          <text x={width - padX + 10} y={height - padY + 4} fontSize="10" fill="currentColor" opacity="0.65">
            0%
          </text>
        </g>
      </svg>
    </div>
  );
}
