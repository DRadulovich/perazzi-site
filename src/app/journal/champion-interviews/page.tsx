import { journalCategories } from "@/content/journal";
import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";

type ChampionInterviewsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function ChampionInterviewsPage({
  searchParams,
}: ChampionInterviewsPageProps) {
  return (
    <CategoryPageLayout
      data={journalCategories.interviews}
      categoryKey="interviews"
      basePath="/journal/champion-interviews"
      searchParams={searchParams}
    />
  );
}
