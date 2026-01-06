import SafeHtml from "@/components/SafeHtml";
import { PortableText } from "@/components/PortableText";
import { Section } from "@/components/ui";
import type { DisciplineSummary } from "@/types/catalog";
import type { ReactNode } from "react";

type OverviewBlockProps = {
  blocks?: DisciplineSummary["overviewPortableText"];
  html?: DisciplineSummary["overviewHtml"];
};

export function OverviewBlock({ blocks, html }: Readonly<OverviewBlockProps>) {
  let content: ReactNode = null;

  if (blocks?.length) {
    content = (
      <PortableText
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        blocks={blocks}
      />
    );
  } else if (html) {
    content = (
      <SafeHtml
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    );
  }

  return (
    <Section padding="md">
      {content}
    </Section>
  );
}
