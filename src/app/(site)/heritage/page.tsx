import type { ReactElement } from "react";
import { HeritageHero } from "@/components/heritage/HeritageHero";
import { HeritageIntroSection } from "@/components/heritage/HeritageIntroSection";
import { HeritageSplitSection } from "@/components/heritage/HeritageSplitSection";
import { ChampionsGallery } from "@/components/heritage/ChampionsGallery";
import { FactoryPhotoEssay } from "@/components/heritage/FactoryPhotoEssay";
import { SerialLookup, type SerialLookupFormState } from "@/components/heritage/SerialLookup";
import { OralHistories } from "@/components/heritage/OralHistories";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getHeritagePageData } from "@/lib/heritage-data";
import { getManufactureYearBySerial } from "@/sanity/queries/manufactureYear";
import { PerazziHeritageEras } from "@/components/heritage/PerazziHeritageEras";
import { groupEventsByEra } from "@/utils/heritage/groupEventsByEra";

async function serialLookupAction(
  _: SerialLookupFormState,
  formData: FormData,
): Promise<SerialLookupFormState> {
  "use server";

  const serialInput = formData.get("serial");
  const cleanedSerial =
    typeof serialInput === "string" ? serialInput.replaceAll(/\D/g, "") : "";

  if (!cleanedSerial) {
    return { status: "error", message: "Enter a serial number." };
  }

  const serialNumber = Number(cleanedSerial);
  if (!Number.isFinite(serialNumber) || serialNumber <= 0) {
    return { status: "error", message: "Enter a valid serial number." };
  }

  try {
    const match = await getManufactureYearBySerial(serialNumber);
    if (!match) {
      return { status: "error", message: "Serial number not found." };
    }

    return {
      status: "success",
      data: {
        serial: serialNumber,
        year: match.year,
        proofCode: match.proofCode?.trim() || "-",
        matchType: match.matchType,
        model: match.model ?? null,
        range: {
          start: match.range.start,
          end: typeof match.range.end === "number" ? match.range.end : undefined,
        },
      },
    };
  } catch (error: unknown) {
    console.error("[serial-lookup-action]", error);
    return {
      status: "error",
      message: "Unable to look up that serial right now.",
    };
  }
}

