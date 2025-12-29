import type { ReactElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeritageHero } from "@/components/heritage/HeritageHero";
import { ChampionsGallery } from "@/components/heritage/ChampionsGallery";
import { FactoryPhotoEssay } from "@/components/heritage/FactoryPhotoEssay";
import { SerialLookup, type SerialLookupFormState } from "@/components/heritage/SerialLookup";
import { OralHistories } from "@/components/heritage/OralHistories";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getHeritagePageData } from "@/lib/heritage-data";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import { getManufactureYearBySerial } from "@/sanity/queries/manufactureYear";
import { PerazziHeritageEras } from "@/components/heritage/PerazziHeritageEras";
import { groupEventsByEra } from "@/utils/heritage/groupEventsByEra";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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
      <section
        id="perazzi-heritage"
        className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-14 pb-16 sm:pb-20 -mb-16 sm:-mb-16 min-h-[80vh] full-bleed"
      >
        <div
          className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/50 to-canvas"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 text-white lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1 space-y-4">
            <Text size="xs" className="font-semibold tracking-[0.35em] text-white/70" leading="normal">
              {heritageIntroEyebrow}
            </Text>
            <Heading
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-white"
            >
              {heritageIntroHeading}
            </Heading>
            {heritageIntroParagraphs.map((paragraph) => (
              <Text key={paragraph} className="text-white/80">
                {paragraph}
              </Text>
            ))}
            <div className="hidden lg:flex lg:pt-2">
              <Link
                href="#heritage-serial-lookup"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-6 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                Skip Perazzi Timeline
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/20 shadow-elevated">
              <Image
                src={heritageIntroBackgroundSrc}
                alt={heritageIntroBackgroundAlt}
                width={1600}
                height={900}
                className="h-auto w-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <div className="mt-6 flex justify-center lg:hidden">
              <Link
                href="#heritage-serial-lookup"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-6 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                Skip Perazzi Timeline
              </Link>
            </div>
          </div>
        </div>
        <ScrollIndicator className="bottom-24 sm:bottom-28 z-30 pointer-events-none hidden sm:flex" />
      </section>
      <PerazziHeritageEras eras={eraGroups} />
      <section
        className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-black py-10 sm:py-16 -mt-16 -mb-16 full-bleed"
        aria-labelledby="heritage-workshop-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <Heading
              id="heritage-workshop-heading"
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-white"
            >
              {workshopHeading}
            </Heading>
            <Text className="mb-8 font-light italic text-gray-300">
              {workshopIntro}
            </Text>
            <div className="flex flex-wrap justify-start gap-3">
              <Link
                href={workshopPrimaryHref}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white hover:border-white hover:text-white focus-ring"
              >
                <span aria-hidden="true" className="text-lg leading-none">^</span>
                {workshopPrimaryLabel}
              </Link>
              <Link
                href={workshopSecondaryHref}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                <span aria-hidden="true" className="text-lg leading-none">v</span>
                {workshopSecondaryLabel}
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-gray-300">
            <Text className="font-semibold not-italic text-white" leading="normal">
              What the atelier can surface:
            </Text>
            <ul className="space-y-2">
              {workshopBullets.map((bullet) => {
                const [label, ...rest] = bullet.split(" - ");
                return (
                  <li key={bullet}>
                    <span className="text-base sm:text-lg font-black not-italic text-white">{label}</span>
                    {" "}-{" "}
                    {rest.join(" - ")}
                  </li>
                );
              })}
            </ul>
            <Text className="font-light italic text-gray-300">
              {workshopClosing}
            </Text>
          </div>
        </div>
      </section>
      <SerialLookup lookupAction={serialLookupAction} ui={serialLookupUi} />
      <section
        id="heritage-champions"
        tabIndex={-1}
        className="space-y-16 focus:outline-none"
        aria-labelledby="heritage-champions-heading-wrapper"
      >
        <div id="heritage-champions-heading-wrapper" className="sr-only">
          Heritage champions section
        </div>
        <section
          className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-black py-10 sm:py-16 -mt-16 sm:-mt-16 -mb-16 sm:-mb-16 min-h-[70vh] full-bleed"
          aria-labelledby="heritage-champions-intro-heading"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10 min-h-[50vh]">
            <div className="space-y-4">
              <Heading
                id="heritage-champions-intro-heading"
                level={2}
                size="xl"
                className="font-black uppercase italic tracking-[0.35em] text-white"
              >
                {championsIntroHeading}
              </Heading>
              <Text className="mb-8 font-light italic text-gray-300">
                {championsIntroText}
              </Text>
              <ChatTriggerButton
                label={championsChatLabel}
                payload={{
                  question: championsChatPrompt,
                  context: { pageUrl: "/heritage", mode: "heritage" },
                }}
                variant="outline"
                className="border-white/60 text-white hover:border-white hover:text-white"
              />
            </div>

            <div className="space-y-3 text-sm sm:text-base font-light italic text-gray-300">
            <Text className="font-semibold not-italic text-white" leading="normal">
              What you&apos;ll see below:
            </Text>
            <ul className="space-y-2">
              {championsIntroBullets.map((bullet) => {
                const [label, ...rest] = bullet.split(" - ");
                return (
                  <li key={bullet}>
                    <span className="text-base sm:text-lg font-black not-italic text-white">{label}</span>
                    {" "}-{" "}
                    {rest.join(" - ")}
                  </li>
                );
              })}
            </ul>
            <Text className="font-light italic text-gray-300">
              {championsIntroClosing}
            </Text>
          </div>
        </div>
      </section>
        <ChampionsGallery champions={champions} ui={championsGalleryUi} />
        <section
          className="relative isolate z-0 w-screen max-w-[100vw] overflow-hidden py-10 sm:py-16 -mt-16 sm:-mt-16 -mb-16 sm:-mb-16 min-h-[60vh] full-bleed"
          aria-labelledby="heritage-factory-intro-heading"
        >
          <div
            className="absolute inset-0 -z-10 bg-heritage-fade"
            aria-hidden="true"
          />
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10 min-h-[50vh]">
            <div className="space-y-4">
              <Heading
                id="heritage-factory-intro-heading"
                level={2}
                size="xl"
                className="font-black uppercase italic tracking-[0.35em] text-white"
              >
                {factoryHeading}
              </Heading>
              <Text className="mb-8 font-light italic text-gray-300">
                {factoryIntro}
              </Text>
              <ChatTriggerButton
                label={factoryChatLabel}
                payload={{
                  question: factoryChatPrompt,
                  context: { pageUrl: "/heritage", mode: "heritage" },
                }}
                variant="outline"
                className="border-white/60 text-white hover:border-white hover:text-white"
              />
            </div>

            <div className="space-y-3 text-sm sm:text-base font-light italic text-gray-300">
            <Text className="font-semibold not-italic text-white" leading="normal">
              What you&apos;ll see below:
            </Text>
            <ul className="space-y-2">
              {factoryBullets.map((bullet) => {
                const [label, ...rest] = bullet.split(" - ");
                return (
                  <li key={bullet}>
                    <span className="text-base sm:text-lg font-black not-italic text-white">{label}</span>
                    {" "}-{" "}
                    {rest.join(" - ")}
                  </li>
                );
              })}
            </ul>
            <Text className="font-light italic text-gray-300">
              {factoryClosing}
            </Text>
          </div>
        </div>
      </section>
        <div className="relative z-10">
          <FactoryPhotoEssay items={factoryEssay} introHtml={factoryIntroBody} ui={factoryEssayUi} />
        </div>
        {oralHistories && oralHistories.length > 0 ? (
          <OralHistories histories={oralHistories} ui={oralHistoriesUi} />
        ) : null}
        <RelatedList heading={relatedSection.heading} items={relatedSection.items} />
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
