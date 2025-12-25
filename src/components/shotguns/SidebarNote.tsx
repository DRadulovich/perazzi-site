type SidebarNoteProps = {
  title: string;
  html: string;
};

import SafeHtml from "@/components/SafeHtml";

export function SidebarNote({ title, html }: SidebarNoteProps) {
  return (
    <aside className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm sm:text-base text-ink shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-6">
      <h2 className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
        {title}
      </h2>
      <SafeHtml
        className="prose prose-sm mt-3 max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    </aside>
  );
}
