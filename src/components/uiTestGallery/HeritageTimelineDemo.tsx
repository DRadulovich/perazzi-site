import { BrandTimeline } from "@/components/heritage/BrandTimeline";
import { getHeritagePageData } from "@/lib/heritage-data";

export default async function HeritageTimelineDemo() {
  const { timeline } = await getHeritagePageData();

  return (
    <div className="w-full">
      <BrandTimeline events={timeline} skipTargetId="ui-gallery-after-timeline" />
    </div>
  );
}
