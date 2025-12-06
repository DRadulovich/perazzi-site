import { groq } from "next-sanity";

import { PortableBody } from "@/components/journal/PortableBody";
import { client } from "@/sanity/lib/client";
import type { PortableBlock } from "@/types/journal";

const BUILD_JOURNEY_QUERY = groq`
  *[_type == "article" && isBuildJourneyStep == true] | order(buildStepOrder asc, title asc) {
    _id,
    title,
    slug,
    excerpt,
    body,
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

type BuildJourneyArticle = {
  _id: string;
  title?: string;
  slug?: { current?: string };
  excerpt?: string;
  body?: PortableBlock[];
  heroImage?: {
    asset?: {
      _id?: string;
      url?: string;
    } | null;
    alt?: string | null;
  } | null;
  buildStepOrder?: number | null;
};

export default async function BuildJourneyPage() {
  const stations = await client.fetch<BuildJourneyArticle[]>(BUILD_JOURNEY_QUERY);

  if (!stations || stations.length === 0) {
    return (
      <main>
        <section>
          <h1>Why a Perazzi Has a Soul</h1>
          <p>No build-journey steps are configured yet in Sanity.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-black text-neutral-100">
      <HeroSection />
      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-16 lg:py-20">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <JourneyProgress stations={stations} />
          </aside>
          <div className="space-y-24">
            <JourneyChapters stations={stations} />
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroSection() {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <header className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Inside the Perazzi Factory
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50 lg:text-5xl">
            Why a Perazzi Has a Soul
          </h1>
          <p className="text-sm leading-relaxed text-neutral-300 lg:text-base">
            A single gun moves station by station through the hands of craftsmen. This page stitches
            those moments into one continuous build journey.
          </p>
        </header>
      </div>
    </section>
  );
}

type JourneyProgressProps = {
  stations: BuildJourneyArticle[];
};

function JourneyProgress({ stations }: JourneyProgressProps) {
  return (
    <nav aria-label="Build journey progress" className="text-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
        Build journey
      </p>
      <ol className="space-y-3">
        {stations.map((station, index) => {
          const stepLabel = (index + 1).toString().padStart(2, "0");

          return (
            <li key={station._id} className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Step {stepLabel}
              </span>
              <span className="text-sm text-neutral-100">
                {station.title ?? "Untitled step"}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type JourneyChaptersProps = {
  stations: BuildJourneyArticle[];
};

function JourneyChapters({ stations }: JourneyChaptersProps) {
  return (
    <>
      {stations.map((station, index) => {
        const stepNumber = index + 1;
        const bodyBlocks = station.body ?? [];
        const heroUrl = station.heroImage?.asset?.url;
        const stepLabel = stepNumber.toString().padStart(2, "0");

        return (
          <section
            key={station._id}
            id={station.slug?.current ?? `step-${stepNumber}`}
            className="scroll-mt-24 space-y-6"
          >
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Step {stepLabel}
              </p>
              <h2 className="text-xl font-semibold text-neutral-50 lg:text-2xl">
                {station.title ?? "Untitled step"}
              </h2>
              {station.excerpt ? (
                <p className="max-w-prose text-sm leading-relaxed text-neutral-300">
                  {station.excerpt}
                </p>
              ) : null}
            </header>

            {heroUrl ? (
              <figure className="overflow-hidden rounded-lg bg-neutral-900">
                <img
                  src={heroUrl}
                  alt={station.heroImage?.alt ?? station.title ?? "Build journey image"}
                  className="h-auto w-full object-cover"
                />
              </figure>
            ) : null}

            {bodyBlocks.length ? (
              <div className="prose prose-invert prose-sm max-w-none lg:prose-base">
                <PortableBody blocks={bodyBlocks} />
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
