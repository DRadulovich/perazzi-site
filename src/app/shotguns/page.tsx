import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { PrimerBlock } from "@/components/shotguns/PrimerBlock";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

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
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-5 shadow-sm sm:px-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            Discipline fit
          </p>
          <p className="text-sm text-ink">
            Not sure why specific platforms or models suit each discipline differently? Ask how geometry changes shooting
            rhythm for Trap, Skeet, and Sporting clays.
          </p>
        </div>
        <div className="mt-4">
          <ChatTriggerButton
            label="Ask Perazzi"
            payload={{
              question:
                "Why do clay disciplines demand niche characteristics in Perazzi platforms or models, and how do those engineering choices benefit a shooter’s timing and consistency?",
              context: { pageUrl: "/shotguns" },
            }}
          />
        </div>
      </section>
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
