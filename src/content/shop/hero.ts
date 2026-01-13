import type { FactoryAsset } from "@/types/content";
import heroImage from "@/../docs/BIGCOMMERCE/Background-Images/perazzi-legacy-lives-on-7.jpg";

export type ShopHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  background: FactoryAsset;
  conciergePanel: {
    eyebrow: string;
    heading: string;
    body: string;
    steps: Array<{ title: string; body: string }>;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
};

const heroBackground: FactoryAsset = {
  id: "shop-hero-legacy",
  kind: "image",
  url: heroImage.src,
  alt: "Perazzi workshop case and shotgun resting in warm atelier light",
  aspectRatio: heroImage.width / heroImage.height,
};

export const shopHero: ShopHeroContent = {
  eyebrow: "Perazzi Shop",
  title: "Botticino atelier selections",
  subtitle:
    "Concierge-curated components and accessories, matched to your gun, fit profile, and delivery window.",
  primaryCta: {
    label: "Browse the catalog",
    href: "#shop-catalog",
  },
  secondaryCta: {
    label: "Explore bespoke fitting",
    href: "/bespoke",
  },
  background: heroBackground,
  conciergePanel: {
    eyebrow: "Parts concierge",
    heading: "Find the right part for your gun.",
    body:
      "We help you identify the correct component for your exact Perazzi and confirm compatibility before you buy—so you don’t have to fight decision fatigue across hundreds of listings.",
    steps: [
      {
        title: "Tell us your model & serial",
        body: "We narrow options to the correct generation, spec, and revisions for your gun.",
      },
      {
        title: "Confirm the exact component",
        body: "We cross-check diagrams, photos, and compatibility so you order the right part the first time.",
      },
      {
        title: "Choose the best next step",
        body: "If it’s an easy swap, we’ll point you to the right SKU. If it needs a bench, we’ll route you to service.",
      },
    ],
    primaryCta: {
      label: "Open the concierge",
      href: "/concierge",
    },
    secondaryCta: {
      label: "Schedule Service Appointment",
      href: "/service/request",
    },
  },
};
