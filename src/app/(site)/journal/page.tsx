import { JournalHero } from "@/components/journal/JournalHero";
import { FeaturedStoryCard } from "@/components/journal/FeaturedStoryCard";
import { CategoryHub } from "@/components/journal/CategoryHub";
import { TagChips } from "@/components/journal/TagChips";
import { JournalSearch } from "@/components/journal/JournalSearch";
import { NewsletterSignup } from "@/components/journal/NewsletterSignup";
import { getJournalLandingData } from "@/lib/journal-data";

export default async function JournalLandingPage() {
  const landing = await getJournalLandingData();
  const hero = landing.hero;
  const featured = landing.featured;
  const allItems = Object.values(landing.hubs).flatMap((hub) => hub.items);
  const featuredMeta = featured ? allItems.find((item) => item.slug === featured.slug) : undefined;

  return (
    <div className="space-y-12">
      <JournalHero hero={hero} breadcrumbs={[{ label: "Home", href: "/" }, { label: "Journal", href: "/journal" }]} />
      <JournalSearch />
      {featured && featuredMeta ? (
        <FeaturedStoryCard
          article={featured}
          hero={featuredMeta.hero}
          summary={featuredMeta.excerptHtml}
        />
      ) : null}
      <TagChips tags={landing.tags ?? []} />
      <CategoryHub category="craft" data={landing.hubs.craft} />
      <CategoryHub category="interviews" data={landing.hubs.interviews} />
      <CategoryHub category="news" data={landing.hubs.news} />
      <NewsletterSignup />
    </div>
  );
}
