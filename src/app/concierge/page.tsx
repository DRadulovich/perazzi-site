import { ConciergePageShell } from "@/components/concierge/ConciergePageShell";
import { ConciergeHero } from "@/components/concierge/ConciergeHero";

const conciergeHero: Parameters<typeof ConciergeHero>[0]["hero"] = {
  eyebrow: "Perazzi Concierge",
  title: "Design your Perazzi with the atelier beside you",
  subheading:
    "Move through the Build Navigator while the concierge explains each choice, remembers your context, and prepares a dealer-ready brief.",
  background: {
    id: "concierge-hero",
    kind: "image",
    url: "/cinematic_background_photos/p-web-10.jpg",
    alt: "Cinematic view of the Perazzi workshop",
    aspectRatio: 16 / 9,
  },
  bullets: [
    {
      title: "Built for slow decisions",
      body: "Explore each stage, change your mind, and return with fresh eyes without losing your place.",
    },
    {
      title: "Context-aware answers",
      body: "The concierge remembers your selections and intent, so every reply is grounded in your build.",
    },
    {
      title: "Dealer-ready output",
      body: "Save builds and generate a concise brief tailored for your authorized Perazzi dealer.",
    },
    {
      title: "Navigator + conversation",
      body: "Walk through options while talking to the assistant—the two stay in sync the entire time.",
    },
  ],
};

export default function ConciergePage() {
  return (
    <div className="space-y-12">
      <ConciergeHero hero={conciergeHero} />
      <ConciergePageShell />
    </div>
  );
}
