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
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getHeritagePageData } from "@/lib/heritage-data";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import { getManufactureYearBySerial } from "@/sanity/queries/manufactureYear";
import { PerazziHeritageEras } from "@/components/heritage/PerazziHeritageEras";
import { groupEventsByEra } from "@/utils/heritage/groupEventsByEra";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

async function serialLookupAction(
  _: SerialLookupFormState,
  formData: FormData,
): Promise<SerialLookupFormState> {
  "use server";

  const serialInput = formData.get("serial");
  const cleanedSerial =
    typeof serialInput === "string" ? serialInput.replace(/[^0-9]/g, "") : "";

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
    factoryIntroHtml,
    factoryEssay,
    oralHistories,
    related,
    finalCta,
  } = await getHeritagePageData();
  const eraGroups = groupEventsByEra(timeline);

  return (
    <div className="space-y-16">
      <HeritageHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Heritage", href: "/heritage" },
        ]}
      />
      <section
        id="perazzi-heritage"
        className="relative isolate w-screen max-w-[100vw] overflow-hidden py-10 sm:py-14 pb-16 sm:pb-20 -mb-16 sm:-mb-16 min-h-[80vh]"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
      >
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/50 to-canvas"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 text-white lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1 space-y-4">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Perazzi heritage
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em]">
              A living lineage of craft
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-white/80">
              Every Perazzi era begins with a handful of engineers, engravers, and fitters gathered around the bench. As disciplines evolve - from Olympic trap to modern sporting - our makers redraw receivers, stocks, and lockwork to meet the next generation of champions.
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-white/80">
              Use the eras below to trace the silhouettes, medals, and workshop milestones that shaped today's guns. Each chapter links back to Botticino, where the same hands still test, measure, and sign every build that leaves the atelier.
            </p>
            <div className="hidden lg:flex lg:pt-2">
              <Link
                href="#heritage-serial-lookup"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-6 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                Skip Perazzi Timeline
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/20 shadow-lg">
              <img
                src="/redesign-photos/heritage/perazzi-legacy-lives-on.jpg"
                alt="Perazzi artisans and heritage imagery"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <div className="mt-6 flex justify-center lg:hidden">
              <Link
                href="#heritage-serial-lookup"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-6 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
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
        className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-black py-10 sm:py-16 -mt-16 -mb-16"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="heritage-workshop-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p
              id="heritage-workshop-heading"
              className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em]"
            >
              Ask the workshop
            </p>
            <p className="mb-8 text-sm sm:text-base font-light italic text-gray-300 leading-relaxed">
              Trace provenance, decode proof marks, or understand where your gun sits in Perazzi lineage before you dive into the archives.
            </p>
            <div className="flex flex-wrap justify-start gap-3">
              <Link
                href="#perazzi-heritage"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white hover:border-white hover:text-white focus-ring"
              >
                <span aria-hidden="true" className="text-lg leading-none">^</span>
                Immerse in the Perazzi Timeline
              </Link>
              <Link
                href="#heritage-serial-lookup"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                <span aria-hidden="true" className="text-lg leading-none">v</span>
                Check serial record
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm sm:text-base font-light italic text-gray-300">
            <p className="text-sm sm:text-base font-semibold not-italic text-white">
              What the atelier can surface:
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-white">Serial lineage</span>
                {" "}-{" "}
                match your serial to proof codes, production year, and model family.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-white">Proof marks & provenance</span>
                {" "}-{" "}
                interpret stamps, engravings, and ownership clues for collectors.
              </li>
              <li>
                <span className="text-base sm:text-lg font-black not-italic text-white">Era context</span>
                {" "}-{" "}
                connect your shotgun's year to champions, medals, and the right heritage stories.
              </li>
            </ul>
            <p className="text-sm sm:text-base font-light italic text-gray-300 leading-relaxed">
              Share your serial, photos, and any history you know; we'll pull from the archives and point you to the best next pages to explore.
            </p>
          </div>
        </div>
      </section>
      <SerialLookup lookupAction={serialLookupAction} />
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
          className="relative isolate w-screen max-w-[100vw] overflow-hidden bg-black py-10 sm:py-16 -mt-16 sm:-mt-16 -mb-16 sm:-mb-16 min-h-[70vh]"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
          aria-labelledby="heritage-champions-intro-heading"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 text-white lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10 min-h-[50vh]">
            <div className="space-y-4">
              <p
                id="heritage-champions-intro-heading"
                className="text-2xl sm:text-3xl font-black uppercase italic tracking-[0.35em]"
              >
                Champions past and present
              </p>
              <p className="mb-8 text-sm sm:text-base font-light italic text-gray-300 leading-relaxed">
                From Olympic podiums to modern sporting clays, Perazzi champions carry the same lineage you see in the gallery below - engraved receivers, bespoke stocks, and quiet routines that still shape the workshop today.
              </p>
              <ChatTriggerButton
                label="Ask about Perazzi champions"
                payload={{
                  question:
                  "Tell the history of Perazzi's most famous champions - from Olympic legends to modern sporting icons - and how their routines and feedback shaped the guns in the gallery.",
                  context: { pageUrl: "/heritage", mode: "heritage" },
                }}
                variant="outline"
                className="border-white/60 text-white hover:border-white hover:text-white"
              />
            </div>

            <div className="space-y-3 text-sm sm:text-base font-light italic text-gray-300">
              <p className="text-sm sm:text-base font-semibold not-italic text-white">
                What you'll see below:
              </p>
              <ul className="space-y-2">
                <li>
                  <span className="text-base sm:text-lg font-black not-italic text-white">Generations on the line</span>
                  {" "}-{" "}
                  medalists and contemporaries linked by the same Botticino craft.
                </li>
                <li>
                  <span className="text-base sm:text-lg font-black not-italic text-white">Discipline stories</span>
                  {" "}-{" "}
                  trap, skeet, and sporting specialists whose routines feed our fittings.
                </li>
                <li>
                  <span className="text-base sm:text-lg font-black not-italic text-white">Design fingerprints</span>
                  {" "}-{" "}
                  stock lines, rib profiles, and engraving styles that connect eras.
                </li>
              </ul>
              <p className="text-sm sm:text-base font-light italic text-gray-300 leading-relaxed">
                Browse the champions, then step into the timeline or serial lookup to place your own gun in their company.
              </p>
            </div>
          </div>
        </section>
        <ChampionsGallery champions={champions} />
        <CinematicImageStrip
          src="/cinematic_background_photos/olympic-medals-1.jpg"
          alt="Perazzi Olympic medals displayed in cinematic lighting"
        />
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
