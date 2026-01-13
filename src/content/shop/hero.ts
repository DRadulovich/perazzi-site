import type { FactoryAsset } from "@/types/content";
import heroImage from "@/../docs/BIGCOMMERCE/Background-Images/perazzi-legacy-lives-on-7.jpg";

export type ShopHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  background: FactoryAsset;
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
    "Concierge-curated components and accessories, matched for fit, balance, and availability.",
  primaryCta: {
    label: "Talk to the concierge",
    href: "/concierge",
  },
  secondaryCta: {
    label: "Browse the catalog",
    href: "#shop-catalog",
  },
  background: heroBackground,
};
