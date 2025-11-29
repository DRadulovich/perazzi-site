import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import Link from "next/link";

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
      <section
        className="border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-16 sm:py-20"
        aria-labelledby="gauge-primer-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <p
              id="gauge-primer-heading"
              className="text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              Gauge selection
            </p>
            <p className="text-lg font-light italic text-ink-muted mb-10">
              Decode how 12, 20, and 28 gauge choices shape recoil feel, swing speed, and payload — and how to pair them with your platform and disciplines.
            </p>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label="Ask about gauges"
                variant="outline"
                payload={{
                  question:
                    "Help me choose between 12, 20, and 28 gauge for my Perazzi: recoil feel, payload options, swing speed, and how gauge pairs with MX vs HT platforms for my disciplines.",
                  context: { pageUrl: "/shotguns" },
                }}
              />
              <Link
                href={landing.gaugesTeaser.href}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red focus-ring"
              >
                Explore gauges
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-xl font-light italic text-ink-muted">
            <p className="text-xl font-semibold text-ink">
              What to compare:
            </p>
            <ul className="space-y-2">
              {landing.gaugesTeaser.bullets.map((item) => (
                <li key={item} className="text-lg">
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-lg font-light italic text-ink-muted">
              We’ll tailor gauge choice to your primary discipline, preferred swing, and how you like a gun to absorb recoil.
            </p>
          </div>
        </div>
      </section>
      <TriggerExplainer explainer={landing.triggerExplainer} />
      <section
        className="border-t border-[color:var(--border-color)] bg-[color:var(--surface-canvas)] py-16 sm:py-20"
        aria-labelledby="trigger-choice-heading"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-10">
          <div className="space-y-4 text-ink">
            <p
              id="trigger-choice-heading"
              className="text-3xl font-black uppercase italic tracking-[0.35em] text-ink"
            >
              Trigger choice
            </p>
            <p className="text-lg font-light italic text-ink-muted mb-10">
              Decide when to choose a fixed trigger group for simplicity, or a detachable set for quick swaps, varied pull weights, and service resilience.
            </p>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label="Choose my trigger"
                variant="outline"
                payload={{
                  question:
                    "Help me decide between a fixed trigger and a removable trigger group on my Perazzi: reliability, service, pull-weight options, and what matters for travel or competition timelines.",
                  context: { pageUrl: "/shotguns", mode: "prospect" },
                }}
              />
              <Link
                href="#trigger-explainer-heading"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-perazzi-red focus-ring"
              >
                See trigger details
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-xl font-light italic text-ink-muted">
            <p className="text-xl font-semibold text-ink">
              What to weigh:
            </p>
            <ul className="space-y-2">
              <li className="text-lg">
                Fixed group – lighter, fewer parts to manage, set-and-forget confidence.
              </li>
              <li className="text-lg">
                Removable group – fast swaps for pull weight or service, keeps you running at events.
              </li>
              <li className="text-lg">
                Support & travel – how you compete, who services your gun, and what spares you carry.
              </li>
            </ul>
            <p className="text-lg font-light italic text-ink-muted">
              We’ll align trigger choice to your platform, discipline rhythm, and how you like your release to feel under pressure.
            </p>
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
