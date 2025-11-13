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

export default async function GradesPage() {
  const { grades } = await getShotgunsSectionData();

  return (
    <div className="space-y-16">
      <GradesHero
        hero={gradesHero}
      />

      <ProvenanceNote html={engravingProvenanceHtml} />

      {grades.map((grade) => (
        <section
          key={grade.id}
          id={getGradeAnchorId(grade)}
          className="space-y-10 scroll-mt-24"
        >
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-ink">{grade.name}</h2>
            <p className="max-w-3xl text-sm text-ink-muted">
              {grade.description}
            </p>
          </header>
          <EngravingGallery gallery={grade.gallery} title={`${grade.name} gallery`} />
          <ProvenanceNote html={grade.provenanceHtml} />
          <OptionsGrid options={grade.options} />
        </section>
      ))}

      <WoodCarousel grades={grades} />
      <ProcessNote
        title={gradesProcessNote.title}
        html={gradesProcessNote.html}
        dataAnalyticsId="GradesProcessNote"
      />
      <CTASection
        text="Begin your fitting to commission engraving, wood selection, and finishing details that reflect your legacy."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
        dataAnalyticsId="GradesFinalCTA"
        analyticsPrefix="GradesCTA"
      />
    </div>
  );
}
