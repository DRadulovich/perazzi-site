import { heritageData } from "@/content/heritage";
import { HeritageHero } from "@/components/heritage/HeritageHero";
import { BrandTimeline } from "@/components/heritage/BrandTimeline";
import { ChampionsGallery } from "@/components/heritage/ChampionsGallery";
import { FactoryPhotoEssay } from "@/components/heritage/FactoryPhotoEssay";
import { OralHistories } from "@/components/heritage/OralHistories";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";

export default function HeritagePage() {
  const {
    hero,
    timeline,
    champions,
    factoryIntroHtml,
    factoryEssay,
    oralHistories,
    related,
    finalCta,
  } = heritageData;

  return (
    <div className="space-y-16">
      <HeritageHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Heritage", href: "/heritage" },
        ]}
      />
      <BrandTimeline events={timeline} skipTargetId="heritage-champions" />
      <section
        id="heritage-champions"
        tabIndex={-1}
        className="space-y-16 focus:outline-none"
        aria-labelledby="heritage-champions-heading-wrapper"
      >
        <div id="heritage-champions-heading-wrapper" className="sr-only">
          Heritage champions section
        </div>
        <ChampionsGallery champions={champions} />
        <FactoryPhotoEssay items={factoryEssay} introHtml={factoryIntroHtml} />
        {oralHistories && oralHistories.length > 0 ? (
          <OralHistories histories={oralHistories} />
        ) : null}
        <RelatedList items={related} />
      </section>
      <CTASection
        dataAnalyticsId="FinalCTASeen"
        analyticsPrefix="FinalCTAClicked"
        text={finalCta.text}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
    </div>
  );
}
