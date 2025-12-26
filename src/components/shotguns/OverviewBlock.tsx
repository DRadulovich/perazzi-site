import type { DisciplineSummary } from "@/types/catalog";
import SafeHtml from "@/components/SafeHtml";
import { Section } from "@/components/ui";

type OverviewBlockProps = {
  html: DisciplineSummary["overviewHtml"];
};

export function OverviewBlock({ html }: Readonly<OverviewBlockProps>) {
  return (
    <Section padding="md">
      <SafeHtml
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    </Section>
  );
}
