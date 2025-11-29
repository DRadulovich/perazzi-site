import Image from "next/image";
import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";

export default async function ShotgunsLandingPage() {
  const { landing, grades } = await getShotgunsSectionData();

  return (
    <div className="space-y-5">
      <LandingHero hero={landing.hero} />
      <PlatformGrid platforms={landing.platforms} />
      <section
        className="border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-16 sm:py-20"
        aria-labelledby="discipline-fit-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
              Discipline fit
            </p>
            <p
              id="discipline-fit-heading"
              className="text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              The geometry of rhythm
            </p>
            <div className="space-y-4 text-lg font-light italic text-ink-muted mb-6 lg:mb-10">
              <p>
                Most shooters feel it long before they can explain it — why one gun feels effortless on Sporting, but out of step on Trap.
              </p>
              <p>
                Perazzi can translate that feeling into geometry: rib height, stock line, point of impact, and the way a gun wants to move through space. Ask how your primary discipline — or the one you’re growing toward — should shape the way your Perazzi is built.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label="Ask Perazzi"
                variant="outline"
                payload={{
                  question:
                    "Translate my main clay discipline into Perazzi geometry—rib height, stock line, point of impact, and swing speed—for Trap, Skeet, or Sporting/FITASC. Suggest where I should start.",
                  context: { pageUrl: "/shotguns" },
                }}
              />
            </div>
          </div>

          <div className="space-y-3 text-xl font-light italic text-ink-muted">
            <p className="text-xl font-semibold text-ink">
              Three rhythms most clay shooters learn:
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-xl font-black text-ink">Trap</span> – steep, rising targets that reward an assertive, up-through-the-line move. Higher point of impact, more vertical bias, and a stock that lets you stay tall without lifting your head.
              </li>
              <li>
                <span className="text-xl font-black text-ink">Skeet</span> – short, repeatable arcs where timing and pre-mount rhythm matter more than raw speed. Flatter rib, softer point of impact, and geometry that lets the gun glide instead of chase.
              </li>
              <li>
                <span className="text-xl font-black text-ink">Sporting / FITASC</span> – unpredictable windows, long crossers, and targets that live above, below, and beyond your comfort zone. Neutral, balanced geometry that doesn’t fight you as the picture changes — it simply goes where you ask.
              </li>
            </ul>
            <p className="text-lg font-light italic text-ink-muted">
              The concierge can map how you mount, move, and see targets to the discipline that fits you now — and the one you’re preparing for next.
            </p>
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
