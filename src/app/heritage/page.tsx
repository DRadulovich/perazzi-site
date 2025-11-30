import Link from "next/link";
import { HeritageHero } from "@/components/heritage/HeritageHero";
import { ChampionsGallery } from "@/components/heritage/ChampionsGallery";
import { FactoryPhotoEssay } from "@/components/heritage/FactoryPhotoEssay";
import { SerialLookup, type SerialLookupFormState } from "@/components/heritage/SerialLookup";
import { OralHistories } from "@/components/heritage/OralHistories";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
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
        proofCode: match.proofCode?.trim() || "—",
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

export default async function HeritagePage(): Promise<JSX.Element> {
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
                href="#heritage-serial-lookup"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/70 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                Check serial record
                <span aria-hidden="true">-&gt;</span>
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
      <CinematicImageStrip
        src="/cinematic_background_photos/p-web-10.jpg"
        alt="Perazzi heritage imagery in cinematic lighting"
      />
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
