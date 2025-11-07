import { journalCategories } from "@/content/journal";
import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";

type NewsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function JournalNewsPage({ searchParams }: NewsPageProps) {
  return (
    <CategoryPageLayout
      data={journalCategories.news}
      categoryKey="news"
      basePath="/journal/news"
      searchParams={searchParams}
    />
  );
}
