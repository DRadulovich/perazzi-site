import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";
import { getJournalCategoryData } from "@/lib/journal-data";

type NewsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function JournalNewsPage({ searchParams }: NewsPageProps) {
  const data = await getJournalCategoryData("news");
  if (!data) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-center text-ink shadow-sm sm:px-10">
        <p className="text-lg font-semibold">News stories are coming soon.</p>
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
