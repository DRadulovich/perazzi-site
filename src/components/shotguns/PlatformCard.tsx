"use client";

import Image from "next/image";
import Link from "next/link";
import type { Platform } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type PlatformCardProps = {
  platform: Platform;
  priority?: boolean;
  footerLabel?: string;
};

export function PlatformCard({ platform, priority = false, footerLabel }: Readonly<PlatformCardProps>) {
  const analyticsRef = useAnalyticsObserver<HTMLAnchorElement>(
    `shotguns_platform_card_impression:${platform.id}`,
  );

  return (
    <Link
      ref={analyticsRef}
      href={`/shotguns/${platform.slug}`}
      data-analytics-id={`PlatformCard:${platform.id}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-(--color-canvas)/30 p-4 shadow-soft backdrop-blur-sm transition-transform focus-ring hover:-translate-y-1 sm:rounded-3xl sm:bg-canvas/40 sm:p-6 sm:shadow-elevated"
      onClick={() => logAnalytics(`shotguns_platform_card_click:${platform.id}`)}
    >
      <div className="card-media relative rounded-2xl bg-(--surface-elevated) transition-transform duration-300 group-hover:scale-[1.01] aspect-[16/9]">
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
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/60 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      <header className="mt-4 space-y-1">
        <Heading level={3} size="md" className="text-ink">
          {platform.name}
        </Heading>
        <Text className="text-ink-muted">
          {platform.tagline}
        </Text>
      </header>

      {platform.weightDistribution ? (
        <Text
          size="caption"
          className="mt-2 text-ink-muted"
        >
          {platform.weightDistribution}
        </Text>
      ) : null}

      <div className="mt-4">
        <Text size="label-tight" className="text-ink-muted">
          Disciplines
        </Text>
        <ul className="mt-2 flex flex-wrap gap-2 type-body-sm text-ink">
          {platform.typicalDisciplines.map((discipline) => (
            <li
              key={discipline}
              className="rounded-full bg-(--surface-elevated)/85 px-3 py-1 type-label-tight text-ink"
            >
              {discipline}
            </li>
          ))}
        </ul>
      </div>

      {platform.fixedCounterpart ? (
        <Text size="sm" className="mt-4 text-ink-muted">
          Fixed-trigger counterpart:{" "}
          <span className="text-ink">{platform.fixedCounterpart.name}</span>
        </Text>
      ) : null}
      {platform.detachableCounterpart ? (
        <Text size="sm" className="mt-1 text-ink-muted">
          Detachable counterpart:{" "}
          <span className="text-ink">{platform.detachableCounterpart.name}</span>
        </Text>
      ) : null}

      {platform.hallmark || platform.champion ? (
        <div className="mt-6 flex gap-3 md:hidden">
          <span className="w-1 self-stretch rounded-full bg-perazzi-red/80" />
          <div className="flex flex-col gap-4">
            {platform.hallmark ? (
              <Text size="sm" className="text-ink-muted" leading="normal">
                {platform.hallmark}
              </Text>
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
                    <Heading level={4} size="sm" className="text-ink">
                      {platform.champion.name}
                    </Heading>
                  ) : null}
                  {platform.champion?.title ? (
                    <Text size="sm" className="text-ink-muted" leading="normal">
                      {platform.champion.title}
                    </Text>
                  ) : null}
                  {platform.champion?.resume?.winOne ? (
                    <Text size="sm" className="mt-1 text-ink-muted" leading="normal">
                      Win highlight: <span className="text-ink">{platform.champion.resume.winOne}</span>
                    </Text>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-auto pt-6">
        <Text
          asChild
          size="button"
          className="inline-flex items-center gap-2 text-perazzi-red"
          leading="normal"
        >
          <span>
            {footerLabel ?? `Explore the ${platform.name} lineage`}
            <span aria-hidden="true">→</span>
          </span>
        </Text>
      </div>
    </Link>
  );
}
