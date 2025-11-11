"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { JournalLandingData } from "@/types/journal";
import { stripHtml } from "@/utils/text";
import { logAnalytics } from "@/lib/analytics";

type HubProps = {
  category: keyof JournalLandingData["hubs"];
  data: JournalLandingData["hubs"][keyof JournalLandingData["hubs"]];
};

export function CategoryHub({ category, data }: HubProps) {
  const [visibleCount, setVisibleCount] = useState(2);
  const items = data.items.slice(0, visibleCount);

  return (
    <section className="space-y-4" aria-labelledby={`category-${category}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
            {category.replace(/^[a-z]/, (c) => c.toUpperCase())}
          </p>
          <h2 id={`category-${category}`} className="text-2xl font-semibold text-ink">
            {category === "craft"
              ? "Stories of Craft"
              : category === "interviews"
              ? "Champion Interviews"
              : "News"}
          </h2>
          {data.headerHtml ? (
            <div
              className="prose prose-sm max-w-2xl text-ink-muted"
              dangerouslySetInnerHTML={{ __html: data.headerHtml }}
            />
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
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {item.author}
                </p>
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                {item.excerptHtml ? (
                  <p className="text-sm text-ink-muted">{stripHtml(item.excerptHtml)}</p>
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
