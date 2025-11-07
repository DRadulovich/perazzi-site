import type { GradeSeries } from "@/types/catalog";

type ProvenanceNoteProps = {
  html?: GradeSeries["provenanceHtml"];
};

export function ProvenanceNote({ html }: ProvenanceNoteProps) {
  if (!html) return null;

  return (
    <section className="rounded-3xl border border-border/70 bg-card px-6 py-6 shadow-sm sm:px-10">
      <div
        className="prose prose-sm max-w-none text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
