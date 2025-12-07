import Image from "next/image";
import { groq } from "next-sanity";

import { BuildJourneyClient, type BuildJourneyArticle } from "./BuildJourneyClient";
import { client } from "@/sanity/lib/client";

const BUILD_JOURNEY_QUERY = groq`
  *[_type == "article" && isBuildJourneyStep == true] | order(buildStepOrder asc, title asc) {
    _id,
    title,
    slug,
    excerpt,
    body,
    soulQuestion,
    heroImage{
      alt,
      "asset": asset->{
        _id,
        url
      }
    },
    buildStepOrder
  }
`;

export default async function BuildJourneyPage() {
  const stations = await client.fetch<BuildJourneyArticle[]>(BUILD_JOURNEY_QUERY);

  if (!stations || stations.length === 0) {
    return (
      <main className="bg-canvas text-ink">
        <HeroSection />
        <section className="px-4 py-16 sm:px-6">
          <p>No build-journey steps are configured yet in Sanity.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-canvas text-ink">
      <HeroSection />
      <BuildJourneyClient stations={stations} />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-canvas">
      <div className="absolute inset-0">
        <Image
          src="/redesign-photos/heritage/pweb-heritage-era-4-bespoke.jpg"
          alt="Bespoke Perazzi shotgun in the heritage workshop"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-black)]/100 via-[color:var(--color-black)]/50 to-[color:var(--color-black)]/100" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
        <header className="max-w-2l space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
            Inside the Perazzi Factory
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-5xl">
            Through the Eyes of the Makers
          </h1>
          <p className="text-sm leading-relaxed text-white/75 lg:text-base">
            Every Perazzi is born the same way: one frame of steel and walnut moving bench by bench through the same circle of hands, whether it’s a bespoke order or a gun you find on a dealer’s shelf. This page stitches those stations into one continuous build journey, following a single gun as it collects their decisions.
          </p>
        </header>
      </div>
    </section>
  );
}
