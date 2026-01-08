import {
  gradesHero,
  engravingProvenanceHtml,
  gradesProcessNote,
} from "@/content/shotguns/grades-content";
import { GradesHero } from "@/components/shotguns/GradesHero";
import { EngravingGallery } from "@/components/shotguns/EngravingGallery";
import { WoodCarousel } from "@/components/shotguns/WoodCarousel";
import { ProvenanceNote } from "@/components/shotguns/ProvenanceNote";
import { OptionsGrid } from "@/components/shotguns/OptionsGrid";
import { ProcessNote } from "@/components/shotguns/ProcessNote";
import { CTASection } from "@/components/shotguns/CTASection";
import { getGradeAnchorId } from "@/lib/grade-anchors";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getShotgunsGradesPage } from "@/sanity/queries/shotguns";

export default async function GradesPage() {
  const [sectionData, cms] = await Promise.all([
    getShotgunsSectionData(),
    getShotgunsGradesPage(),
  ]);
  const { grades } = sectionData;
  const hero = cms?.hero?.background
    ? {
        title: cms.hero.title ?? gradesHero.title,
        subheading: cms.hero.subheading ?? gradesHero.subheading,
        background: cms.hero.background,
      }
    : gradesHero;
  const provenanceHtml = cms?.provenanceHtml ?? engravingProvenanceHtml;
  const processNote = cms?.processNote?.title || cms?.processNote?.html
    ? {
        title: cms?.processNote?.title ?? gradesProcessNote.title,
        html: cms?.processNote?.html ?? gradesProcessNote.html,
      }
    : gradesProcessNote;
  const fallbackCta = {
    text: "Begin your fitting to commission engraving, wood selection, and finishing details that reflect your legacy.",
    primary: { label: "Begin Your Fitting", href: "/experience/fitting" },
    secondary: { label: "Request a Visit", href: "/experience/visit" },
  };
  const cmsCta = cms?.finalCta;
  const useCmsCta = Boolean(cmsCta?.text && cmsCta.primary?.label && cmsCta.primary?.href);
  const finalCta = useCmsCta
    ? {
        text: cmsCta?.text ?? fallbackCta.text,
        primary: {
          label: cmsCta?.primary?.label ?? fallbackCta.primary.label,
          href: cmsCta?.primary?.href ?? fallbackCta.primary.href,
        },
        secondary: cmsCta?.secondary?.label && cmsCta?.secondary?.href
          ? {
              label: cmsCta.secondary.label,
              href: cmsCta.secondary.href,
            }
          : fallbackCta.secondary,
      }
    : fallbackCta;

  return (
    <div className="space-y-16">
      <GradesHero
        hero={hero}
      />

      <ProvenanceNote html={provenanceHtml} />

      {grades.map((grade) => (
        <section
          key={grade.id}
          id={getGradeAnchorId(grade)}
          className="space-y-10 scroll-mt-24"
        >
          <header className="space-y-2">
            <Heading level={2} size="lg" className="text-ink">
              {grade.name}
            </Heading>
            <Text className="max-w-3xl text-ink-muted" leading="normal">
              {grade.description}
            </Text>
          </header>
          <EngravingGallery gallery={grade.gallery} title={`${grade.name} gallery`} />
          <ProvenanceNote html={grade.provenanceHtml} />
          <OptionsGrid options={grade.options} />
        </section>
      ))}

      <WoodCarousel grades={grades} />
      <ProcessNote
        title={processNote.title}
        html={processNote.html}
        dataAnalyticsId="GradesProcessNote"
      />
      <CTASection
        text={finalCta.text}
        primary={finalCta.primary}
        secondary={finalCta.secondary}
        dataAnalyticsId="GradesFinalCTA"
        analyticsPrefix="GradesCTA"
      />
    </div>
  );
}
