import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type FAQItem = Readonly<{
  q: string;
  a: string;
}>;

type FAQListProps = Readonly<{
  items: readonly FAQItem[];
  schemaName?: string;
  scriptId?: string;
}>;

export function FAQList({
  items,
  schemaName = "Perazzi Shotguns FAQ",
  scriptId = "shotguns-faq-schema",
}: FAQListProps) {
  const schema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
    null,
    2,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="faq-heading"
    >
      <Heading id="faq-heading" level={2} size="lg" className="text-ink">
        {schemaName}
      </Heading>
      <dl className="space-y-4">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:bg-card/80"
          >
            <Heading asChild level={3} size="sm" className="text-ink">
              <dt>{item.q}</dt>
            </Heading>
            <Text asChild className="mt-2 text-ink-muted" leading="relaxed">
              <dd>{item.a}</dd>
            </Text>
          </div>
        ))}
      </dl>
      <script id={scriptId} type="application/ld+json">
        {schema}
      </script>
    </section>
  );
}
