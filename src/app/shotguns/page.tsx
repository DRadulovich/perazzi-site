import Image from "next/image";
import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { PrimerBlock } from "@/components/shotguns/PrimerBlock";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

export default async function ShotgunsLandingPage() {
  const { landing, grades } = await getShotgunsSectionData();

  return (
    <div className="space-y-16">
      <LandingHero hero={landing.hero} />
      <PlatformGrid platforms={landing.platforms} />
      <section
        className="relative w-screen overflow-hidden py-32 sm:py-40"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/cinematic_background_photos/p-web-2.jpg"
            alt="Perazzi shotgun captured in cinematic lighting"
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-[color:var(--scrim-soft)]" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in srgb, var(--color-canvas) 24%, transparent) 0%, color-mix(in srgb, var(--color-canvas) 6%, transparent) 50%, color-mix(in srgb, var(--color-canvas) 24%, transparent) 100%), " +
                "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 25%), " +
                "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 25%)",
            }}
            aria-hidden
          />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
          <div className="rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/40 p-6 text-ink shadow-elevated backdrop-blur-sm sm:p-8 lg:p-10">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                Discipline fit
              </p>
              <p className="text-base text-ink">
                Not sure why specific platforms or models suit each discipline differently? Ask how geometry changes shooting rhythm for Trap, Skeet, and Sporting clays.
              </p>
            </div>
            <div className="mt-6">
              <ChatTriggerButton
                label="Ask Perazzi"
                payload={{
                  question:
                    "Why do clay disciplines demand niche characteristics in Perazzi platforms or models, and how do those engineering choices benefit a shooter’s timing and consistency?",
                  context: { pageUrl: "/shotguns" },
                }}
              />
            </div>
          </div>
        </div>
      </section>
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
      <TriggerExplainer explainer={landing.triggerExplainer} />
      <CinematicImageStrip
        src="/cinematic_background_photos/p-web-27.jpg"
        alt="Perazzi craftsmanship rendered in cinematic lighting"
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
