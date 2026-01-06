import { HeroBanner } from "@/components/home/hero-banner";
import type { ShotgunsLandingData } from "@/types/catalog";

type LandingHeroProps = {
  hero: ShotgunsLandingData["hero"];
};

export function LandingHero({ hero }: Readonly<LandingHeroProps>) {
  return (
    <HeroBanner
      hero={{
        tagline: hero.title,
        subheading: hero.subheading,
        background: hero.background,
      }}
      analyticsId="HeroSeen:shotguns-landing"
      fullBleed
      hideCtas
    />
  );
}
