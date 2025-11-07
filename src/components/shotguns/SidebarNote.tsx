type SidebarNoteProps = {
  title: string;
  html: string;
};

export function SidebarNote({ title, html }: SidebarNoteProps) {
  return (
    <aside className="rounded-3xl border border-border/70 bg-card px-6 py-6 text-sm text-ink shadow-sm sm:px-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        {title}
      </h2>
      <div
        className="prose prose-sm mt-3 max-w-none text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </aside>
  );
}
