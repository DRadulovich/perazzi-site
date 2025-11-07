"use client";

import Link from "next/link";

type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
};

type RelatedListProps = {
  items?: RelatedArticle[];
};

export function RelatedList({ items }: RelatedListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="related-articles-heading"
    >
      <h2 id="related-articles-heading" className="text-xl font-semibold text-ink">
        Related reading
      </h2>
      <ul className="space-y-2 text-sm text-ink">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.slug.startsWith("/") ? item.slug : `/${item.slug}`}
              className="font-semibold text-perazzi-red focus-ring"
              prefetch
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
