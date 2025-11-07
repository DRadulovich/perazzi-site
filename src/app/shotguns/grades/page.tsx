import { shotgunsData } from "@/content/shotguns";
import { GradesHero } from "@/components/shotguns/GradesHero";
import { EngravingGallery } from "@/components/shotguns/EngravingGallery";
import { WoodCarousel } from "@/components/shotguns/WoodCarousel";
import { ProvenanceNote } from "@/components/shotguns/ProvenanceNote";
import { OptionsGrid } from "@/components/shotguns/OptionsGrid";
import { FAQList } from "@/components/shotguns/FAQList";
import { CTASection } from "@/components/shotguns/CTASection";

export default function GradesPage() {
  const { grades } = shotgunsData;
  const primaryGrade = grades[0];
  const heroBackground = primaryGrade.gallery[0] ?? {
    id: "grades-fallback",
    kind: "image" as const,
    url: "https://res.cloudinary.com/pwebsite/image/upload/v1720400000/shotguns/grades/sc2_lockplate.jpg",
    alt: "Perazzi engraving detail",
    aspectRatio: 16 / 9,
  };

  const faqItems = grades.flatMap((grade) =>
    (grade.options ?? []).map((option) => ({
      q: `${grade.name}: ${option.title}`,
      a: option.description,
    })),
  );
  const engravingProvenanceHtml =
    "<p>Perazzi offers classic house patterns rooted in Italian tradition and collaborates with master engravers for singular commissions. Each surface is a canvas for restraint or flourish—guided by the same reverence for artistry and permanence.</p>";

  return (
    <div className="space-y-16">
      <GradesHero
        hero={{
          title: "Engraving grades & bespoke provenance",
          subheading: "From SC2 heritage scroll through SCO masterpieces, commissions evolve with your story.",
          background: heroBackground,
        }}
      />

      <ProvenanceNote html={engravingProvenanceHtml} />

      {grades.map((grade) => (
        <section key={grade.id} className="space-y-10">
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
      <FAQList
        items={faqItems}
        schemaName="Perazzi grade options FAQ"
        scriptId="shotguns-grades-faq"
      />
      <CTASection
        text="Begin your fitting to commission engraving, wood selection, and finishing details that reflect your legacy."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
