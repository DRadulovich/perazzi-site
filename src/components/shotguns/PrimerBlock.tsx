type PrimerBlockProps = {
  copy: string;
  href: string;
  bullets: string[];
};

export function PrimerBlock({ copy, href, bullets }: PrimerBlockProps) {
  return (
    <section
      data-analytics-id="ShotgunsGaugesCTA"
      className="rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold italic uppercase tracking-[0.35em] text-ink">Gauge primer</h2>
          <p className="max-w-3xl text-sm text-ink-muted">{copy}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <a
          href={href}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
        >
          Explore gauges
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
