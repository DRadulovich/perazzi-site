import Image from "next/image";
import type { AssuranceContent } from "@/types/build";

type AssuranceBlockProps = {
  assurance: AssuranceContent;
};

export function AssuranceBlock({ assurance }: AssuranceBlockProps) {
  const { html, quote, media } = assurance;
  const ratio = media?.aspectRatio ?? 16 / 9;

  return (
    <section
      className="gap-8 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"
      aria-labelledby="assurance-heading"
    >
      <div className="space-y-6">
        <div
          id="assurance-heading"
          className="prose prose-base max-w-none text-ink md:prose-lg"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {quote ? (
          <blockquote className="rounded-2xl border-l-4 border-perazzi-red/60 bg-card/60 px-6 py-4 text-sm italic text-ink">
            <p>“{quote.text}”</p>
            {quote.author ? (
              <cite className="mt-2 block not-italic text-xs uppercase tracking-[0.3em] text-ink-muted">
                {quote.author}
              </cite>
            ) : null}
          </blockquote>
        ) : null}
      </div>
      {media ? (
        <figure className="mt-6 space-y-3 lg:mt-0">
          <div
            className="relative overflow-hidden rounded-2xl bg-neutral-200"
            style={{ aspectRatio: ratio }}
          >
            {media.kind === "image" ? (
              <Image
                src={media.url}
                alt={media.alt}
                fill
                sizes="(min-width: 1280px) 480px, (min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : (
              <video
                src={media.url}
                controls
                preload="metadata"
                className="h-full w-full object-cover"
              >
                <track kind="captions" />
              </video>
            )}
          </div>
          {media.caption ? (
            <figcaption className="text-xs text-ink-muted">
              {media.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </section>
  );
}
