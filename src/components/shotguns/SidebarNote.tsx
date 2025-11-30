type SidebarNoteProps = {
  title: string;
  html: string;
};

export function SidebarNote({ title, html }: SidebarNoteProps) {
  return (
    <aside className="rounded-2xl border border-border/60 bg-card/10 p-4 text-sm sm:text-base text-ink shadow-sm sm:rounded-3xl sm:border-border/70 sm:bg-card sm:px-6 sm:py-6">
      <h2 className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        {title}
      </h2>
      <div
        className="prose prose-sm mt-3 max-w-none leading-relaxed text-ink md:prose-lg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </aside>
  );
}
