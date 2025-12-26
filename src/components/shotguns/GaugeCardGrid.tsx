import type { GaugeInfo } from "@/types/catalog";
import { GaugeCard } from "./GaugeCard";
import { Heading } from "@/components/ui/heading";

type GaugeCardGridProps = {
  gauges: GaugeInfo[];
};

export function GaugeCardGrid({ gauges }: Readonly<GaugeCardGridProps>) {
  return (
    <section
      className="space-y-4"
      aria-labelledby="gauge-card-grid-heading"
    >
      <Heading id="gauge-card-grid-heading" level={2} size="lg" className="text-ink">
        Gauges &amp; balance
      </Heading>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {gauges.map((gauge) => (
          <GaugeCard key={gauge.id} gauge={gauge} />
        ))}
      </div>
    </section>
  );
}
