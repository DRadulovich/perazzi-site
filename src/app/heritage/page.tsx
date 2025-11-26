import { HeritageHero } from "@/components/heritage/HeritageHero";
import { BrandTimeline } from "@/components/heritage/BrandTimeline";
import { ChampionsGallery } from "@/components/heritage/ChampionsGallery";
import { FactoryPhotoEssay } from "@/components/heritage/FactoryPhotoEssay";
import { SerialLookup, type SerialLookupFormState } from "@/components/heritage/SerialLookup";
import { OralHistories } from "@/components/heritage/OralHistories";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { CTASection } from "@/components/shotguns/CTASection";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getHeritagePageData } from "@/lib/heritage-data";
import { getManufactureYearBySerial } from "@/sanity/queries/manufactureYear";
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
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">Ask the workshop</p>
        <p className="mt-2 text-sm text-ink">
          Want a story from the atelier or guidance on provenance research? Ask the concierge to narrate it for you.
        </p>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask about heritage"
            payload={{
              question:
                "Share an inspiring Perazzi heritage story—highlighting Daniele's workshop and champions—and guide me on how to use provenance resources like the serial lookup to learn more.",
              context: { pageUrl: "/heritage", mode: "heritage" },
            }}
          />
        </div>
      </section>
      <BrandTimeline events={timeline} skipTargetId="heritage-after-timeline" />
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
