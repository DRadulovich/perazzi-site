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
    eyebrow: "Concierge brief",
    heading: "Build your shop dossier",
    body:
      "Share how you shoot and what you are tuning. We align availability with fit, balance, and timing before you order.",
    steps: [
      {
        title: "Tell us your discipline",
        body: "We map your event schedule and timing so parts arrive when you need them.",
      },
      {
        title: "Confirm your fit profile",
        body: "Send measurements or prior build notes to align stock and balance options.",
      },
      {
        title: "Reserve a workshop session",
        body: "Receive a dealer-ready brief with pricing, availability, and next steps.",
      },
    ],
    primaryCta: {
      label: "Open the concierge",
      href: "/concierge",
    },
    secondaryCta: {
      label: "Book a fitting",
      href: "/bespoke",
    },
  },
};
