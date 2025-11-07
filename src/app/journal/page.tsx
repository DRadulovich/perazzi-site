import { journalLanding } from "@/content/journal";
import { JournalHero } from "@/components/journal/JournalHero";
import { FeaturedStoryCard } from "@/components/journal/FeaturedStoryCard";
import { CategoryHub } from "@/components/journal/CategoryHub";
import { TagChips } from "@/components/journal/TagChips";
import { JournalSearch } from "@/components/journal/JournalSearch";
import { NewsletterSignup } from "@/components/journal/NewsletterSignup";

export default function JournalLandingPage() {
  const hero = journalLanding.hero;
  const featured = journalLanding.featured;
  const allItems = Object.values(journalLanding.hubs).flatMap((hub) => hub.items);
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
      <TagChips tags={journalLanding.tags ?? []} />
      <CategoryHub category="craft" data={journalLanding.hubs.craft} />
      <CategoryHub category="interviews" data={journalLanding.hubs.interviews} />
      <CategoryHub category="news" data={journalLanding.hubs.news} />
      <NewsletterSignup />
    </div>
  );
}
