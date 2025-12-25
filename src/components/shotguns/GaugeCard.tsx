import type { GaugeInfo } from "@/types/catalog";

type GaugeCardProps = {
  readonly gauge: GaugeInfo;
};

export function GaugeCard({ gauge }: GaugeCardProps) {
  return (
    <article
      data-analytics-id={`GaugeCard:${gauge.id}`}
      className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm focus-within:ring-2 focus-within:ring-perazzi-red/60 focus-within:ring-offset-2 focus-within:ring-offset-card sm:rounded-3xl sm:bg-card/80 sm:p-5"
    >
      <header className="space-y-1">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          {gauge.label}
        </span>
        <h2 className="text-base sm:text-lg font-semibold text-ink">
          {gauge.description}
        </h2>
      </header>
      <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink-muted">
        {gauge.handlingNotes}
      </p>
      <div className="mt-4 space-y-2">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Typical disciplines
        </span>
        <p className="text-sm sm:text-base leading-relaxed normal-case tracking-normal text-ink">
          {gauge.typicalDisciplines.join(" • ")}
        </p>
      </div>
      <div className="mt-4 space-y-2 text-sm sm:text-base leading-relaxed text-ink-muted">
        <strong className="block text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink-muted">
          Common barrels
        </strong>
        <p>{gauge.commonBarrels.join(" · ")}</p>
      </div>
      {gauge.faq && gauge.faq.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm sm:text-base leading-relaxed text-ink-muted">
          {gauge.faq.slice(0, 2).map((item) => (
            <li key={item.q}>
              <strong className="block text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink-muted">
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
