"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { JournalLandingData } from "@/types/journal";
import { stripHtml } from "@/utils/text";
import { logAnalytics } from "@/lib/analytics";
import { Heading, Text } from "@/components/ui";

type HubProps = {
  readonly category: keyof JournalLandingData["hubs"];
  readonly data: JournalLandingData["hubs"][keyof JournalLandingData["hubs"]];
};

export function CategoryHub({ category, data }: HubProps) {
  const [visibleCount, setVisibleCount] = useState(2);
  const items = data.items.slice(0, visibleCount);
  const heading = getCategoryHeading(category);
  const headerText = data.headerHtml ? stripHtml(data.headerHtml) : null;

  return (
    <section className="space-y-4" aria-labelledby={`category-${category}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Text size="xs" muted className="font-semibold">
            {category.replace(/^[a-z]/, (c) => c.toUpperCase())}
          </Text>
          <Heading id={`category-${category}`} level={2} size="xl" className="text-ink">
            {heading}
          </Heading>
          {headerText ? (
            <Text size="md" muted className="max-w-2xl">
              {headerText}
            </Text>
          ) : null}
        </div>
        <Link
          href={data.viewAllHref}
          className="text-sm font-semibold text-perazzi-red focus-ring"
          onClick={() => logAnalytics(`CategoryTabClick:${category}`)}
        >
          View all →
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.slug} className="rounded-3xl border border-border/70 bg-card">
            <Link
              href={`/journal/${item.slug}`}
              className="flex h-full flex-col rounded-3xl focus-ring"
              onClick={() => logAnalytics(`FeaturedStoryClick:${item.slug}`)}
            >
              <div
                className="card-media relative"
                style={{ aspectRatio: item.hero.aspectRatio ?? 16 / 9 }}
              >
                <Image
                  src={item.hero.url}
                  alt={item.hero.alt}
                  fill
                  sizes="(min-width: 1024px) 500px, 100vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-2 p-5">
                <Text size="xs" muted className="font-semibold">
                  {item.author}
                </Text>
                <Heading level={3} size="md" className="text-ink">
                  {item.title}
                </Heading>
                {item.excerptHtml ? (
                  <Text size="md" muted>
                    {stripHtml(item.excerptHtml)}
                  </Text>
                ) : null}
              </div>
            </Link>
          </article>
        ))}
      </div>
      {visibleCount < data.items.length ? (
        <button
          type="button"
          className="text-sm font-semibold text-perazzi-red focus-ring"
          onClick={() => {
            setVisibleCount((prev) => Math.min(prev + 2, data.items.length));
            logAnalytics(`CategoryTabClick:${category}-load-more`);
          }}
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}

function getCategoryHeading(category: HubProps["category"]) {
  if (category === "craft") return "Stories of Craft";
  if (category === "interviews") return "Champion Interviews";
  return "News";
}
