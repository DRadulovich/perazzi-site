import Image from "next/image";
import { groq } from "next-sanity";

import { BuildJourneyClient, type BuildJourneyArticle } from "./BuildJourneyClient";
import { client } from "@/sanity/lib/client";
import { Heading, Text } from "@/components/ui";
import { getBuildJourneyLanding } from "@/sanity/queries/build-journey";

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
  const [stations, landing] = await Promise.all([
    client.fetch<BuildJourneyArticle[]>(BUILD_JOURNEY_QUERY),
    getBuildJourneyLanding(),
  ]);
  const heroImage = landing?.heroImage;
  const hero = {
    src: heroImage?.url ?? "/images/p-web-d-25.jpg",
    alt: heroImage?.alt ?? "Perazzi shotgun in the workshop",
  };
  const intro = {
    label: landing?.intro?.label ?? "Inside the Perazzi Factory",
    title: landing?.intro?.title ?? "Through the Eyes of the Makers",
    body:
      landing?.intro?.body ??
      "Every Perazzi is born the same way: one frame of steel and walnut moving bench by bench through the same circle of hands, whether it’s a bespoke order or a gun you find on a dealer’s shelf. This page stitches those stations into one continuous build journey, following a single gun as it collects their decisions.",
  };

  if (!stations || stations.length === 0) {
    return (
      <main className="bg-canvas text-ink">
        <HeroSection hero={hero} />
        <IntroSection intro={intro} />
        <section className="px-4 py-16 sm:px-6">
          <Text>No build-journey steps are configured yet in Sanity.</Text>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-canvas text-ink">
      <HeroSection hero={hero} />
      <IntroSection intro={intro} />
      <BuildJourneyClient stations={stations} />
    </main>
  );
}

function HeroSection({ hero }: Readonly<{ hero: { src: string; alt: string } }>) {
  return (
    <section className="relative isolate min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] w-screen max-w-[100vw] overflow-hidden bg-canvas full-bleed">
      <div className="absolute inset-0">
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/50 to-black" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24" />
    </section>
  );
}

function IntroSection({
  intro,
}: Readonly<{
  intro: { label: string; title: string; body: string };
}>) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="max-w-2l space-y-4">
          <Text size="label-tight" className="text-ink/70">
            {intro.label}
          </Text>
          <Heading level={1} className="type-section text-ink">
            {intro.title}
          </Heading>
          <Text className="type-section-subtitle text-ink/70">
            {intro.body}
          </Text>
        </header>
      </div>
    </section>
  );
}
