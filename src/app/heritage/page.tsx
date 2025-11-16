import { HeritageHero } from "@/components/heritage/HeritageHero";
import { BrandTimeline } from "@/components/heritage/BrandTimeline";
import { ChampionsGallery } from "@/components/heritage/ChampionsGallery";
import { FactoryPhotoEssay } from "@/components/heritage/FactoryPhotoEssay";
import { SerialLookup, type SerialLookupFormState } from "@/components/heritage/SerialLookup";
import { OralHistories } from "@/components/heritage/OralHistories";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { getHeritagePageData } from "@/lib/heritage-data";
import { getManufactureYearBySerial } from "@/sanity/queries/manufactureYear";

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
  } catch (error) {
    console.error("[serial-lookup-action]", error);
    return {
      status: "error",
      message: "Unable to look up that serial right now.",
    };
  }
}

export default async function HeritagePage() {
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

  return (
    <div className="space-y-16">
      <HeritageHero
        hero={hero}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Heritage", href: "/heritage" },
        ]}
      />
      <BrandTimeline events={timeline} skipTargetId="heritage-after-timeline" />
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
