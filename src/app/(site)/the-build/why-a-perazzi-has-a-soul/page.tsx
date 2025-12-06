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
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window === 'undefined') return;
              var sections = document.querySelectorAll('[data-build-step]');
              var links = document.querySelectorAll('[data-build-step-link]');
              if (!sections.length || !links.length) return;
              if (!('IntersectionObserver' in window)) return;

              var linkByStep = {};
              links.forEach(function(link) {
                var step = link.getAttribute('data-build-step-link');
                if (step) {
                  linkByStep[step] = link;
                }
              });

              function setActive(step) {
                Object.keys(linkByStep).forEach(function(key) {
                  var link = linkByStep[key];
                  if (!link) return;
                  if (key === step) {
                    link.classList.add('opacity-100');
                    link.classList.remove('opacity-60');
                  } else {
                    link.classList.add('opacity-60');
                    link.classList.remove('opacity-100');
                  }
                });
              }

              var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                  if (entry.isIntersecting) {
                    var step = entry.target.getAttribute('data-build-step');
                    if (step) {
                      setActive(step);
                    }
                  }
                });
              }, { threshold: 0.5 });

              sections.forEach(function(section) {
                observer.observe(section);
              });

              var first = sections[0];
              if (first) {
                var initialStep = first.getAttribute('data-build-step');
                if (initialStep) {
                  setActive(initialStep);
                }
              }
            })();
          `,
        }}
      />
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
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/80 to-black" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
        <header className="max-w-xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
            Inside the Perazzi Factory
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink lg:text-5xl">
            Why a Perazzi Has a Soul
          </h1>
          <p className="text-sm leading-relaxed text-ink-muted lg:text-base">
            A single gun moves station by station through the hands of craftsmen. This page stitches
            those moments into one continuous build journey.
          </p>
        </header>
      </div>
    </section>
  );
}
