import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";
import { getJournalCategoryData } from "@/lib/journal-data";
import { Text } from "@/components/ui/text";

type NewsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function JournalNewsPage({ searchParams }: NewsPageProps) {
  const data = await getJournalCategoryData("news");
  if (!data) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-center text-ink shadow-soft sm:px-10">
        <Text size="lg" className="text-ink" leading="normal">
          News stories are coming soon.
        </Text>
      </section>
    );
  }

  return (
    <CategoryPageLayout
      data={data}
      categoryKey="news"
      basePath="/journal/news"
      searchParams={searchParams}
    />
  );
}
