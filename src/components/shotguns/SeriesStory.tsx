import type { ShotgunsSeriesEntry } from "@/types/catalog";

type SeriesStoryProps = {
  html: ShotgunsSeriesEntry["storyHtml"];
};

export function SeriesStory({ html }: SeriesStoryProps) {
  return (
    <section className="prose prose-sm max-w-none text-ink">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
