import type { GradeSeries } from "@/types/catalog";
import SafeHtml from "@/components/SafeHtml";
import { Section } from "@/components/ui";

type ProvenanceNoteProps = {
  html?: GradeSeries["provenanceHtml"];
};

export function ProvenanceNote({ html }: Readonly<ProvenanceNoteProps>) {
  if (!html) return null;

  return (
    <Section padding="md">
      <SafeHtml
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    </Section>
  );
}
