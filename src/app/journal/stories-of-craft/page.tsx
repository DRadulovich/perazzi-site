import { journalCategories } from "@/content/journal";
import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";

type StoriesOfCraftPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function StoriesOfCraftPage({
  searchParams,
}: StoriesOfCraftPageProps) {
  return (
    <CategoryPageLayout
      data={journalCategories.craft}
      categoryKey="craft"
      basePath="/journal/stories-of-craft"
      searchParams={searchParams}
    />
  );
}
