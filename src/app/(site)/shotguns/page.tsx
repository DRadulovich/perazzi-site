import { LandingHero } from "@/components/shotguns/LandingHero";
import { PlatformGrid } from "@/components/shotguns/PlatformGrid";
import { TriggerExplainer } from "@/components/shotguns/TriggerExplainer";
import { DisciplineRail } from "@/components/shotguns/DisciplineRail";
import { CTASection } from "@/components/shotguns/CTASection";
import { EngravingGradesCarousel } from "@/components/shotguns/EngravingGradesCarousel";
import { ShotgunsAdvisorySection } from "@/components/shotguns/ShotgunsAdvisorySection";
import { getShotgunsSectionData } from "@/lib/shotguns-data";

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
      <ShotgunsAdvisorySection
        headingId="discipline-fit-heading"
        eyebrow={disciplineFit.eyebrow ?? "Discipline fit"}
        heading={disciplineFit.heading ?? "The geometry of rhythm"}
        introParagraphs={disciplineParagraphs}
        chatLabel="Ask Perazzi"
        chatPayload={{
          question:
            disciplineFit.chatPrompt ??
            "Translate my main clay discipline into Perazzi geometry—rib height, stock line, point of impact, and swing speed—for Trap, Skeet, or Sporting/FITASC. Suggest where I should start.",
          context: { pageUrl: "/shotguns" },
        }}
        rightTitle="Three rhythms most clay shooters learn:"
        bullets={disciplineBullets.map((item, index) => ({
          key: item.code ?? item.label ?? `discipline-bullet-${index}`,
          label: item.label ?? item.code?.toUpperCase() ?? "Discipline",
          description: item.description ?? "",
        }))}
        closing={disciplineClosing}
      />
      <a className="skip-link" href="#discipline-rail-heading">
        Skip to disciplines
      </a>
      <DisciplineRail
        disciplines={landing.disciplines}
        platforms={landing.platforms}
        ui={landing.disciplineRailUi}
      />
      <ShotgunsAdvisorySection
        headingId="gauge-primer-heading"
        heading={gaugeAdvisory.heading ?? "Gauge selection"}
        introParagraphs={[
          gaugeAdvisory.intro
            ?? "Decode how 12, 20, and 28 gauge choices shape recoil feel, swing speed, and payload — and how to pair them with your platform and disciplines.",
        ]}
        chatLabel={gaugeAdvisory.chatLabel ?? "Ask about gauges"}
        chatPayload={{
          question:
            gaugeAdvisory.chatPrompt
            ?? "Help me choose between 12, 20, and 28 gauge for my Perazzi: recoil feel, payload options, swing speed, and how gauge pairs with MX vs HT platforms for my disciplines.",
          context: { pageUrl: "/shotguns" },
        }}
        link={{
          href: gaugeAdvisory.linkHref ?? landing.gaugesTeaser.href,
          label: gaugeAdvisory.linkLabel ?? "Explore gauges",
        }}
        rightTitle="What to compare:"
        bullets={(gaugeAdvisory.bullets?.length ? gaugeAdvisory.bullets : landing.gaugesTeaser.bullets).map((text) => ({
          key: text,
          text,
        }))}
        closing={
          gaugeAdvisory.closing
            ?? "We’ll tailor gauge choice to your primary discipline, preferred swing, and how you like a gun to absorb recoil."
        }
      />
      <TriggerExplainer explainer={landing.triggerExplainer} />
      <ShotgunsAdvisorySection
        headingId="trigger-choice-heading"
        heading={triggerChoice.heading ?? "Trigger choice"}
        introParagraphs={[
          triggerChoice.intro
            ?? "Decide when to choose a fixed trigger group for simplicity, or a detachable set for quick swaps, varied pull weights, and service resilience.",
        ]}
        chatLabel={triggerChoice.chatLabel ?? "Choose my trigger"}
        chatPayload={{
          question:
            triggerChoice.chatPrompt
            ?? "Help me decide between a fixed trigger and a removable trigger group on my Perazzi: reliability, service, pull-weight options, and what matters for travel or competition timelines.",
          context: { pageUrl: "/shotguns", mode: "prospect" },
        }}
        link={{
          href: triggerChoice.linkHref ?? "#trigger-explainer-heading",
          label: triggerChoice.linkLabel ?? "See trigger details",
        }}
        rightTitle="What to Weigh:"
        bullets={(triggerChoice.bullets?.length
          ? triggerChoice.bullets
          : [
              "Fixed group – lighter, fewer parts to manage, set-and-forget confidence.",
              "Removable group – fast swaps for pull weight or service, keeps you running at events.",
              "Support & travel – how you compete, who services your gun, and what spares you carry.",
            ]).map((text) => ({ key: text, text }))}
        closing={
          triggerChoice.closing
            ?? "We’ll align trigger choice to your platform, discipline rhythm, and how you like your release to feel under pressure."
        }
      />
      <EngravingGradesCarousel grades={grades} ui={landing.engravingCarouselUi} />
      <CTASection
        text="Begin your fitting with the Botticino atelier—matching balance, trigger feel, and engraving to your rhythm."
        primary={{ label: "Begin Your Fitting", href: "/experience/fitting" }}
        secondary={{ label: "Request a Visit", href: "/experience/visit" }}
      />
    </div>
  );
}
