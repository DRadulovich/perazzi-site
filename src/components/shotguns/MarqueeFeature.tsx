import Image from "next/image";
import type { FactoryAsset } from "@/types/content";

type ChampionData = {
  id: string;
  name?: string;
  title?: string;
  quote: string;
  image: FactoryAsset;
  href?: string;
};

type MarqueeFeatureProps = {
  champion?: ChampionData;
  fallbackText?: string;
};

export function MarqueeFeature({ champion, fallbackText }: MarqueeFeatureProps) {
  if (!champion) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-8 text-ink shadow-sm sm:px-10">
        <h2 className="text-xl font-semibold">Perazzi lineage</h2>
        <p className="mt-3 text-sm text-ink-muted">
          {fallbackText ??
            "Every Perazzi platform is validated by generations of champions. Visit the heritage timeline to explore their stories."}
        </p>
      </section>
    );
  }

  const ratio = champion.image.aspectRatio ?? 3 / 4;

  return (
    <section
      data-analytics-id={`ChampionStory:${champion.id}`}
      className="grid gap-8 rounded-3xl border border-border/70 bg-card px-6 py-10 text-ink shadow-sm sm:px-10 md:grid-cols-[minmax(280px,1fr)_minmax(320px,1fr)] md:items-center"
    >
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={champion.image.url}
          alt={champion.image.alt}
          fill
          sizes="(min-width: 1024px) 440px, 100vw"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Champion spotlight
        </p>
        {champion.name ? (
          <h2 className="text-3xl font-semibold text-ink">{champion.name}</h2>
        ) : null}
        {champion.title ? (
          <cite className="block text-base font-medium text-ink-muted not-italic">
            {champion.title}
          </cite>
        ) : null}
        <blockquote className="border-l-2 border-perazzi-red/50 pl-4 text-xl italic leading-relaxed text-ink">
          “{champion.quote}”
        </blockquote>
        {champion.href ? (
          <a
            href={champion.href}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
          >
            Meet the champions
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
