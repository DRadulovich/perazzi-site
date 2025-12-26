import { Heading, Section, Text } from "@/components/ui";

type PrimerBlockProps = {
  readonly copy: string;
  readonly href: string;
  readonly bullets: readonly string[];
};

export function PrimerBlock({ copy, href, bullets }: PrimerBlockProps) {
  return (
    <Section data-analytics-id="ShotgunsGaugesCTA" padding="md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Heading
            level={2}
            size="xl"
            className="font-bold italic uppercase tracking-[0.35em] text-ink"
          >
            Gauge primer
          </Heading>
          <Text className="max-w-3xl text-ink-muted">{copy}</Text>
          <ul className="list-disc space-y-1 pl-5 text-sm sm:text-base leading-relaxed text-ink-muted">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <a
          href={href}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red shadow-soft backdrop-blur-sm transition hover:border-perazzi-red/30 hover:bg-card/85 focus-ring"
        >
          Explore gauges
          {' '}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </Section>
  );
}
