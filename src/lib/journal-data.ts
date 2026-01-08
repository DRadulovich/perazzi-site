import { cache } from "react";

import type {
  ArticlePageData,
  CategoryKey,
  JournalCategoryData,
  JournalLandingData,
  TagRef,
} from "@/types/journal";
import { JOURNAL_CATEGORY_PAGE_SIZE } from "@/lib/journal/filters";
import {
  getArticles,
  getJournalCategories,
  getJournalLanding,
  type JournalListArticlePayload,
} from "@/sanity/queries/journal";

const warn = (message: string) => {
  console.warn(`[sanity][journal] ${message}`);
};

function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

const CATEGORY_LINKS: Record<CategoryKey, string> = {
  craft: "/journal/stories-of-craft",
  interviews: "/journal/champion-interviews",
  news: "/journal/news",
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  craft: "Stories of Craft",
  interviews: "Champion Interviews",
  news: "News",
};

const DEFAULT_AUTHOR = "Perazzi";
const DEFAULT_READING_TIME = 5;
const DEFAULT_DATE = "1970-01-01";

const isCategoryKey = (value?: string): value is CategoryKey =>
  value === "craft" || value === "interviews" || value === "news";

const buildSummaryHtml = (article: Pick<JournalListArticlePayload, "dekHtml" | "excerpt">) =>
  article.dekHtml ?? (article.excerpt ? `<p>${article.excerpt}</p>` : undefined);

const toTagRefs = (tags?: string[] | null): TagRef[] => {
  if (!tags?.length) return [];
  return tags.map((tag) => ({
    id: tag,
    label: tag,
    slug: tag,
  }));
};

const mapListItem = (article: JournalListArticlePayload | null | undefined) => {
  if (!article?.slug || !article.hero) return null;

  return {
    title: article.title ?? "Untitled",
    excerptHtml: buildSummaryHtml(article),
    author: article.author?.name ?? DEFAULT_AUTHOR,
    dateISO: article.publishedAt ?? DEFAULT_DATE,
    readingTimeMins: article.readingTimeMins ?? DEFAULT_READING_TIME,
    hero: article.hero,
    tags: toTagRefs(article.tags),
    slug: article.slug,
  };
};

type JournalListItem = NonNullable<ReturnType<typeof mapListItem>>;

type TaggableItem = { tags?: TagRef[] };

const buildTagFilters = (items: TaggableItem[]) => {
  const tagIndex = new Map<string, { label: string; count: number }>();

  items.forEach((item) => {
    if (!item?.tags?.length) return;
    item.tags.forEach((tag) => {
      const entry = tagIndex.get(tag.slug) ?? { label: tag.label, count: 0 };
      entry.count += 1;
      tagIndex.set(tag.slug, entry);
    });
  });

  return Array.from(tagIndex.entries())
    .map(([slug, entry]) => ({
      id: slug,
      label: entry.label,
      slug,
      count: entry.count,
    }))
    .sort((a, b) => b.count - a.count);
};

const buildAuthorFilters = (items: JournalListItem[]) => {
  const authors = new Set<string>();
  items.forEach((item) => {
    if (item?.author) authors.add(item.author);
  });
  return Array.from(authors).sort((a, b) => a.localeCompare(b));
};

const buildDefaultHubs = (): JournalLandingData["hubs"] => ({
  craft: { headerHtml: undefined, items: [], viewAllHref: CATEGORY_LINKS.craft },
  interviews: { headerHtml: undefined, items: [], viewAllHref: CATEGORY_LINKS.interviews },
  news: { headerHtml: undefined, items: [], viewAllHref: CATEGORY_LINKS.news },
});

