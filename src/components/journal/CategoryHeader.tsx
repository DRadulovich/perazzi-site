import Link from "next/link";
import type { JournalCategoryData } from "@/types/journal";

type CategoryHeaderProps = {
  header: JournalCategoryData["header"];
};

export function CategoryHeader({ header }: CategoryHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
        Journal
      </p>
      <h1 className="text-3xl font-semibold text-ink">{header.title}</h1>
      {header.subtitleHtml ? (
        <div
          className="prose prose-sm text-ink-muted"
          dangerouslySetInnerHTML={{ __html: header.subtitleHtml }}
        />
      ) : null}
      {header.featured ? (
        <p className="text-sm text-ink">
          Featured: {" "}
          <Link
            href={`/journal/${header.featured.slug}`}
            className="font-semibold text-perazzi-red focus-ring"
          >
            {header.featured.title}
          </Link>
        </p>
      ) : null}
    </header>
  );
}
