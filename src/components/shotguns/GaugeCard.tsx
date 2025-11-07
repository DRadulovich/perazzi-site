import type { GaugeInfo } from "@/types/catalog";

type GaugeCardProps = {
  gauge: GaugeInfo;
};

export function GaugeCard({ gauge }: GaugeCardProps) {
  return (
    <article
      data-analytics-id={`GaugeCard:${gauge.id}`}
      className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-sm focus-within:ring-2 focus-within:ring-perazzi-red/60 focus-within:ring-offset-2 focus-within:ring-offset-card"
    >
      <header className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          {gauge.label}
        </span>
        <h2 className="text-lg font-semibold text-ink">
          {gauge.description}
        </h2>
      </header>
      <p className="mt-3 text-sm text-ink-muted">
        {gauge.handlingNotes}
      </p>
      <div className="mt-4 space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        <span>Typical disciplines</span>
        <p className="text-sm normal-case tracking-normal text-ink">
          {gauge.typicalDisciplines.join(" • ")}
        </p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-ink-muted">
        <strong className="block text-xs uppercase tracking-[0.3em] text-ink-muted">
          Common barrels
        </strong>
        <p>{gauge.commonBarrels.join(" · ")}</p>
      </div>
      {gauge.faq && gauge.faq.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-ink-muted">
          {gauge.faq.slice(0, 2).map((item) => (
            <li key={item.q}>
              <strong className="block text-xs uppercase tracking-[0.3em] text-ink-muted">
                {item.q}
              </strong>
              <p className="mt-1">{item.a}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
