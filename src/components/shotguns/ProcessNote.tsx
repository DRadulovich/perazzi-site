import SafeHtml from "@/components/SafeHtml";
import { Section, Text } from "@/components/ui";

type ProcessNoteProps = {
  title: string;
  html: string;
  dataAnalyticsId?: string;
};

export function ProcessNote({
  title,
  html,
  dataAnalyticsId = "ProcessNote",
}: Readonly<ProcessNoteProps>) {
  return (
    <Section
      padding="md"
      aria-labelledby="process-note-heading"
      data-analytics-id={dataAnalyticsId}
    >
      <div className="space-y-3">
        <Text
          id="process-note-heading"
          size="label-tight"
          className="text-ink-muted"
          leading="normal"
        >
          {title}
        </Text>
        <SafeHtml
          className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
          html={html}
        />
      </div>
    </Section>
  );
}
