import Image from "next/image";
import type { PlatformHighlight } from "@/types/catalog";

type EngHighlightsGridProps = {
  highlights: PlatformHighlight[];
};

export function EngHighlightsGrid({ highlights }: EngHighlightsGridProps) {
  return (
    <section
      className="space-y-4"
      aria-labelledby="engineering-highlights-heading"
    >
      <h2
        id="engineering-highlights-heading"
        className="text-xl font-semibold text-ink"
      >
        Engineering highlights
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {highlights.map((highlight) => {
          const ratio = highlight.media.aspectRatio ?? 4 / 3;
          return (
            <article
              key={highlight.title}
              className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div
                className="relative overflow-hidden rounded-xl bg-neutral-200"
                style={{ aspectRatio: ratio }}
              >
                <Image
                  src={highlight.media.url}
                  alt={highlight.media.alt}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {highlight.title}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{highlight.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
