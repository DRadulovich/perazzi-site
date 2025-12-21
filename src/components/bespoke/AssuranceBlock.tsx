import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import type { AssuranceContent } from "@/types/build";

type AssuranceBlockProps = Readonly<{
  assurance: AssuranceContent;
}>;

export function AssuranceBlock({ assurance }: AssuranceBlockProps) {
  const { html, quote, media } = assurance;
  const heading = assurance.heading;
  const label = assurance.label;
  const body = assurance.body ?? html;
  const ratio = media?.aspectRatio ?? 3 / 2;

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/10 px-4 py-6 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-8"
      aria-labelledby="assurance-heading"
    >
      <div className="space-y-6">
        {heading ? (
          <p
            id="assurance-heading"
            className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted"
          >
            {heading}
          </p>
        ) : null}
        {label ? (
          <p className="text-lg font-semibold text-ink">{label}</p>
        ) : null}
        {body ? (
          <SafeHtml
            className="prose prose-base max-w-none leading-relaxed text-ink md:prose-lg"
            html={body}
          />
        ) : null}
        {quote ? (
          <blockquote className="rounded-2xl border-l-4 border-perazzi-red/60 bg-card/40 px-5 py-4 text-[13px] sm:text-sm italic leading-relaxed text-ink">
            <p>“{quote.text}”</p>
            {quote.author ? (
              <cite className="mt-2 block not-italic text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink-muted">
                {quote.author}
              </cite>
            ) : null}
          </blockquote>
        ) : null}
      </div>
      {media ? (
        <figure className="mt-6 space-y-3 lg:mt-0">
          <div
            className="relative overflow-hidden rounded-2xl bg-[color:var(--color-canvas)]"
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
            <figcaption className="text-[11px] sm:text-xs leading-relaxed text-ink-muted">
              {media.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </section>
  );
}
