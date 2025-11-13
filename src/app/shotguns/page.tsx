import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { PrimerBlock } from "@/components/shotguns/PrimerBlock";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { getShotgunsSectionData } from "@/lib/shotguns-data";

export default async function ShotgunsLandingPage() {
  const { landing, grades } = await getShotgunsSectionData();

  return (
    <div className="space-y-16">
      <LandingHero hero={landing.hero} />
      <PlatformGrid platforms={landing.platforms} />
      <TriggerExplainer explainer={landing.triggerExplainer} />
      <a className="skip-link" href="#discipline-rail-heading">
        Skip to disciplines
      </a>
      <DisciplineRail
        disciplines={landing.disciplines}
        platforms={landing.platforms}
      />
      <PrimerBlock
        copy={landing.gaugesTeaser.copy}
        href={landing.gaugesTeaser.href}
        bullets={landing.gaugesTeaser.bullets}
      />
      <EngravingGradesCarousel grades={grades} />
      <CTASection
        text="Begin your fitting with the Botticino atelier—matching balance, trigger feel, and engraving to your rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
