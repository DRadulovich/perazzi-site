// NOTE: Audited for mobile behavior per docs/GUIDES/Mobile-Design-Guide.md
"use client";

import { useEffect, useState } from "react";

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
  allComplete: boolean;
  activeStepIndex: number;
};

type JourneyChapterBarProps = {
  stations: BuildJourneyArticle[];
  activeStepIndex: number;
};

export function BuildJourneyClient({ stations }: BuildJourneyClientProps) {
  const [answers, setAnswers] = useState<Record<StepKey, string>>({});
  const [artisanParagraphs, setArtisanParagraphs] = useState<Record<StepKey, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<StepKey, boolean>>({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const totalSteps = stations.length;
  const completedSteps = stations.reduce((count, _station, index) => {
    const stepKey = (index + 1).toString().padStart(2, "0");
    return artisanParagraphs[stepKey] ? count + 1 : count;
  }, 0);
  const allComplete = completedSteps >= totalSteps;

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-build-step]"),
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible intersecting section in this batch
        let bestEntry: IntersectionObserverEntry | null = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
          }
        }

        if (!bestEntry) return;

        const stepAttr = bestEntry.target.getAttribute("data-build-step");
        if (!stepAttr) return;

        const idx = Number.parseInt(stepAttr, 10) - 1;
        if (!Number.isNaN(idx)) {
          setActiveStepIndex(idx);
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [stations.length]);

  return (
    <>
      <JourneyChapters
        stations={stations}
        answers={answers}
        setAnswers={setAnswers}
        artisanParagraphs={artisanParagraphs}
        setArtisanParagraphs={setArtisanParagraphs}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        allComplete={allComplete}
        activeStepIndex={activeStepIndex}
      />
      <JourneyChapterBar stations={stations} activeStepIndex={activeStepIndex} />
    </>
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
  allComplete,
  activeStepIndex,
}: JourneyChaptersProps) {
  const orderedArtisanParagraphs = stations.map((station, index) => {
    const stepNumber = index + 1;
    const stepKey = stepNumber.toString().padStart(2, "0");
    return {
      stepKey,
      title: station.title ?? `Step ${stepKey}`,
      paragraph: artisanParagraphs[stepKey] ?? "",
      userAnswer: answers[stepKey] ?? "",
    };
  });

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
              className="relative scroll-mt-24 min-h-screen bg-canvas"
            >
              {/* Overlapping vertical gradients using theme-aware overlays */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-canvas)] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--color-canvas)] to-transparent" />
              </div>

              <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
                <div
                  className="space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm
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
                    <div className="mt-4 space-y-3 rounded-xl bg-card/5 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E30613]">
                        Reflection
                      </p>
                      <p className="text-sm leading-relaxed text-ink">
                        {station.soulQuestion}
                      </p>

                      <form
                        className="space-y-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const trimmed = answer.trim();
                          if (!trimmed) return;

                          setIsSubmitting((prev) => ({ ...prev, [stepKey]: true }));
                          try {
                            const res = await fetch("/api/soul-journey-step", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                step: stepKey,
                                title: station.title,
                                userAnswer: trimmed,
                              }),
                            });

                            if (!res.ok) {
                              throw new Error("Request failed");
                            }

                            const data = (await res.json()) as { paragraph?: string };
                            const paragraph = data?.paragraph;
                            if (typeof paragraph === "string") {
                              setArtisanParagraphs((prev) => ({
                                ...prev,
                                [stepKey]: paragraph,
                              }));
                            }
                          } catch (error) {
                            console.error("[soul-journey-step]", error);
                          } finally {
                            setIsSubmitting((prev) => ({ ...prev, [stepKey]: false }));
                          }
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
                <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-perazzi-black)]/100 via-[color:var(--color-perazzi-black)]/60 to-[color:var(--color-perazzi-black)]/100" />
              </div>
                <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-16 sm:py-24">
                  {stations[index + 1]?.excerpt ? (
                    <div className="max-w-2xl text-center space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                        Up next • Step {(index + 2).toString().padStart(2, "0")} — {stations[index + 1].title}
                      </p>
                      <blockquote className="text-base font-medium italic leading-relaxed text-white sm:text-lg sm:leading-relaxed">
                        {stations[index + 1].excerpt}
                      </blockquote>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                      Transition • Step {stepLabel} — {station.title ?? "Untitled step"}
                    </p>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        );
      })}

      {/* Step 12 – The Soul of Your Gun */}
      <section
        id="step-12"
        className="relative scroll-mt-24 min-h-screen bg-canvas"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-canvas)]/10 via-[color:var(--color-canvas)]/10 to-[color:var(--color-canvas)]/10" />
        </div>

        {!allComplete && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6">
            <p className="text-center italic text-2xl font-light text-ink lg:text-3xl">
              Finish reading and answering each reflection to reveal the final step...
            </p>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div
            className={
              allComplete
                ? "space-y-6 prose prose-invert prose-sm max-w-none lg:prose-base"
                : "space-y-6 prose prose-invert prose-sm max-w-none lg:prose-base blur-sm pointer-events-none select-none"
            }
            data-perazzi-note={
              allComplete
                ? undefined
                : "If you're here in DevTools, you already know: the real soul is in walking the whole line, not skipping to the last page. – David Radulovich"
            }
          >
            <header className="mb-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
                Step 12
              </p>
              <h2 className="text-2xl font-semibold text-ink lg:text-3xl">
                The Soul of Your Gun
              </h2>
              <p className="text-base italic leading-relaxed text-ink sm:text-lg">
                To understand where the soul of a Perazzi comes from, you would have to walk the line
                backwards, listening not to the machines but to the people who lean over them. You’d
                hear the quiet arguments they have with themselves: the “good enough” they decline, the
                second look they take when the clock says move on, the way they talk to steel and wood
                as if both could remember. One imagines how a lock-up should sound ten years from now
                and cuts accordingly. Another adjusts a bore by feel until the pattern stops making
                excuses. Someone else turns away a magnificent piece of walnut because the grain at the
                wrist is dishonest. None of those moments are dramatic; they happen in silence, under
                bad lighting, with nobody watching. Yet each time an artisan chooses the harder, better
                version of their work, a trace of their character stays behind. The soul of the gun is
                built exactly there — at the intersection of all those small acts of integrity — so that
                when it finally meets its shooter, it already carries a history of people who cared
                about that meeting long before it happened.
              </p>
              <p className="text-base italic leading-relaxed text-ink sm:text-lg">
                Every gun that leaves Botticino is seen through this same lens. Whether it enters the factory as a bespoke order with a name already inked on the build sheet, or as “just” a serial number destined for a dealer’s rack, it passes under the same unforgiving lights and the same patient stares; it is measured by the same hands that have spent decades defending the standard behind the name on the building. No one here knows where a given gun will end up, but each is treated as if it will matter to someone in a way they cannot yet imagine. If you’ve stayed with this story long enough to walk the line in your mind and see the work through their eyes, consider what comes next a quiet thank you for that attention. As you look below, you’ll see that the journey you’ve just followed — the anonymous arc of “a” gun — has been quietly tied, step by step, to the details of “your” gun: the same work stations, the same choices, the same people, now converging on the one that will one day close in your hands.
              </p>
            </header>

            {orderedArtisanParagraphs.map(
              ({ stepKey, title, paragraph, userAnswer }, index) =>
                paragraph ? (
                  <div
                    key={stepKey}
                    className={`space-y-2 ${index > 0 ? "mt-6 border-t border-border pt-10" : ""}`}
                  >
                    <p className="text-md font-semibold uppercase tracking-[0.22em] text-perazzi-red">
                      Step {stepKey} — {title}
                    </p>

                    {userAnswer ? (
                      <div className="space-y-1 rounded-md px-3 py-2">
                        <p className="text-md font-semibold uppercase tracking-[0.22em] text-ink-muted/80">
                          Your reflection
                        </p>
                        <p className="text-md italic leading-relaxed text-ink-muted">
                          {userAnswer}
                        </p>
                      </div>
                    ) : null}

                    <p className="text-2xl sm:text-3xl leading-snug text-ink font-artisan">
                      {paragraph}
                    </p>
                  </div>
                ) : null,
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function JourneyChapterBar({ stations, activeStepIndex }: JourneyChapterBarProps) {
  if (!stations.length) return null;

  const total = stations.length;
  const clampedIndex =
    activeStepIndex < 0 ? 0 : activeStepIndex >= total ? total - 1 : activeStepIndex;

  const active = stations[clampedIndex];
  const stepNumber = clampedIndex + 1;
  const stepLabel = stepNumber.toString().padStart(2, "0");

  const prevIndex = clampedIndex > 0 ? clampedIndex - 1 : null;
  const nextIndex = clampedIndex < total - 1 ? clampedIndex + 1 : null;

  const prevTargetId =
    prevIndex !== null ? stations[prevIndex].slug?.current ?? `step-${prevIndex + 1}` : null;
  const nextTargetId =
    nextIndex !== null ? stations[nextIndex].slug?.current ?? `step-${nextIndex + 1}` : "step-12";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-muted bg-ink/50 text-xs text-white shadow-sm backdrop-blur-lg sm:text-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <span className="font-semibold uppercase tracking-[0.22em] text-white">
            Step {stepLabel} of {total}
          </span>
          <span className="truncate text-white">
            {active?.title ?? "Untitled step"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {prevTargetId ? (
            <a
              href={`#${prevTargetId}`}
              className="rounded-full border border-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-card/10"
            >
              Previous
            </a>
          ) : null}
          {nextTargetId ? (
            <a
              href={`#${nextTargetId}`}
              className="rounded-full border border-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-card/10"
            >
              Next
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
