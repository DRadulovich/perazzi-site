import { shotgunsData } from "@/content/shotguns";
import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { PrimerBlock } from "@/components/shotguns/PrimerBlock";
import { TeaserBlock } from "@/components/shotguns/TeaserBlock";
import { CTASection } from "@/components/shotguns/CTASection";

export default function ShotgunsLandingPage() {
  const { landing } = shotgunsData;

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
      <TeaserBlock
        copy={landing.gradesTeaser.copy}
        href={landing.gradesTeaser.href}
        engravingTile={landing.gradesTeaser.engravingTile}
        woodTile={landing.gradesTeaser.woodTile}
      />
      <CTASection
        text="Begin your fitting with the Botticino atelier—matching balance, trigger feel, and engraving to your rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
