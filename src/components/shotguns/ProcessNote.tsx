import SafeHtml from "@/components/SafeHtml";
import { Text } from "@/components/ui/text";

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
    <section
      className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10"
      aria-labelledby="process-note-heading"
      data-analytics-id={dataAnalyticsId}
    >
      <div className="space-y-3">
        <Text
          id="process-note-heading"
          size="xs"
          className="font-semibold text-ink-muted"
          leading="normal"
        >
          {title}
        </Text>
        <SafeHtml
          className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
          html={html}
        />
      </div>
    </section>
  );
}
