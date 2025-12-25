type PrimerBlockProps = {
  readonly copy: string;
  readonly href: string;
  readonly bullets: readonly string[];
};

export function PrimerBlock({ copy, href, bullets }: PrimerBlockProps) {
  return (
    <section
      data-analytics-id="ShotgunsGaugesCTA"
      className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold italic uppercase tracking-[0.35em] text-ink">Gauge primer</h2>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-ink-muted">{copy}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm sm:text-base leading-relaxed text-ink-muted">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <a
          href={href}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red shadow-sm backdrop-blur-sm transition hover:border-perazzi-red/30 hover:bg-card/85 focus-ring"
        >
          Explore gauges
          {' '}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
