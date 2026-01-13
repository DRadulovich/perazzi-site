import { Container } from "@/components/ui";

const SkeletonLine = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-ink/10 ${className}`} aria-hidden="true" />
);

const FILTER_SKELETON_KEYS = [
  "filter-1",
  "filter-2",
  "filter-3",
  "filter-4",
  "filter-5",
  "filter-6",
  "filter-7",
  "filter-8",
  "filter-9",
  "filter-10",
];

const CARD_SKELETON_KEYS = [
  "card-1",
  "card-2",
  "card-3",
  "card-4",
  "card-5",
  "card-6",
  "card-7",
  "card-8",
  "card-9",
];

export default function Loading() {
  return (
    <div className="space-y-0" aria-busy="true" aria-live="polite">
      <section className="relative isolate w-screen max-w-[100vw] overflow-hidden min-h-[60vh] pb-8 sm:pb-12 full-bleed full-bleed-offset-top-lg">
        <div className="absolute inset-0 -z-10 bg-ink/10" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl px-sm py-10 sm:px-10 sm:py-12 lg:px-16">
          <SkeletonLine className="h-3 w-32" />
          <SkeletonLine className="mt-5 h-10 w-full max-w-xl" />
          <SkeletonLine className="mt-4 h-5 w-full max-w-2xl" />
          <div className="mt-7 flex flex-wrap gap-2">
            <SkeletonLine className="h-10 w-40" />
            <SkeletonLine className="h-10 w-44" />
          </div>
        </div>
      </section>

      <section className="relative isolate w-screen max-w-[100vw] full-bleed py-10 text-ink sm:py-12">
        <Container size="xl" className="relative z-10">
          <div className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-elevated backdrop-blur-md sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="hidden space-y-4 lg:block">
                <SkeletonLine className="h-4 w-24" />
                <div className="space-y-2">
                  {FILTER_SKELETON_KEYS.map((key) => (
                    <SkeletonLine key={key} className="h-10 w-full" />
                  ))}
                </div>
                <SkeletonLine className="mt-6 h-4 w-20" />
                <SkeletonLine className="h-24 w-full" />
              </aside>

              <div className="space-y-5">
                <div className="sticky top-[calc(var(--site-header-offset-md)+12px)] z-30 -mx-3 rounded-2xl border border-border/70 bg-canvas/85 px-3 py-3 shadow-soft backdrop-blur-md sm:top-[calc(var(--site-header-offset-lg)+12px)] sm:-mx-4 sm:px-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <SkeletonLine className="h-4 w-28" />
                    <div className="flex flex-1 justify-end gap-2">
                      <SkeletonLine className="h-10 w-full max-w-sm" />
                      <SkeletonLine className="h-10 w-40" />
                      <SkeletonLine className="h-10 w-24 lg:hidden" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {CARD_SKELETON_KEYS.map((key) => (
                    <div
                      key={key}
                      className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-soft"
                      aria-hidden="true"
                    >
                      <div className="aspect-3/2 bg-ink/10" />
                      <div className="space-y-3 p-4">
                        <SkeletonLine className="h-3 w-24" />
                        <SkeletonLine className="h-5 w-5/6" />
                        <SkeletonLine className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
