import { CategoryPageLayout } from "@/components/journal/CategoryPageLayout";
import { getJournalCategoryData } from "@/lib/journal-data";
import { Text } from "@/components/ui/text";

type ChampionInterviewsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ChampionInterviewsPage({
  searchParams,
}: ChampionInterviewsPageProps) {
  const data = await getJournalCategoryData("interviews");
  if (!data) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-10 text-center text-ink shadow-sm sm:px-10">
        <Text size="lg" className="font-semibold" leading="normal">
          Interview features are coming soon.
        </Text>
      </section>
    );
  }

  return (
    <CategoryPageLayout
      data={data}
      categoryKey="interviews"
      basePath="/journal/champion-interviews"
      searchParams={searchParams}
    />
  );
}
