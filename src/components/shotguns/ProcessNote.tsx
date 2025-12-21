type ProcessNoteProps = {
  title: string;
  html: string;
  dataAnalyticsId?: string;
};

import SafeHtml from "@/components/SafeHtml";

export function ProcessNote({
  title,
  html,
  dataAnalyticsId = "ProcessNote",
}: ProcessNoteProps) {
  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-8 sm:shadow-md lg:px-10"
      aria-labelledby="process-note-heading"
      data-analytics-id={dataAnalyticsId}
    >
      <div className="space-y-3">
        <p
          id="process-note-heading"
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted"
        >
          {title}
        </p>
        <SafeHtml
          className="prose prose-sm max-w-none leading-relaxed text-ink md:prose-lg"
          html={html}
        />
      </div>
    </section>
  );
}
