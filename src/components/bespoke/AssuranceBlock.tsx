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
            size="label-tight"
            className="text-ink-muted"
          >
            {heading}
          </Text>
        ) : null}
        {label ? (
          <Heading level={2} size="xl" className="text-ink">
            {label}
          </Heading>
        ) : null}
        {body ? (
          <SafeHtml
            className="max-w-none type-body text-ink [&_p]:mb-4 [&_p:last-child]:mb-0"
            html={body}
          />
        ) : null}
        {quote ? (
          <blockquote className="rounded-2xl border-l-4 border-perazzi-red/60 bg-card/60 px-5 py-4 text-ink shadow-soft backdrop-blur-sm">
            <Text asChild size="md" className="font-artisan text-ink text-2xl">
              <p>“{quote.text}”</p>
            </Text>
            {quote.author ? (
              <Text
                asChild
                size="label-tight"
                className="mt-2 block text-ink-muted"
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
            className="relative overflow-hidden rounded-2xl bg-(--color-canvas) aspect-dynamic"
            style={{ "--aspect-ratio": ratio }}
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
            <Text asChild size="sm" className="text-ink-muted">
              <figcaption>{media.caption}</figcaption>
            </Text>
          ) : null}
        </figure>
      ) : null}
    </Section>
  );
}
