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
  const ratio = platform.hero.aspectRatio ?? 4 / 3;
  const lineageHtml = platform.lineageHtml;
  const analyticsRef = useAnalyticsObserver(
    `shotguns_platform_card_impression:${platform.id}`,
  );

  return (
    <Link
      ref={analyticsRef}
      href={`/shotguns/${platform.slug}`}
      data-analytics-id={`PlatformCard:${platform.id}`}
      className="group flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-transform focus-ring hover:-translate-y-1"
      onClick={() => logAnalytics(`shotguns_platform_card_click:${platform.id}`)}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-neutral-200 transition-transform duration-300 group-hover:scale-[1.01]"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={platform.hero.url}
          alt={platform.hero.alt}
          fill
          sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      </div>

      <header className="mt-4 space-y-1">
        <h3 className="text-xl font-semibold text-ink">
          {platform.name}
        </h3>
        <p className="text-sm text-ink-muted">{platform.tagline}</p>
      </header>

      {lineageHtml ? (
        <div
          className="prose prose-sm mt-3 max-w-none text-ink-muted"
          dangerouslySetInnerHTML={{ __html: lineageHtml }}
        />
      ) : null}

      <p className="mt-3 text-sm text-ink-muted">{platform.hallmark}</p>
      {platform.weightDistribution ? (
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-ink-muted">
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
              className="rounded-full bg-ink/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-ink"
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

      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-perazzi-red">
        Explore the {platform.name} lineage
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
