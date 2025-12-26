import SafeHtml from "@/components/SafeHtml";
import { Text } from "@/components/ui/text";

type SidebarNoteProps = {
  title: string;
  html: string;
};

export function SidebarNote({ title, html }: Readonly<SidebarNoteProps>) {
  return (
    <aside className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm sm:text-base text-ink shadow-sm backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:px-6 sm:py-6">
      <Text size="xs" className="font-semibold text-ink-muted" leading="normal">
        {title}
      </Text>
      <SafeHtml
        className="prose prose-sm mt-3 max-w-none leading-relaxed text-ink md:prose-lg"
        html={html}
      />
    </aside>
  );
}
