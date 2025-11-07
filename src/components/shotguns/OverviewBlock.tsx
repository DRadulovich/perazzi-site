import type { DisciplineSummary } from "@/types/catalog";

type OverviewBlockProps = {
  html: DisciplineSummary["overviewHtml"];
};

export function OverviewBlock({ html }: OverviewBlockProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10">
      <div
        className="prose prose-sm max-w-none text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
