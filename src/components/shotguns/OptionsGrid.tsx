import type { GradeOption } from "@/types/catalog";

type OptionsGridProps = {
  options?: GradeOption[];
};

export function OptionsGrid({ options }: OptionsGridProps) {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="grade-options-heading"
    >
      <h2
        id="grade-options-heading"
        className="text-xl sm:text-2xl font-semibold text-ink"
      >
        Commission options
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => (
          <article
            key={option.id}
            className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80"
          >
            <h3 className="text-base font-semibold text-ink">
              {option.title}
            </h3>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink-muted">
              {option.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
