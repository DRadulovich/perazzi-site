"use client";

import Link from "next/link";
import { logAnalytics } from "@/lib/analytics";

type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
};

type RelatedListProps = {
  heading?: string;
  items?: RelatedArticle[];
};

export function RelatedList({ heading, items }: RelatedListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const title = heading ?? "Related reading";

  return (
    <section
      className="space-y-3"
      aria-labelledby="related-articles-heading"
    >
      <h2
        id="related-articles-heading"
        className="text-xl sm:text-2xl font-semibold text-ink"
      >
        {title}
      </h2>
      <ul className="space-y-2 text-sm sm:text-base leading-relaxed text-ink">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.slug.startsWith("/") ? item.slug : `/${item.slug}`}
              className="font-semibold text-perazzi-red focus-ring"
              prefetch
              onClick={() => logAnalytics(`RelatedClick:${item.slug}`)}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
