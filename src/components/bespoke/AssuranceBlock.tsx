import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import type { AssuranceContent } from "@/types/build";
import { Heading, Section, Text } from "@/components/ui";

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
    <Section
      padding="md"
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-8"
      aria-labelledby="assurance-heading"
    >
      <div className="space-y-6">
        {heading ? (
          <Text
            id="assurance-heading"
            size="xs"
            className="font-semibold tracking-[0.35em] text-ink-muted"
            leading="normal"
          >
            {heading}
          </Text>
        ) : null}
        {label ? (
          <Heading level={2} size="lg" className="text-ink">
            {label}
          </Heading>
        ) : null}
        {body ? (
          <SafeHtml
            className="prose prose-base max-w-none leading-relaxed text-ink md:prose-lg"
            html={body}
          />
        ) : null}
        {quote ? (
          <blockquote className="rounded-2xl border-l-4 border-perazzi-red/60 bg-card/60 px-5 py-4 text-[13px] sm:text-sm italic leading-relaxed text-ink shadow-sm backdrop-blur-sm">
            <Text asChild size="md" className="italic text-ink" leading="relaxed">
              <p>“{quote.text}”</p>
            </Text>
            {quote.author ? (
              <Text
                asChild
                size="xs"
                className="mt-2 block not-italic tracking-[0.3em] text-ink-muted"
                leading="normal"
              >
                <cite>{quote.author}</cite>
              </Text>
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
            <Text asChild size="sm" className="text-ink-muted" leading="relaxed">
              <figcaption>{media.caption}</figcaption>
            </Text>
          ) : null}
        </figure>
      ) : null}
    </Section>
  );
}
