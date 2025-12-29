import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { getShotgunsSectionData } from "@/lib/shotguns-data";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import Link from "next/link";
import { Container, Heading, Section, Text } from "@/components/ui";

export default async function ShotgunsLandingPage() {
  const { landing, grades } = await getShotgunsSectionData();
  const disciplineFit = landing.disciplineFitAdvisory ?? {
    eyebrow: "Discipline fit",
    heading: "The geometry of rhythm",
    paragraphs: [
      "Most shooters feel it long before they can explain it — why one gun feels effortless on Sporting, but out of step on Trap.",
      "Perazzi can translate that feeling into geometry: rib height, stock line, point of impact, and the way a gun wants to move through space. Ask how your primary discipline — or the one you’re growing toward — should shape the way your Perazzi is built.",
    ],
    chatPrompt:
      "Translate my main clay discipline into Perazzi geometry—rib height, stock line, point of impact, and swing speed—for Trap, Skeet, or Sporting/FITASC. Suggest where I should start.",
    bullets: [
      {
        code: "trap",
        label: "Trap",
        description:
          "steep, rising targets that reward an assertive, up-through-the-line move. Higher point of impact, more vertical bias, and a stock that lets you stay tall without lifting your head.",
      },
      {
        code: "skeet",
        label: "Skeet",
        description:
          "short, repeatable arcs where timing and pre-mount rhythm matter more than raw speed. Flatter rib, softer point of impact, and geometry that lets the gun glide instead of chase.",
      },
      {
        code: "sporting",
        label: "Sporting / FITASC",
        description:
          "unpredictable windows, long crossers, and targets that live above, below, and beyond your comfort zone. Neutral, balanced geometry that doesn’t fight you as the picture changes — it simply goes where you ask.",
      },
    ],
  };

  const gaugeAdvisory = landing.gaugeSelectionAdvisory ?? {
    heading: "Gauge selection",
    intro:
      "Decode how 12, 20, and 28 gauge choices shape recoil feel, swing speed, and payload — and how to pair them with your platform and disciplines.",
    chatLabel: "Ask about gauges",
    chatPrompt:
      "Help me choose between 12, 20, and 28 gauge for my Perazzi: recoil feel, payload options, swing speed, and how gauge pairs with MX vs HT platforms for my disciplines.",
    linkLabel: "Explore gauges",
    linkHref: landing.gaugesTeaser.href,
    bullets: landing.gaugesTeaser.bullets,
    closing:
      "We’ll tailor gauge choice to your primary discipline, preferred swing, and how you like a gun to absorb recoil.",
  };

  const triggerChoice = landing.triggerChoiceAdvisory ?? {
    heading: "Trigger choice",
    intro:
      "Decide when to choose a fixed trigger group for simplicity, or a detachable set for quick swaps, varied pull weights, and service resilience.",
    chatLabel: "Choose my trigger",
    chatPrompt:
      "Help me decide between a fixed trigger and a removable trigger group on my Perazzi: reliability, service, pull-weight options, and what matters for travel or competition timelines.",
    linkLabel: "See trigger details",
    linkHref: "#trigger-explainer-heading",
    bullets: [
      "Fixed group – lighter, fewer parts to manage, set-and-forget confidence.",
      "Removable group – fast swaps for pull weight or service, keeps you running at events.",
      "Support & travel – how you compete, who services your gun, and what spares you carry.",
    ],
    closing:
      "We’ll align trigger choice to your platform, discipline rhythm, and how you like your release to feel under pressure.",
  };

  const disciplineParagraphs =
    disciplineFit.paragraphs?.length
      ? disciplineFit.paragraphs
      : [
          "Most shooters feel it long before they can explain it — why one gun feels effortless on Sporting, but out of step on Trap.",
          "Perazzi can translate that feeling into geometry: rib height, stock line, point of impact, and the way a gun wants to move through space. Ask how your primary discipline — or the one you’re growing toward — should shape the way your Perazzi is built.",
        ];

  const disciplineBullets =
    disciplineFit.bullets?.length
      ? disciplineFit.bullets
      : [
          {
            code: "trap",
            label: "Trap",
            description:
              "steep, rising targets that reward an assertive, up-through-the-line move. Higher point of impact, more vertical bias, and a stock that lets you stay tall without lifting your head.",
          },
          {
            code: "skeet",
            label: "Skeet",
            description:
              "short, repeatable arcs where timing and pre-mount rhythm matter more than raw speed. Flatter rib, softer point of impact, and geometry that lets the gun glide instead of chase.",
          },
          {
            code: "sporting",
            label: "Sporting / FITASC",
            description:
              "unpredictable windows, long crossers, and targets that live above, below, and beyond your comfort zone. Neutral, balanced geometry that doesn’t fight you as the picture changes — it simply goes where you ask.",
          },
        ];

  const disciplineClosing =
    "The concierge can map how you mount, move, and see targets to the discipline that fits you now — and the one you’re preparing for next.";

  return (
    <div className="space-y-5">
      <LandingHero hero={landing.hero} />
      <PlatformGrid platforms={landing.platforms} ui={landing.platformGridUi} />
      <Section
        padding="lg"
        bordered={false}
        className="rounded-none border-t border-none! bg-canvas shadow-none!"
        aria-labelledby="discipline-fit-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Text size="label-tight" className="text-ink-muted">
              {disciplineFit.eyebrow ?? "Discipline fit"}
            </Text>
            <Heading
              id="discipline-fit-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {disciplineFit.heading ?? "The geometry of rhythm"}
            </Heading>
            <div className="mb-6 space-y-4 lg:mb-10">
              {disciplineParagraphs.map((paragraph) => (
                <Text key={paragraph} className="text-ink-muted">
                  {paragraph}
                </Text>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label="Ask Perazzi"
                variant="outline"
                payload={{
                  question:
                    disciplineFit.chatPrompt ??
                    "Translate my main clay discipline into Perazzi geometry—rib height, stock line, point of impact, and swing speed—for Trap, Skeet, or Sporting/FITASC. Suggest where I should start.",
                  context: { pageUrl: "/shotguns" },
                }}
              />
            </div>
          </div>

          <div className="space-y-3 type-body text-ink-muted">
            <Text className="text-ink" leading="normal">
              Three rhythms most clay shooters learn:
            </Text>
            <ul className="space-y-2">
              {disciplineBullets.map((item) => (
                <li key={item.code ?? item.label}>
                  <span className="type-title-sm text-ink">{item.label}</span>
                  {" "}–{" "}
                  {item.description ?? ""}
                </li>
              ))}
            </ul>
            <Text className="text-ink-muted">
              {disciplineClosing}
            </Text>
          </div>
        </Container>
      </Section>
      <a className="skip-link" href="#discipline-rail-heading">
        Skip to disciplines
      </a>
      <DisciplineRail
        disciplines={landing.disciplines}
        platforms={landing.platforms}
        ui={landing.disciplineRailUi}
      />
      <Section
        padding="lg"
        bordered={false}
        className="rounded-none border-t border-none! bg-canvas shadow-none!"
        aria-labelledby="gauge-primer-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Heading
              id="gauge-primer-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {gaugeAdvisory.heading ?? "Gauge selection"}
            </Heading>
            <Text className="mb-8 text-ink-muted">
              {gaugeAdvisory.intro
                ?? "Decode how 12, 20, and 28 gauge choices shape recoil feel, swing speed, and payload — and how to pair them with your platform and disciplines."}
            </Text>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label={gaugeAdvisory.chatLabel ?? "Ask about gauges"}
                variant="outline"
                payload={{
                  question:
                    gaugeAdvisory.chatPrompt
                    ?? "Help me choose between 12, 20, and 28 gauge for my Perazzi: recoil feel, payload options, swing speed, and how gauge pairs with MX vs HT platforms for my disciplines.",
                  context: { pageUrl: "/shotguns" },
                }}
              />
              <Link
                href={gaugeAdvisory.linkHref ?? landing.gaugesTeaser.href}
                className="type-button inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {gaugeAdvisory.linkLabel ?? "Explore gauges"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 type-body text-ink-muted">
            <Text className="text-ink" leading="normal">
              What to compare:
            </Text>
            <ul className="space-y-2">
              {(gaugeAdvisory.bullets?.length ? gaugeAdvisory.bullets : landing.gaugesTeaser.bullets).map((item) => (
                <li key={item}>
                  {item}
                </li>
              ))}
            </ul>
            <Text className="text-ink-muted">
              {gaugeAdvisory.closing
                ?? "We’ll tailor gauge choice to your primary discipline, preferred swing, and how you like a gun to absorb recoil."}
            </Text>
          </div>
        </Container>
      </Section>
      <TriggerExplainer explainer={landing.triggerExplainer} />
      <Section
        padding="lg"
        bordered={false}
        className="rounded-none border-t border-none! bg-canvas shadow-none!"
        aria-labelledby="trigger-choice-heading"
      >
        <Container
          size="xl"
          className="flex flex-col gap-10 px-0 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="space-y-4 text-ink">
            <Heading
              id="trigger-choice-heading"
              level={2}
              size="xl"
              className="text-ink"
            >
              {triggerChoice.heading ?? "Trigger choice"}
            </Heading>
            <Text className="mb-8 text-ink-muted">
              {triggerChoice.intro
                ?? "Decide when to choose a fixed trigger group for simplicity, or a detachable set for quick swaps, varied pull weights, and service resilience."}
            </Text>
            <div className="flex flex-wrap gap-3 justify-start">
              <ChatTriggerButton
                label={triggerChoice.chatLabel ?? "Choose my trigger"}
                variant="outline"
                payload={{
                  question:
                    triggerChoice.chatPrompt
                    ?? "Help me decide between a fixed trigger and a removable trigger group on my Perazzi: reliability, service, pull-weight options, and what matters for travel or competition timelines.",
                  context: { pageUrl: "/shotguns", mode: "prospect" },
                }}
              />
              <Link
                href={triggerChoice.linkHref ?? "#trigger-explainer-heading"}
                className="type-button inline-flex items-center justify-center gap-2 rounded-full border border-perazzi-red/60 px-4 py-2 text-perazzi-red hover:border-perazzi-red hover:text-perazzi-red focus-ring"
              >
                {triggerChoice.linkLabel ?? "See trigger details"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3 type-body text-ink-muted">
            <Text className="text-ink" leading="normal">
              What to Weigh:
            </Text>
            <ul className="space-y-2">
              {(triggerChoice.bullets?.length
                ? triggerChoice.bullets
                : [
                    "Fixed group – lighter, fewer parts to manage, set-and-forget confidence.",
                    "Removable group – fast swaps for pull weight or service, keeps you running at events.",
                    "Support & travel – how you compete, who services your gun, and what spares you carry.",
                  ]).map((item) => (
                    <li key={item}>
                      {item}
                    </li>
                  ))}
            </ul>
            <Text className="text-ink-muted">
              {triggerChoice.closing
                ?? "We’ll align trigger choice to your platform, discipline rhythm, and how you like your release to feel under pressure."}
            </Text>
          </div>
        </Container>
      </Section>
      <EngravingGradesCarousel grades={grades} ui={landing.engravingCarouselUi} />
      <CTASection
        text="Begin your fitting with the Botticino atelier—matching balance, trigger feel, and engraving to your rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
