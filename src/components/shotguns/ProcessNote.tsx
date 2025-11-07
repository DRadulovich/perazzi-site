type ProcessNoteProps = {
  title: string;
  html: string;
  dataAnalyticsId?: string;
};

export function ProcessNote({
  title,
  html,
  dataAnalyticsId = "ProcessNote",
}: ProcessNoteProps) {
  return (
    <section
      className="rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="process-note-heading"
      data-analytics-id={dataAnalyticsId}
    >
      <div className="space-y-3">
        <p
          id="process-note-heading"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted"
        >
          {title}
        </p>
        <div
          className="prose prose-sm max-w-none text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
