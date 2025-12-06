"use client";

import { useState } from "react";

import { PortableBody } from "@/components/journal/PortableBody";
import type { PortableBlock } from "@/types/journal";

export type BuildJourneyArticle = {
  _id: string;
  title: string;
  slug?: { current?: string };
  excerpt?: string;
  body?: PortableBlock[] | PortableBlock;
  heroImage?: {
    asset?: {
      _id?: string;
      url?: string;
    };
    alt?: string;
  };
  buildStepOrder?: number;
  soulQuestion?: string;
};

type StepKey = string;

type BuildJourneyClientProps = {
  stations: BuildJourneyArticle[];
};

type JourneyChaptersProps = {
  stations: BuildJourneyArticle[];
  answers: Record<StepKey, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<StepKey, string>>>;
  artisanParagraphs: Record<StepKey, string>;
  setArtisanParagraphs: React.Dispatch<React.SetStateAction<Record<StepKey, string>>>;
  isSubmitting: Record<StepKey, boolean>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<Record<StepKey, boolean>>>;
};

type JourneyProgressProps = {
  stations: BuildJourneyArticle[];
};

export function BuildJourneyClient({ stations }: BuildJourneyClientProps) {
  const [answers, setAnswers] = useState<Record<StepKey, string>>({});
  const [artisanParagraphs, setArtisanParagraphs] = useState<Record<StepKey, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<StepKey, boolean>>({});

  return (
    <JourneyChapters
      stations={stations}
      answers={answers}
      setAnswers={setAnswers}
      artisanParagraphs={artisanParagraphs}
      setArtisanParagraphs={setArtisanParagraphs}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
    />
  );
}

function JourneyProgress({ stations }: JourneyProgressProps) {
  return (
    <nav aria-label="Build journey progress" className="text-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
        Build journey
      </p>
      <ol className="space-y-3 border-l border-neutral-800 pl-4">
        {stations.map((station, index) => {
          const stepLabel = (index + 1).toString().padStart(2, "0");
          const targetId = station.slug?.current ?? `step-${index + 1}`;
          const linkClass = `group flex flex-col gap-0.5 transition-opacity duration-200 ${
            index === 0 ? "opacity-100" : "opacity-60"
          }`;

          return (
            <li key={station._id}>
              <a
                href={`#${targetId}`}
                data-build-step-link={stepLabel}
                className={linkClass}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted group-hover:text-ink">
                  Step {stepLabel}
                </span>
                <span className="text-sm text-ink group-hover:text-ink">
                  {station.title ?? "Untitled step"}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function JourneyChapters({
  stations,
  answers,
  setAnswers,
  artisanParagraphs,
  setArtisanParagraphs,
  isSubmitting,
  setIsSubmitting,
}: JourneyChaptersProps) {
  return (
    <>
      {stations.map((station, index) => {
        const stepNumber = index + 1;
        const stepLabel = stepNumber.toString().padStart(2, "0");
        const stepKey = stepLabel;
        const bodyBlocks = Array.isArray(station.body)
          ? station.body
          : station.body
            ? [station.body]
            : [];
        const heroUrl = station.heroImage?.asset?.url;
        const sectionId = station.slug?.current ?? `step-${stepNumber}`;
        const hasHero = Boolean(heroUrl);
        const answer = answers[stepKey] ?? "";
        const submitting = isSubmitting[stepKey] ?? false;
        const hasResponse = Boolean(artisanParagraphs[stepKey]);

        return (
          <div key={station._id}>
            {/* Article section: full-viewport with sticky sidebar and card */}
            <section
              id={sectionId}
              data-build-step={stepLabel}
              className="relative scroll-mt-24 min-h-screen bg-black"
            >
              {/* Overlapping vertical gradients: Perazzi black (#181818) fading to transparent from top and bottom */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#181818] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
              </div>

              <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-16 lg:py-20">
                <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                  <JourneyProgress stations={stations} />
                </aside>

                <div
                  className="space-y-6 rounded-2xl border border-border/60 bg-card/10 p-4 shadow-sm
                             sm:rounded-3xl sm:border-border/70 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg"
                >
                  <header className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
                      Step {stepLabel}
                    </p>
                    <h2 className="text-xl font-semibold text-ink lg:text-2xl">
                      {station.title ?? "Untitled step"}
                    </h2>
                    {station.excerpt ? (
                      <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
                        {station.excerpt}
                      </p>
                    ) : null}
                  </header>

                  {hasHero ? (
                    <figure className="overflow-hidden rounded-xl bg-card/0">
                      <img
                        src={heroUrl!}
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

                  {station.soulQuestion ? (
                    <div className="mt-4 space-y-3 rounded-xl border border-border/40 bg-card/5 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E30613]">
                        Reflection
                      </p>
                      <p className="text-sm leading-relaxed text-ink">
                        {station.soulQuestion}
                      </p>

                      <form
                        className="space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const trimmed = answer.trim();
                          if (!trimmed) return;

                          setIsSubmitting((prev) => ({ ...prev, [stepKey]: true }));

                          // Stub behavior: save the answer locally as the artisan response.
                          setArtisanParagraphs((prev) => ({
                            ...prev,
                            [stepKey]: trimmed,
                          }));

                          setIsSubmitting((prev) => ({ ...prev, [stepKey]: false }));
                        }}
                      >
                        <textarea
                          rows={3}
                          className="w-full rounded-md border border-border bg-card/10 px-3 py-2 text-sm text-ink"
                          placeholder="Write your answer here..."
                          value={answer}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [stepKey]: e.target.value }))
                          }
                        />
                        <button
                          type="submit"
                          disabled={submitting || !answer.trim()}
                          className="inline-flex items-center rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
                        >
                          {submitting ? "Saving..." : "Send to the artisan"}
                        </button>
                      </form>

                      {hasResponse ? (
                        <p className="text-xs text-ink-muted/70">Saved to your final step.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Transition section: fullscreen parallax image of the article just read,
                with a quote block previewing the next step's excerpt */}
            {hasHero && index < stations.length - 1 ? (
              <section className="relative min-h-screen" aria-hidden="true">
                <div
                  className="absolute inset-0 bg-cover bg-center bg-fixed"
                  style={{ backgroundImage: `url(${heroUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/90" />
                </div>
                <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-16 sm:py-24">
                  {stations[index + 1]?.excerpt ? (
                    <div className="max-w-2xl text-center space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted/80">
                        Up next • Step {(index + 2).toString().padStart(2, "0")} — {stations[index + 1].title}
                      </p>
                      <blockquote className="text-base font-medium italic leading-relaxed text-ink sm:text-lg sm:leading-relaxed">
                        {stations[index + 1].excerpt}
                      </blockquote>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted/80">
                      Transition • Step {stepLabel} — {station.title ?? "Untitled step"}
                    </p>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
