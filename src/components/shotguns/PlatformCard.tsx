"use client";

import Image from "next/image";
import Link from "next/link";
import type { Platform } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type PlatformCardProps = {
  platform: Platform;
  priority?: boolean;
};

export function PlatformCard({ platform, priority = false }: PlatformCardProps) {
  const analyticsRef = useAnalyticsObserver<HTMLAnchorElement>(
    `shotguns_platform_card_impression:${platform.id}`,
  );

  return (
    <Link
      ref={analyticsRef}
      href={`/shotguns/${platform.slug}`}
      data-analytics-id={`PlatformCard:${platform.id}`}
      className="group flex h-full flex-col rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--color-canvas)]/40 p-6 shadow-elevated backdrop-blur-sm transition-transform focus-ring hover:-translate-y-1"
      onClick={() => logAnalytics(`shotguns_platform_card_click:${platform.id}`)}
    >
      <div
        className="card-media relative rounded-2xl bg-[color:var(--surface-elevated)] transition-transform duration-300 group-hover:scale-[1.01]"
        style={{ aspectRatio: "16 / 9" }}
      >
        <Image
          src={platform.hero.url}
          alt={platform.hero.alt}
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover object-center"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          quality={100}
          unoptimized
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--scrim-strong)]/60 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      <header className="mt-4 space-y-1">
        <h3 className="text-xl font-semibold text-ink">
          {platform.name}
        </h3>
        <p className="text-sm text-ink-muted">{platform.tagline}</p>
      </header>

      {platform.weightDistribution ? (
        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-ink-muted">
          {platform.weightDistribution}
        </p>
      ) : null}

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
          Disciplines
        </h4>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm text-ink">
          {platform.typicalDisciplines.map((discipline) => (
            <li
              key={discipline}
              className="rounded-full bg-[color:var(--surface-elevated)]/85 px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-ink"
            >
              {discipline}
            </li>
          ))}
        </ul>
      </div>

      {platform.fixedCounterpart ? (
        <p className="mt-4 text-xs text-ink-muted">
          Fixed-trigger counterpart:{" "}
          <span className="font-semibold">{platform.fixedCounterpart.name}</span>
        </p>
      ) : null}
      {platform.detachableCounterpart ? (
        <p className="mt-1 text-xs text-ink-muted">
          Detachable counterpart:{" "}
          <span className="font-semibold">{platform.detachableCounterpart.name}</span>
        </p>
      ) : null}

      {platform.hallmark || platform.champion ? (
        <div className="mt-6 flex gap-3 md:hidden">
          <span className="w-1 self-stretch rounded-full bg-perazzi-red/80" />
          <div className="flex flex-col gap-4">
            {platform.hallmark ? (
              <p className="text-sm italic text-ink-muted">{platform.hallmark}</p>
            ) : null}
            {platform.champion?.name || platform.champion?.image || platform.champion?.resume?.winOne ? (
              <div className="flex items-center gap-3">
                {platform.champion?.image ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={platform.champion.image.url}
                      alt={platform.champion.image.alt ?? `${platform.champion.name ?? "Perazzi champion"}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div>
                  {platform.champion?.name ? (
                    <p className="text-sm font-semibold text-ink">{platform.champion.name}</p>
                  ) : null}
                  {platform.champion?.title ? (
                    <p className="text-xs text-ink-muted">{platform.champion.title}</p>
                  ) : null}
                  {platform.champion?.resume?.winOne ? (
                    <p className="mt-1 text-xs text-ink-muted">
                      Win highlight: <span className="font-medium">{platform.champion.resume.winOne}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-auto pt-6">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red">
          Explore the {platform.name} lineage
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
