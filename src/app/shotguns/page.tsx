import Image from "next/image";
import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { CinematicImageStrip } from "@/components/shotguns/CinematicImageStrip";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

export default async function ShotgunsLandingPage() {
  const { landing, grades } = await getShotgunsSectionData();

  return (
    <div className="space-y-5">
      <LandingHero hero={landing.hero} />
      <PlatformGrid platforms={landing.platforms} />
      <section
        className="relative w-screen overflow-hidden py-52 sm:py-64"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
      >
        <div className="absolute inset-0 z-0 py-15 overflow-hidden">
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
                "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%), " +
                "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 0%, transparent 75%)",
            }}
            aria-hidden
          />
        </div>
        <div className="relative z-10 mt-5 mx-auto max-w-5xl px-6 lg:px-10">
          <div className="rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/40 p-6 text-ink shadow-elevated backdrop-blur-sm sm:p-8 lg:p-10">
            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-ink">
                Discipline fit
              </p>
              <p className="text-xl text-base text-ink italic">
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
      <TriggerExplainer explainer={landing.triggerExplainer} />
      <section
        className="relative w-screen overflow-hidden py-16 sm:py-20"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
        aria-labelledby="gauge-primer-heading"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/cinematic_background_photos/p-web-27.jpg"
            alt="Perazzi craftsmanship rendered in cinematic lighting"
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
                "linear-gradient(to bottom, color-mix(in srgb, var(--color-canvas) 100%, transparent) 100%, transparent 75%), " +
                "linear-gradient(to top, color-mix(in srgb, var(--color-canvas) 100%, transparent) 100%, transparent 75%)",
            }}
            aria-hidden
          />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
          <div className="rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/40 p-6 text-ink shadow-elevated backdrop-blur-sm sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <h2 id="gauge-primer-heading" className="text-xl font-semibold text-ink">Gauge Primer</h2>
                <p className="max-w-3xl text-sm text-ink-muted">{landing.gaugesTeaser.copy}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {landing.gaugesTeaser.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <a
                href={landing.gaugesTeaser.href}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red focus-ring"
              >
                Explore gauges
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
      <EngravingGradesCarousel grades={grades} />
      <CTASection
        text="Begin your fitting with the Botticino atelier—matching balance, trigger feel, and engraving to your rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
