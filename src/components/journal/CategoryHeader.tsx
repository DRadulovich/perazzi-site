"use client";

import Link from "next/link";
import SafeHtml from "@/components/SafeHtml";
import { Heading, Text } from "@/components/ui";
import type { JournalCategoryData } from "@/types/journal";
import { useSiteSettings } from "@/components/site-settings-context";

type CategoryHeaderProps = Readonly<{
  header: JournalCategoryData["header"];
}>;

export function CategoryHeader({ header }: CategoryHeaderProps) {
  const { journalUi } = useSiteSettings();
  const categoryLabel = journalUi?.categoryLabel ?? "Journal";
  const featuredLabel = journalUi?.featuredLabel ?? "Featured:";

  return (
    <header className="space-y-3">
      <Text size="label-tight" muted>
        {categoryLabel}
      </Text>
      <Heading level={1} size="xl" className="text-ink">
        {header.title}
      </Heading>
      {header.subtitleHtml ? (
        <SafeHtml
          className="prose prose-sm text-ink-muted"
          html={header.subtitleHtml}
        />
      ) : null}
      {header.featured ? (
        <Text size="md" className="text-ink">
          {featuredLabel}{" "}
          <Link
            href={`/journal/${header.featured.slug}`}
            className="text-perazzi-red focus-ring"
          >
            {header.featured.title}
          </Link>
        </Text>
      ) : null}
    </header>
  );
}
