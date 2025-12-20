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
      <h2
        id="faq-heading"
        className="text-xl sm:text-2xl font-semibold text-ink"
      >
        {schemaName}
      </h2>
      <dl className="space-y-4">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:bg-card"
          >
            <dt className="text-sm sm:text-base font-semibold text-ink">
              {item.q}
            </dt>
            <dd className="mt-2 text-sm sm:text-base leading-relaxed text-ink-muted">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
      <script id={scriptId} type="application/ld+json">
        {schema}
      </script>
    </section>
  );
}
