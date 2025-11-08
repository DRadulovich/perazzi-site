import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";
import { getJournalCategoryData } from "@/lib/journal-data";

type StoriesOfCraftPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StoriesOfCraftPage({
  searchParams,
}: StoriesOfCraftPageProps) {
  const data = await getJournalCategoryData("craft");
  if (!data) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-center text-ink shadow-sm sm:px-10">
        <p className="text-lg font-semibold">Craft stories are coming soon.</p>
      </section>
    );
  }

  return (
    <CategoryPageLayout
      data={data}
      categoryKey="craft"
      basePath="/journal/stories-of-craft"
      searchParams={searchParams}
    />
  );
}
