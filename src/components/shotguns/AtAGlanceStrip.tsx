import type { ShotgunsSeriesEntry } from "@/types/catalog";

type AtAGlanceStripProps = Readonly<{
  data: ShotgunsSeriesEntry["atAGlance"];
}>;

export function AtAGlanceStrip({ data }: AtAGlanceStripProps) {
  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="at-a-glance-heading"
    >
      <h2
        id="at-a-glance-heading"
        className="text-xl sm:text-2xl font-semibold text-ink"
      >
        At a glance
      </h2>
      <dl className="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            Trigger type
          </dt>
          <dd className="mt-2 text-sm sm:text-base text-ink">
            {data.triggerType}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            Weight distribution
          </dt>
          <dd className="mt-2 text-sm sm:text-base text-ink">
            {data.weightDistribution}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            Typical disciplines
          </dt>
          <dd className="mt-2 text-sm sm:text-base text-ink">
            {data.typicalDisciplines.join(" · ")}
          </dd>
        </div>
      </dl>
      {data.links && data.links.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {data.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
            >
              {link.label}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
