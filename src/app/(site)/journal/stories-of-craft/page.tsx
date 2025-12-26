import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";
import { getJournalCategoryData } from "@/lib/journal-data";
import { Text } from "@/components/ui/text";

type StoriesOfCraftPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StoriesOfCraftPage({
  searchParams,
}: StoriesOfCraftPageProps) {
  const data = await getJournalCategoryData("craft");
  if (!data) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-center text-ink shadow-soft sm:px-10">
        <Text size="lg" className="font-semibold" leading="normal">
          Craft stories are coming soon.
        </Text>
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
