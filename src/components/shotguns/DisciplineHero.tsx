import Image from "next/image";
import type { DisciplineSummary } from "@/types/catalog";

type DisciplineHeroProps = {
  hero?: DisciplineSummary["hero"];
  name: string;
};

export function DisciplineHero({ hero, name }: DisciplineHeroProps) {
  if (!hero) {
    return (
      <section className="rounded-3xl bg-perazzi-black px-6 py-12 text-white sm:px-10">
        <h1 className="text-3xl font-semibold">{name}</h1>
        <p className="mt-3 text-sm text-white/75">
          Explore recommended platforms, setup recipes, and stories from the line.
        </p>
      </section>
    );
  }

  const ratio = hero.aspectRatio ?? 16 / 9;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-perazzi-black text-white">
      <div
        className="relative"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={hero.url}
          alt={hero.alt}
          fill
          priority
          sizes="(min-width: 1024px) 1100px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 sm:px-12">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {name}
          </h1>
        </div>
      </div>
    </section>
  );
}
