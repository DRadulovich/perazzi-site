"use client";

import Image from "next/image";
import Link from "next/link";
import type { Platform } from "@/types/catalog";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { Text } from "@/components/ui/text";

type PlatformCardProps = {
  platform: Platform;
  priority?: boolean;
  footerLabel?: string;
};

type PlatformCounterpartsProps = Pick<Platform, "fixedCounterpart" | "detachableCounterpart">;

function PlatformWeightDistribution({ weightDistribution }: Readonly<{ weightDistribution?: string }>) {
  if (!weightDistribution) {
    return null;
  }

  return (
    <Text size="caption" className="mt-2 text-ink-muted">
      {weightDistribution}
    </Text>
  );
}

function PlatformDisciplines({ disciplines }: Readonly<{ disciplines: string[] }>) {
  return (
    <div className="mt-4">
      <Text size="label-tight" className="text-ink-muted">
        Disciplines
      </Text>
      <ul className="mt-2 mb-7 flex flex-wrap gap-2 type-body-sm text-ink">
        {disciplines.map((discipline) => (
          <li
            key={discipline}
            className="pill bg-(--surface-elevated)/85 type-label-tight text-ink"
          >
            {discipline}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlatformCounterparts({
  fixedCounterpart,
  detachableCounterpart,
}: Readonly<PlatformCounterpartsProps>) {
  if (!fixedCounterpart && !detachableCounterpart) {
    return null;
  }

  return (
    <>
      {fixedCounterpart ? (
        <Text size="sm" className="mt-4 type-label-tight text-ink-muted">
          Fixed-trigger counterpart:{" "}
          <span className="text-ink">{fixedCounterpart.name}</span>
        </Text>
      ) : null}
      {detachableCounterpart ? (
        <Text size="sm" className="mt-1 mb-7 type-label-tight text-ink-muted">
          Detachable counterpart:{" "}
          <span className="text-ink">{detachableCounterpart.name}</span>
        </Text>
      ) : null}
    </>
  );
}

function PlatformChampionDetails({ champion }: Readonly<{ champion?: Platform["champion"] }>) {
  if (!champion) {
    return null;
  }

  const { image, name, title, resume } = champion;
  const altText = image?.alt ?? name ?? "Perazzi champion";

  return (
    <div className="flex items-center gap-3">
      {image ? (
        <div className="relative h-12 w-12 overflow-hidden rounded-full">
          <Image
            src={image.url}
            alt={altText}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div>
        {name ? (
          <p className="type-body-title text-ink">
            {name}
          </p>
        ) : null}
        {title ? (
          <Text size="sm" className="type-label-tight text-ink-muted" leading="normal">
            {title}
          </Text>
        ) : null}
        {resume?.winOne ? (
          <Text size="sm" className="mt-1 text-ink-muted" leading="normal">
            Win highlight: <span className="text-ink">{resume.winOne}</span>
          </Text>
        ) : null}
      </div>
    </div>
  );
}

function PlatformHallmarkChampion({
  hallmark,
  champion,
}: Readonly<{
  hallmark: Platform["hallmark"];
  champion?: Platform["champion"];
}>) {
  if (!hallmark && !champion) {
    return null;
  }

  const showChampionDetails = Boolean(
    champion?.name || champion?.image || champion?.resume?.winOne,
  );

  return (
    <div className="mt-6 flex gap-3 md:hidden">
      <span className="w-1 self-stretch rounded-full bg-perazzi-red/80" />
      <div className="flex flex-col gap-4">
        {hallmark ? (
          <Text size="sm" className="text-ink-muted font-artisan text-lg" leading="normal">
            {hallmark}
          </Text>
        ) : null}
        {showChampionDetails ? (
          <PlatformChampionDetails champion={champion} />
        ) : null}
      </div>
    </div>
  );
}

export function PlatformCard({ platform, priority = false, footerLabel }: Readonly<PlatformCardProps>) {
  const analyticsRef = useAnalyticsObserver<HTMLAnchorElement>(
    `shotguns_platform_card_impression:${platform.id}`,
  );

  return (
    <Link
      ref={analyticsRef}
      href={`/shotguns/${platform.slug}`}
      data-analytics-id={`PlatformCard:${platform.id}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-canvas/75 p-4 shadow-soft backdrop-blur-md transition-transform focus-ring hover:-translate-y-1 sm:rounded-3xl sm:bg-canvas/75 sm:p-6 sm:shadow-elevated"
      onClick={() => logAnalytics(`shotguns_platform_card_click:${platform.id}`)}
    >
      <div className="card-media relative rounded-2xl bg-(--surface-elevated) transition-transform duration-300 group-hover:scale-[1.01] aspect-video">
        <Image
          src={platform.hero.url}
          alt={platform.hero.alt}
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover object-center transition-transform duration-1400 ease-out will-change-transform group-hover:scale-[1.04]"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          quality={100}
          unoptimized
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim-strong)/60 via-transparent to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
      </div>

      <header className="mt-4 space-y-1">
        <h3 className="my-3 type-card-title text-ink uppercase text-2xl">
          {platform.name}
        </h3>
        <Text className="type-body text-ink-muted mb-7">
          {platform.tagline}
        </Text>
      </header>

      <PlatformWeightDistribution weightDistribution={platform.weightDistribution} />

      <PlatformDisciplines disciplines={platform.typicalDisciplines} />

      <PlatformCounterparts
        fixedCounterpart={platform.fixedCounterpart}
        detachableCounterpart={platform.detachableCounterpart}
      />

      <PlatformHallmarkChampion hallmark={platform.hallmark} champion={platform.champion} />

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
