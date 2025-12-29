import type { ShotgunsSeriesEntry, DisciplineSummary } from "@/types/catalog";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
      <Heading id="discipline-map-heading" level={2} size="lg" className="text-ink">
        Discipline pairing
      </Heading>
      <div className="flex flex-wrap gap-4">
        {items.map((entry) => {
          const discipline = disciplines[entry.disciplineId];
          const label = entry.label ?? discipline?.name ?? entry.disciplineId;
          const href = entry.href ?? `/shotguns/disciplines/${entry.disciplineId}`;
          return (
            <a
              key={entry.disciplineId}
              href={href}
              className="flex max-w-sm flex-col rounded-2xl border border-border/70 bg-card/60 p-4 text-left shadow-soft backdrop-blur-sm transition hover:border-ink/20 hover:bg-card/85 focus-ring sm:rounded-3xl sm:bg-card/80"
              data-analytics-id={`SeriesDisciplineChip:${entry.disciplineId}`}
            >
              <Text
                asChild
                size="label-tight"
                className="text-ink-muted"
                leading="normal"
              >
                <span>{label}</span>
              </Text>
              <Text className="mt-2 text-ink-muted">{entry.rationale}</Text>
            </a>
          );
        })}
      </div>
    </section>
  );
}
