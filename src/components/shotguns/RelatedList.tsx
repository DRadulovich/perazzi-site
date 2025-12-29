"use client";

import Link from "next/link";
import { logAnalytics } from "@/lib/analytics";
import { Heading } from "@/components/ui";

type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
};

type RelatedListProps = {
  heading?: string;
  items?: RelatedArticle[];
};

export function RelatedList({ heading, items }: Readonly<RelatedListProps>) {
  if (!items || items.length === 0) {
    return null;
  }

  const title = heading ?? "Related reading";

  return (
    <section
      className="space-y-3"
      aria-labelledby="related-articles-heading"
    >
      <Heading id="related-articles-heading" level={2} size="lg" className="text-ink">
        {title}
      </Heading>
      <ul className="space-y-2 type-body text-ink">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.slug.startsWith("/") ? item.slug : `/${item.slug}`}
              className="type-title-sm text-perazzi-red focus-ring"
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
