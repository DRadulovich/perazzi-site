import type { GradeSeries } from "@/types/catalog";
import SafeHtml from "@/components/SafeHtml";

type ProvenanceNoteProps = {
  html?: GradeSeries["provenanceHtml"];
};

export function ProvenanceNote({ html }: ProvenanceNoteProps) {
  if (!html) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-6 sm:shadow-elevated lg:px-10">
      <SafeHtml
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    </section>
  );
}
