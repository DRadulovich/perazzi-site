"use client";

import Image from "next/image";
import Link from "next/link";
import type { ArticleRef } from "@/types/journal";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";

type FeaturedStoryCardProps = {
  article: ArticleRef;
  hero: { url: string; alt: string; aspectRatio?: number };
  summary?: string;
};

export function FeaturedStoryCard({ article, hero, summary }: FeaturedStoryCardProps) {
  const analyticsRef = useAnalyticsObserver("FeaturedStorySeen");
  const ratio = hero.aspectRatio ?? 16 / 9;

  return (
    <article
      ref={analyticsRef}
      className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
    >
      <Link
        href={`/journal/${article.slug}`}
        className="group flex h-full flex-col focus-ring"
        data-analytics-id="FeaturedStoryClick"
        onClick={() => console.log(`FeaturedStoryClick:${article.slug}`)}
      >
        <figure className="space-y-3">
          <div
            className="relative"
            style={{ aspectRatio: ratio }}
          >
            <Image
              src={hero.url}
              alt={hero.alt}
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          {summary ? (
            <figcaption
              className="px-6 text-sm text-ink-muted"
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          ) : null}
        </figure>
        <div className="px-6 py-5">
          <h3 className="text-xl font-semibold text-ink">{article.title}</h3>
        </div>
      </Link>
    </article>
  );
}
