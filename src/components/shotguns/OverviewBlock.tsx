import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { Section } from "@/components/ui";
import type { DisciplineSummary } from "@/types/catalog";

type OverviewBlockProps = {
  blocks?: DisciplineSummary["overviewPortableText"];
  html?: DisciplineSummary["overviewHtml"];
};

export function OverviewBlock({ blocks, html }: Readonly<OverviewBlockProps>) {
  return (
    <Section padding="md">
      {blocks?.length ? (
        <PortableText
          className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
          blocks={blocks}
        />
      ) : html ? (
        <SafeHtml
          className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
          html={html}
        />
      ) : null}
    </Section>
  );
}
