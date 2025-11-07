import type { GaugeInfo } from "@/types/catalog";
import { GaugeCard } from "./GaugeCard";

type GaugeCardGridProps = {
  gauges: GaugeInfo[];
};

export function GaugeCardGrid({ gauges }: GaugeCardGridProps) {
  return (
    <section
      className="space-y-4"
      aria-labelledby="gauge-card-grid-heading"
    >
      <h2
        id="gauge-card-grid-heading"
        className="text-xl font-semibold text-ink"
      >
        Gauges &amp; balance
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {gauges.map((gauge) => (
          <GaugeCard key={gauge.id} gauge={gauge} />
        ))}
      </div>
    </section>
  );
}