export default async function HeritagePage(): Promise<ReactElement> {
  const {
    hero,
    timeline,
    champions,
    heritageIntro,
    erasConfig,
    workshopCta,
    serialLookupUi,
    championsIntro,
    championsGalleryUi,
    factoryIntroBlock,
    factoryEssayUi,
    factoryIntroBody,
    factoryEssay,
    oralHistories,
    oralHistoriesUi,
    relatedSection,
    finalCta,
  } = await getHeritagePageData();
  const eraGroups = groupEventsByEra(timeline, erasConfig);

  const heritageIntroBackgroundSrc =
    heritageIntro.backgroundImage?.url ?? "/redesign-photos/heritage/perazzi-legacy-lives-on.jpg";
  const heritageIntroBackgroundAlt =
    heritageIntro.backgroundImage?.alt ?? "Perazzi artisans and heritage imagery";
  const heritageIntroHeading = heritageIntro.heading ?? "A living lineage of craft";
  const heritageIntroEyebrow = heritageIntro.eyebrow ?? "Perazzi heritage";
  const heritageIntroParagraphs =
    heritageIntro.paragraphs?.length
      ? heritageIntro.paragraphs
      : [
          "Every Perazzi era begins with a handful of engineers, engravers, and fitters gathered around the bench. As disciplines evolve - from Olympic trap to modern sporting - our makers redraw receivers, stocks, and lockwork to meet the next generation of champions.",
          "Use the eras below to trace the silhouettes, medals, and workshop milestones that shaped today's guns. Each chapter links back to Botticino, where the same hands still test, measure, and sign every build that leaves the atelier.",
        ];

  const workshopHeading = workshopCta.heading ?? "Ask the workshop";
  const workshopIntro =
    workshopCta.intro ??
    "Trace provenance, decode proof marks, or understand where your gun sits in Perazzi lineage before you dive into the archives.";
  const workshopBullets = workshopCta.bullets?.length
    ? workshopCta.bullets
    : [
        "Serial lineage - match your serial to proof codes, production year, and model family.",
        "Proof marks & provenance - interpret stamps, engravings, and ownership clues for collectors.",
        "Era context - connect your shotgun's year to champions, medals, and the right heritage stories.",
      ];
  const workshopClosing =
    workshopCta.closing ??
    "Share your serial, photos, and any history you know; we'll pull from the archives and point you to the best next pages to explore.";
  const workshopPrimaryLabel = workshopCta.primaryLabel ?? "Immerse in the Perazzi Timeline";
  const workshopPrimaryHref = workshopCta.primaryHref ?? "#perazzi-heritage";
  const workshopSecondaryLabel = workshopCta.secondaryLabel ?? "Check serial record";
  const workshopSecondaryHref = workshopCta.secondaryHref ?? "#heritage-serial-lookup";

  const championsIntroHeading = championsIntro.heading ?? "Champions past and present";
  const championsIntroText =
    championsIntro.intro ??
    "From Olympic podiums to modern sporting clays, Perazzi champions carry the same lineage you see in the gallery below - engraved receivers, bespoke stocks, and quiet routines that still shape the workshop today.";
  const championsIntroBullets = championsIntro.bullets?.length
    ? championsIntro.bullets
    : [
        "Generations on the line - medalists and contemporaries linked by the same Botticino craft.",
        "Discipline stories - trap, skeet, and sporting specialists whose routines feed our fittings.",
        "Design fingerprints - stock lines, rib profiles, and engraving styles that connect eras.",
      ];
  const championsIntroClosing =
    championsIntro.closing ??
    "Browse the champions, then step into the timeline or serial lookup to place your own gun in their company.";
  const championsChatLabel = championsIntro.chatLabel ?? "Ask about Perazzi champions";
  const championsChatPrompt =
    championsIntro.chatPrompt ??
    "Tell the history of Perazzi's most famous champions - from Olympic legends to modern sporting icons - and how their routines and feedback shaped the guns in the gallery.";

  const factoryHeading = factoryIntroBlock.heading ?? "Inside the Botticino atelier";
  const factoryIntro =
    factoryIntroBlock.intro ??
    "The Factory Essay below walks through the benches where blanks become stocks, receivers are hand-fit, and engravers finish the metal that champions and collectors carry.";
  const factoryBullets = factoryIntroBlock.bullets?.length
    ? factoryIntroBlock.bullets
    : [
        "Stock and fitting benches - selecting blanks, shaping try-guns, and measuring for bespoke builds.",
        "Receivers and lockwork - machining, hand-fitting, and proofing the heart of each gun.",
        "Engraving and finish - scrollwork, checkering, and oil finishes that tie heritage to the present.",
      ];
  const factoryClosing =
    factoryIntroBlock.closing ??
    "Scroll the essay to trace how Botticino craft shapes every Perazzi before it reaches a champion or collector.";
  const factoryChatLabel = factoryIntroBlock.chatLabel ?? "Ask about the workshop";
  const factoryChatPrompt =
    factoryIntroBlock.chatPrompt ??
    "Guide me through the Botticino factory steps: selecting and seasoning wood, machining and fitting receivers, hand-finishing, engraving, proofing, and how those processes shaped notable Perazzi builds.";

  return (
    <main className="space-y-16 sm:space-y-20">
      <HeritageHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Heritage", href: "/heritage" },
        ]}
      />
      <HeritageIntroSection
        eyebrow={heritageIntroEyebrow}
        heading={heritageIntroHeading}
        paragraphs={heritageIntroParagraphs}
        imageSrc={heritageIntroBackgroundSrc}
        imageAlt={heritageIntroBackgroundAlt}
      />
      <PerazziHeritageEras
        eras={eraGroups}
        sectionId="timeline"
        className="scroll-mt-24"
      />
      <HeritageSplitSection
        className="bg-black -mt-16 -mb-16"
        headingId="heritage-workshop-heading"
        heading={workshopHeading}
        intro={workshopIntro}
        links={[
          {
            href: workshopPrimaryHref,
            label: workshopPrimaryLabel,
            icon: "↑",
            className: "border-white/60 text-white hover:border-white hover:text-white",
          },
          {
            href: workshopSecondaryHref,
            label: workshopSecondaryLabel,
            icon: "↓",
            className: "border-perazzi-red/70 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red",
          },
        ]}
        rightTitle="What the atelier can surface:"
        bullets={workshopBullets}
        closing={workshopClosing}
      />
      <SerialLookup lookupAction={serialLookupAction} ui={serialLookupUi} />
      <section
        id="heritage-champions"
        tabIndex={-1}
        className="space-y-16 focus:outline-none scroll-mt-24"
        aria-labelledby="heritage-champions-heading-wrapper"
      >
        <div id="heritage-champions-heading-wrapper" className="sr-only">
          Heritage champions section
        </div>
        <HeritageSplitSection
          sectionId="champions"
          className="bg-black -mt-16 sm:-mt-16 -mb-16 sm:-mb-16 min-h-[70vh] scroll-mt-24"
          contentClassName="min-h-[50vh]"
          headingId="heritage-champions-intro-heading"
          heading={championsIntroHeading}
          intro={championsIntroText}
          chatAction={{
            label: championsChatLabel,
            payload: {
              question: championsChatPrompt,
              context: { pageUrl: "/heritage", mode: "heritage" },
            },
            variant: "outline",
            className: "border-white/60 text-white hover:border-white hover:text-white",
          }}
          rightTitle="What you\u2019ll see below:"
          bullets={championsIntroBullets}
          closing={championsIntroClosing}
        />
        <ChampionsGallery champions={champions} ui={championsGalleryUi} />
        <HeritageSplitSection
          className="relative isolate z-0 -mt-16 sm:-mt-16 -mb-16 sm:-mb-16 min-h-[60vh]"
          contentClassName="min-h-[50vh]"
          backgroundLayerClassName="bg-heritage-fade"
          headingId="heritage-factory-intro-heading"
          heading={factoryHeading}
          intro={factoryIntro}
          chatAction={{
            label: factoryChatLabel,
            payload: {
              question: factoryChatPrompt,
              context: { pageUrl: "/heritage", mode: "heritage" },
            },
            variant: "outline",
            className: "border-white/60 text-white hover:border-white hover:text-white",
          }}
          rightTitle="What you\u2019ll see below:"
          bullets={factoryBullets}
          closing={factoryClosing}
        />
        <div className="relative z-10">
          <FactoryPhotoEssay items={factoryEssay} introHtml={factoryIntroBody} ui={factoryEssayUi} />
        </div>
        {oralHistories && oralHistories.length > 0 ? (
          <OralHistories histories={oralHistories} ui={oralHistoriesUi} />
        ) : null}
        <div id="heritage-after-timeline" className="scroll-mt-24">
          <RelatedList heading={relatedSection.heading} items={relatedSection.items} />
        </div>
      </section>
      <CTASection
        dataAnalyticsId="FinalCTASeen"
        analyticsPrefix="FinalCTAClicked"
        text={finalCta.text}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
      />
    </main>
  );
}
