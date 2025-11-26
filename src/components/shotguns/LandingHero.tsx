import { HeroBanner } from "@/components/home/hero-banner";
import type { ShotgunsLandingData } from "@/types/catalog";

type LandingHeroProps = {
  hero: ShotgunsLandingData["hero"];
};

export function LandingHero({ hero }: LandingHeroProps) {
  return (
    <div
      className="relative w-screen"
      style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
    >
      <HeroBanner
        hero={{
          tagline: hero.title,
          subheading: hero.subheading,
          background: hero.background,
        }}
        analyticsId="HeroSeen:shotguns-landing"
        fullBleed
      />
    </div>
  );
}
