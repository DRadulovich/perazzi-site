import Image from "next/image";
import type { GradeSeries } from "@/types/catalog";

type GradesHeroProps = {
  hero: {
    title: string;
    subheading?: string;
    background: GradeSeries["gallery"][number];
  };
};

export function GradesHero({ hero }: GradesHeroProps) {
  const ratio = hero.background.aspectRatio ?? 16 / 9;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-perazzi-black text-white">
      <div
        className="relative"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={hero.background.url}
          alt={hero.background.alt}
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 sm:px-12">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {hero.title}
          </h1>
          {hero.subheading ? (
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              {hero.subheading}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
