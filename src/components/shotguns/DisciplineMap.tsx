import type { ShotgunsSeriesEntry, DisciplineSummary } from "@/types/catalog";

type DisciplineMapProps = Readonly<{
  items: ShotgunsSeriesEntry["disciplineMap"];
  disciplines: Record<string, DisciplineSummary>;
}>;

export function DisciplineMap({ items, disciplines }: DisciplineMapProps) {
  return (
    <section
      className="space-y-4"
      aria-labelledby="discipline-map-heading"
    >
      <h2
        id="discipline-map-heading"
        className="text-xl sm:text-2xl font-semibold text-ink"
      >
        Discipline pairing
      </h2>
      <div className="flex flex-wrap gap-4">
        {items.map((entry) => {
          const discipline = disciplines[entry.disciplineId];
          const label = entry.label ?? discipline?.name ?? entry.disciplineId;
          const href = entry.href ?? `/shotguns/disciplines/${entry.disciplineId}`;
          return (
            <a
              key={entry.disciplineId}
              href={href}
              className="flex max-w-sm flex-col rounded-2xl border border-border/60 bg-card/10 p-4 text-left shadow-sm focus-ring sm:rounded-3xl sm:bg-card"
              data-analytics-id={`SeriesDisciplineChip:${entry.disciplineId}`}
            >
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
                {label}
              </span>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink-muted">
                {entry.rationale}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
