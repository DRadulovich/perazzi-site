type SparklineProps = {
  readonly values: ReadonlyArray<number | null | undefined>;
  readonly width?: number;
  readonly height?: number;
  readonly strokeWidth?: number;
  readonly className?: string;
  readonly title?: string;
};

function buildPath(values: ReadonlyArray<number | null | undefined>, width: number, height: number): string {
  const finite = values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null));
  const valid = finite.filter((v): v is number => v !== null);

  if (valid.length === 0) return "";

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;

  const step = values.length <= 1 ? 0 : width / (values.length - 1);

  let d = "";
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

    if (penDown) {
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    } else {
      d += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
      penDown = true;
    }
  }

  return d.trim();
}

export function Sparkline({
  values,
  width = 96,
  height = 28,
  strokeWidth = 2,
  className,
  title,
}: Readonly<SparklineProps>) {
  const d = buildPath(values, width, height);

  return (
    <svg
      aria-label={title ?? "sparkline"}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {title ? <title>{title}</title> : null}

      <path d={`M 0 ${height - 0.5} L ${width} ${height - 0.5}`} stroke="currentColor" opacity="0.15" />

      {d ? (
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d={`M 0 ${height / 2} L ${width} ${height / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity="0.25"
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}
