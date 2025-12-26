type EditorialBlockProps = Readonly<{
  html: string;
}>;

import SafeHtml from "@/components/SafeHtml";
import { Section } from "@/components/ui";

export function EditorialBlock({ html }: EditorialBlockProps) {
  return (
    <Section padding="md">
      <SafeHtml
        className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    </Section>
  );
}
