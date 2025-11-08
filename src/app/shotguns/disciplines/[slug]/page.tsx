import { notFound } from "next/navigation";
import { DisciplineHero } from "@/components/shotguns/DisciplineHero";
import { OverviewBlock } from "@/components/shotguns/OverviewBlock";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { SetupRecipe } from "@/components/shotguns/SetupRecipe";
import { MarqueeFeature } from "@/components/shotguns/MarqueeFeature";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getShotgunsSectionData } from "@/lib/shotguns-data";

type DisciplinePageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const data = await getShotgunsSectionData();
  return Object.keys(data.disciplines).map((slug) => ({ slug }));
}

export default async function DisciplinePage({ params }: DisciplinePageProps) {
  const data = await getShotgunsSectionData();
  const discipline = data.disciplines[params.slug];
  if (!discipline) {
    notFound();
  }

  const platforms = data.landing.platforms.filter((platform) =>
    discipline.recommendedPlatforms.includes(platform.id),
  );

  return (
    <div className="space-y-16">
      <DisciplineHero
        hero={discipline.hero}
        name={discipline.name}
      />
      <OverviewBlock html={discipline.overviewHtml} />
      <PlatformGrid platforms={platforms} />
      <SetupRecipe
        poiRange={discipline.recipe.poiRange}
        barrelLengths={discipline.recipe.barrelLengths}
        ribNotes={discipline.recipe.ribNotes}
      />
      <MarqueeFeature
        champion={discipline.champion}
        fallbackText="Perazzi champions stay loyal to their discipline. Explore the heritage timeline to see how each platform evolved on the line."
      />
      <RelatedList items={discipline.articles} />
      <CTASection
        text="Schedule a fitting to tailor stock geometry, rib elevation, and ballast for your discipline."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
