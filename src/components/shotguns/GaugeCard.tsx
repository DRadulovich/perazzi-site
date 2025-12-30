import type { GaugeInfo } from "@/types/catalog";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type GaugeCardProps = {
  readonly gauge: GaugeInfo;
};

export function GaugeCard({ gauge }: GaugeCardProps) {
  return (
    <article
      data-analytics-id={`GaugeCard:${gauge.id}`}
      className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm focus-within:ring-2 focus-within:ring-perazzi-red/60 focus-within:ring-offset-2 focus-within:ring-offset-card sm:rounded-3xl sm:bg-card/80 sm:p-5"
    >
      <header className="space-y-1">
        <Text asChild size="label-tight" className="text-ink-muted" leading="normal">
          <span>{gauge.label}</span>
        </Text>
        <Heading level={3} size="sm" className="text-ink">
          {gauge.description}
        </Heading>
      </header>
      <Text className="mt-3 text-ink-muted">{gauge.handlingNotes}</Text>
      <div className="mt-4 space-y-2">
        <Text asChild size="label-tight" className="text-ink-muted" leading="normal">
          <span>Typical disciplines</span>
        </Text>
        <Text className="text-ink">
          {gauge.typicalDisciplines.join(" • ")}
        </Text>
      </div>
      <div className="mt-4 space-y-2 text-ink-muted">
        <Text
          asChild
          size="label-tight"
          className="block text-ink-muted"
          leading="normal"
        >
          <span>Common barrels</span>
        </Text>
        <Text asChild size="sm" className="text-ink-muted">
          <p>{gauge.commonBarrels.join(" · ")}</p>
        </Text>
      </div>
      {gauge.faq && gauge.faq.length > 0 ? (
        <ul className="mt-4 space-y-2 text-ink-muted">
          {gauge.faq.slice(0, 2).map((item) => (
            <li key={item.q}>
              <Text
                asChild
                size="label-tight"
                className="block text-ink-muted"
                leading="normal"
              >
                <span>{item.q}</span>
              </Text>
              <Text asChild size="sm" className="mt-1 text-ink-muted">
                <p>{item.a}</p>
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