export const getJournalLandingData = cache(async (): Promise<JournalLandingData | null> => {
  try {
    const cms = await getJournalLanding();
    if (!cms?.hero?.background || !cms.hero.title) return null;

    const hubs = buildDefaultHubs();
    (cms.sections ?? []).forEach((section) => {
      if (!isCategoryKey(section.key)) return;
      const items = (section.items ?? [])
        .map(mapListItem)
        .filter(isDefined);

      hubs[section.key] = {
        headerHtml: section.subtitleHtml ?? undefined,
        items,
        viewAllHref: section.viewAllHref ?? CATEGORY_LINKS[section.key],
      };
    });

    const allItems = Object.values(hubs).flatMap((hub) => hub.items);
    const tags = buildTagFilters(allItems);

    const featured =
      cms.featuredArticle?.id && cms.featuredArticle.slug
        ? {
            id: cms.featuredArticle.id,
            title: cms.featuredArticle.title ?? "Featured story",
            slug: cms.featuredArticle.slug,
          }
        : null;

    return {
      hero: {
        title: cms.hero.title,
        subheading: cms.hero.subheading ?? undefined,
        background: cms.hero.background,
      },
      featured,
      hubs,
      tags: tags.length ? tags : undefined,
    };
  } catch (error) {
    warn((error as Error).message);
    return null;
  }
});

const fetchCategories = cache(async () => {
  try {
    return await getJournalCategories();
  } catch (error) {
    warn((error as Error).message);
    return [];
  }
});

export async function getJournalCategoryData(key: CategoryKey): Promise<JournalCategoryData | null> {
  const categories = await fetchCategories();
  const category = categories.find((entry) => entry.key === key);
  if (!category) return null;

  const items = (category.items ?? [])
    .map(mapListItem)
    .filter(isDefined);

  const featured =
    category.featuredArticle?.id && category.featuredArticle.slug
      ? {
          id: category.featuredArticle.id,
          title: category.featuredArticle.title ?? "Featured story",
          slug: category.featuredArticle.slug,
        }
      : null;

  return {
    header: {
      title: category.title ?? CATEGORY_LABELS[key],
      subtitleHtml: category.subtitleHtml ?? undefined,
      featured,
    },
    items,
    filters: {
      tags: buildTagFilters(items),
      authors: buildAuthorFilters(items),
    },
    pagination: {
      page: 1,
      pageCount: Math.max(1, Math.ceil(items.length / JOURNAL_CATEGORY_PAGE_SIZE)),
    },
  };
}

const fetchArticles = cache(async () => {
  try {
    return await getArticles();
  } catch (error) {
    warn((error as Error).message);
    return [];
  }
});

export async function getJournalArticleData(slug: string): Promise<ArticlePageData | null> {
  if (!slug) return null;
  const articles = await fetchArticles();
  const article = articles.find((entry) => entry.slug === slug);
  if (!article?.hero || !article.slug) return null;

  const category =
    article.categoryKey && isCategoryKey(article.categoryKey) ? article.categoryKey : "craft";
  const authorName = article.author?.name ?? DEFAULT_AUTHOR;
  const authorId = article.author?.id ?? "unknown";
  const dekHtml = article.dekHtml ?? buildSummaryHtml(article);
  const author = article.author
    ? {
        id: article.author.id,
        name: authorName,
        slug: article.author.slug ?? undefined,
        bioHtml: article.author.bioHtml ?? undefined,
        headshot: article.author.headshot ?? undefined,
      }
    : undefined;

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title ?? "Untitled",
      dekHtml: dekHtml ?? undefined,
      hero: article.hero,
      bodyPortableText: article.bodyPortableText ?? [],
      authorRef: { id: authorId, name: authorName },
      dateISO: article.publishedAt ?? DEFAULT_DATE,
      readingTimeMins: article.readingTimeMins ?? DEFAULT_READING_TIME,
      category,
      tags: article.tags ?? [],
    },
    author,
    related: undefined,
  };
}

export const getJournalArticleSlugs = cache(async (): Promise<string[]> => {
  const articles = await fetchArticles();
  return articles.map((article) => article.slug).filter(Boolean) as string[];
});
