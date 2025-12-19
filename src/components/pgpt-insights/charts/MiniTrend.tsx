"use client";

import { cn } from "@/lib/utils";

type MiniTrendProps = {
  values: Array<number | null | undefined>;
  className?: string;
  height?: number;
  title?: string;
  area?: boolean;
};

function buildLine(values: Array<number | null | undefined>, width: number, height: number) {
  const finite = values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null));
  const valid = finite.filter((v): v is number => v !== null);
  if (valid.length === 0) return { line: "", areaPath: "" };

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const step = values.length <= 1 ? 0 : width / (values.length - 1);

  let line = "";
  let areaPath = "";
  let penDown = false;

  for (let i = 0; i < finite.length; i++) {
    const v = finite[i];
    const x = i * step;
    if (v === null) {
      penDown = false;
      continue;
    }

    const t = (v - min) / range;
    const y = height - t * height;

    if (!penDown) {
      line += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
      areaPath += `${i === 0 ? `M 0 ${height}` : ""} L ${x.toFixed(2)} ${y.toFixed(2)} `;
      penDown = true;
    } else {
      line += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
      areaPath += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }

    if (i === finite.length - 1) {
      areaPath += `L ${x.toFixed(2)} ${height} Z`;
    }
  }

  return { line: line.trim(), areaPath: areaPath.trim() };
}

export function MiniTrend({ values, className, height = 64, title, area = true }: MiniTrendProps) {
  const width = 220;
  const { line, areaPath } = buildLine(values, width, height);
  const hasData = Boolean(line);

  return (
    <svg
      role="img"
      aria-label={title ?? "trend"}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-16 w-full text-foreground/80", className)}
      preserveAspectRatio="none"
    >
      {title ? <title>{title}</title> : null}

      <path d={`M 0 ${height - 0.5} L ${width} ${height - 0.5}`} stroke="currentColor" opacity="0.08" />
      <path
        d={`M 0 ${height * 0.4} L ${width} ${height * 0.4}`}
        stroke="currentColor"
        opacity="0.04"
        strokeDasharray="4 4"
      />

      {hasData ? (
        <>
          {area ? (
            <path
              d={areaPath}
              fill="currentColor"
              opacity="0.08"
              stroke="none"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : (
        <path
          d={`M 0 ${height / 2} L ${width} ${height / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          opacity="0.25"
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}
