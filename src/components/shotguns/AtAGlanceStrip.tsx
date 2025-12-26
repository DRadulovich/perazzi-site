import type { ShotgunsSeriesEntry } from "@/types/catalog";
import { Heading, Section, Text } from "@/components/ui";

type AtAGlanceStripProps = Readonly<{
  data: ShotgunsSeriesEntry["atAGlance"];
}>;

export function AtAGlanceStrip({ data }: AtAGlanceStripProps) {
  return (
    <Section padding="md" aria-labelledby="at-a-glance-heading">
      <Heading id="at-a-glance-heading" level={2} size="lg" className="text-ink">
        At a glance
      </Heading>
      <dl className="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <dt>
            <Text size="xs" muted className="font-semibold">
              Trigger type
            </Text>
          </dt>
          <dd className="mt-2">
            <Text size="md" className="text-ink">
              {data.triggerType}
            </Text>
          </dd>
        </div>
        <div>
          <dt>
            <Text size="xs" muted className="font-semibold">
              Weight distribution
            </Text>
          </dt>
          <dd className="mt-2">
            <Text size="md" className="text-ink">
              {data.weightDistribution}
            </Text>
          </dd>
        </div>
        <div>
          <dt>
            <Text size="xs" muted className="font-semibold">
              Typical disciplines
            </Text>
          </dt>
          <dd className="mt-2">
            <Text size="md" className="text-ink">
              {data.typicalDisciplines.join(" · ")}
            </Text>
          </dd>
        </div>
      </dl>
      {data.links && data.links.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {data.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-perazzi-red shadow-sm backdrop-blur-sm transition hover:border-perazzi-red/30 hover:bg-card/85 focus-ring"
            >
              {link.label}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      ) : null}
    </Section>
  );
}
