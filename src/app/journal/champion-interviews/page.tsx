import { journalCategories } from "@/content/journal";
import { CategoryHeader } from "@/components/journal/CategoryHeader";
import { CategoryView } from "@/components/journal/CategoryView";

export default function ChampionInterviewsPage() {
  const data = journalCategories.interviews;
  return (
    <div className="space-y-10">
      <CategoryHeader header={data.header} />
      <CategoryView data={data} categoryKey="interviews" />
    </div>
  );
}
