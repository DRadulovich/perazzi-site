import type { Platform } from "@/types/catalog";
import { PlatformCard } from "./PlatformCard";

type PlatformGridProps = {
  platforms: Platform[];
};

export function PlatformGrid({ platforms }: PlatformGridProps) {
  return (
    <section
      className="space-y-6"
      aria-labelledby="platforms-heading"
    >
      <div className="space-y-2">
        <h2 id="platforms-heading" className="text-2xl font-semibold text-ink">
          Platforms &amp; purpose
        </h2>
        <p className="max-w-3xl text-base text-ink-muted">
          Begin with lineage: MX, High Tech, and TM each carry a different balance, trigger philosophy, and place on the line.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform, index) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            priority={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
