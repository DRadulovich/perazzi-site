"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import Image from "next/image";
import type { ChampionEvergreen } from "@/types/heritage";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ChampionsGalleryProps = {
  champions: ChampionEvergreen[];
};

export function ChampionsGallery({ champions }: ChampionsGalleryProps) {
  const verified = champions.filter((champion) => Boolean(champion?.name));

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    verified.forEach((champion) => {
      champion.disciplines?.forEach((d) => set.add(d));
    });
    return Array.from(set);
  }, [verified]);

  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);

  if (!verified.length) {
    return (
      <section className="rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10">
        <blockquote className="text-lg italic text-ink">
          “Perazzi heritage is carried by every athlete who chooses calm precision.”
        </blockquote>
      </section>
    );
  }

  const filteredChampions = verified.filter((champion) => {
    if (!activeDiscipline) return true;
    return champion.disciplines?.includes(activeDiscipline);
  });

  return (
    <section
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="heritage-champions-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          The Perazzi Champions
        </p>
        <h2
          id="heritage-champions-heading"
          className="text-2xl font-semibold text-ink"
        >
          The athletes who shaped our lineage
        </h2>
      </div>
      {disciplines.length ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter champions by discipline">
          <button
            type="button"
            aria-pressed={activeDiscipline === null}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring",
              activeDiscipline === null
                ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                : "border-border bg-card text-ink",
            )}
            onClick={() => setActiveDiscipline(null)}
          >
            All
          </button>
          {disciplines.map((discipline) => (
            <button
              key={discipline}
              type="button"
              aria-pressed={activeDiscipline === discipline}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] focus-ring",
                activeDiscipline === discipline
                  ? "border-perazzi-red bg-perazzi-red/10 text-perazzi-red"
                  : "border-border bg-card text-ink",
              )}
              onClick={() =>
                setActiveDiscipline(
                  activeDiscipline === discipline ? null : discipline,
                )
              }
            >
              {discipline}
            </button>
          ))}
        </div>
      ) : null}
      <ul
        role="list"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredChampions.length ? (
          filteredChampions.map((champion) => (
            <ChampionCard key={champion.id} champion={champion} />
          ))
        ) : (
          <li className="rounded-3xl border border-border/70 bg-card/60 p-6 text-sm text-ink-muted">
            No champions in this discipline yet—select another to continue exploring the lineage.
          </li>
        )}
      </ul>
    </section>
  );
}

type ChampionCardProps = {
  champion: ChampionEvergreen;
};

function ChampionCard({ champion }: ChampionCardProps) {
  const ratio = champion.image.aspectRatio ?? 3 / 4;
  const analyticsRef = useAnalyticsObserver<HTMLLIElement>(`ChampionCardViewed:${champion.id}`, {
    threshold: 0.3,
  });
  const [open, setOpen] = useState(false);

  return (
    <li
      ref={analyticsRef}
      data-analytics-id={`ChampionCardViewed:${champion.id}`}
      className="h-full"
    >
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            logAnalytics(`ChampionProfileOpen:${champion.id}`);
          }
        }}
      >
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label={`View profile for ${champion.name}`}
            className="group flex h-full w-full flex-col rounded-3xl border border-border/70 bg-card p-5 text-left shadow-sm focus-ring"
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-neutral-200"
              style={{ aspectRatio: ratio }}
            >
              <Image
                src={champion.image.url}
                alt={champion.image.alt}
                fill
                sizes="(min-width: 1024px) 300px, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold text-ink">{champion.name}</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {champion.title}
              </p>
              <blockquote className="border-l-2 border-perazzi-red/40 pl-3 text-sm italic text-ink-muted">
                “{champion.quote}”
              </blockquote>
              {champion.bio ? (
                <p className="text-xs text-ink-muted line-clamp-3">{champion.bio}</p>
              ) : null}
              {champion.resume &&
              (champion.resume.winOne || champion.resume.winTwo || champion.resume.winThree) ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                    Career Highlights
                  </p>
                  <ul className="space-y-1 text-xs text-ink">
                    {champion.resume.winOne ? <li>• {champion.resume.winOne}</li> : null}
                    {champion.resume.winTwo ? <li>• {champion.resume.winTwo}</li> : null}
                    {champion.resume.winThree ? <li>• {champion.resume.winThree}</li> : null}
                  </ul>
                </div>
              ) : null}
              {champion.disciplines?.length ? (
                <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
                  {champion.disciplines.map((discipline) => (
                    <li key={discipline} className="rounded-full border border-border px-3 py-1">
                      {discipline}
                    </li>
                  ))}
                </ul>
              ) : null}
              {champion.platforms?.length ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-muted">
                    Platforms
                  </p>
                  <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
                    {champion.platforms.map((platform) => (
                      <li key={platform} className="rounded-full border border-border px-3 py-1">
                        {platform}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <span className="mt-auto pt-6 text-xs uppercase tracking-[0.3em] text-perazzi-red">
              Open profile
            </span>
          </button>
        </Dialog.Trigger>
        {open ? (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 focus:outline-none">
              <div className="max-w-3xl rounded-3xl bg-card p-6 shadow-2xl">
                <Dialog.Title className="text-2xl font-semibold text-ink">
                  {champion.name}
                </Dialog.Title>
                <Dialog.Description className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {champion.title}
                </Dialog.Description>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr,1.1fr]">
                  <div
                    className="relative overflow-hidden rounded-2xl bg-neutral-200"
                    style={{ aspectRatio: ratio }}
                  >
                    <Image
                      src={champion.image.url}
                      alt={champion.image.alt}
                      fill
                      sizes="(min-width: 768px) 320px, 100vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-4">
                    <blockquote className="border-l-2 border-perazzi-red/40 pl-3 text-base italic text-ink">
                      “{champion.quote}”
                    </blockquote>
                    {champion.bio ? (
                      <p className="text-sm text-ink-muted">{champion.bio}</p>
                    ) : null}
                    {champion.resume &&
                    (champion.resume.winOne || champion.resume.winTwo || champion.resume.winThree) ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                          Career Highlights
                        </p>
                        <ul className="space-y-1 text-sm text-ink">
                          {champion.resume.winOne ? <li>• {champion.resume.winOne}</li> : null}
                          {champion.resume.winTwo ? <li>• {champion.resume.winTwo}</li> : null}
                          {champion.resume.winThree ? <li>• {champion.resume.winThree}</li> : null}
                        </ul>
                      </div>
                    ) : null}
                    {champion.platforms?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
                          Platforms
                        </p>
                        <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
                          {champion.platforms.map((platform) => (
                            <li key={platform} className="rounded-full border border-border px-3 py-1">
                              {platform}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {champion.article ? (
                      <a
                        href={`/${champion.article.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring"
                      >
                        Read full interview
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : null}
                  </div>
                </div>
                <Dialog.Close className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink focus-ring">
                  Close
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </Dialog.Root>
    </li>
  );
}
