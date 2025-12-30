import type { ShotgunsSeriesEntry } from "@/types/catalog";
import SafeHtml from "@/components/SafeHtml";

type SeriesStoryProps = {
  html: ShotgunsSeriesEntry["storyHtml"];
};

export function SeriesStory({ html }: SeriesStoryProps) {
  return (
    <section className="type-body max-w-none text-ink">
      <SafeHtml html={html} />
    </section>
  );
}
