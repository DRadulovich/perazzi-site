import type { GradeOption } from "@/types/catalog";
import { Heading, Text } from "@/components/ui";

type OptionsGridProps = {
  options?: GradeOption[];
};

export function OptionsGrid({ options }: Readonly<OptionsGridProps>) {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="grade-options-heading"
    >
      <Heading id="grade-options-heading" level={2} size="lg" className="text-ink">
        Commission options
      </Heading>
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => (
          <article
            key={option.id}
            className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80"
          >
            <Heading level={3} size="sm" className="text-ink">
              {option.title}
            </Heading>
            <Text size="md" muted leading="relaxed" className="mt-2">
              {option.description}
            </Text>
          </article>
        ))}
      </div>
    </section>
  );
}
