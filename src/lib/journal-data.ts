import { cache } from "react";

import { journalArticles, journalCategories, journalLanding } from "@/content/journal";
import type {
  ArticlePageData,
  CategoryKey,
  JournalCategoryData,
  JournalLandingData,
} from "@/types/journal";
import { getArticles, getJournalLanding } from "@/sanity/queries/journal";

const warn = (message: string) => {
  console.warn(`[sanity][journal] ${message}`);
};

function cloneLanding(): JournalLandingData {
  return JSON.parse(JSON.stringify(journalLanding));
}

function cloneCategories(): Record<CategoryKey, JournalCategoryData> {
  return JSON.parse(JSON.stringify(journalCategories)) as Record<CategoryKey, JournalCategoryData>;
}

function cloneArticles(): Record<string, ArticlePageData> {
  return JSON.parse(JSON.stringify(journalArticles)) as Record<string, ArticlePageData>;
}

export const getJournalLandingData = cache(async (): Promise<JournalLandingData> => {
  const data = cloneLanding();

  try {
    const cms = await getJournalLanding();
    if (cms?.hero?.background) {
      data.hero = {
        title: cms.hero.title ?? data.hero.title,
        subheading: cms.hero.subheading ?? data.hero.subheading,
        background: cms.hero.background,
      };
    }
    if (cms?.featuredArticle?.id) {
      data.featured = {
        id: cms.featuredArticle.id,
        title: cms.featuredArticle.title ?? data.featured?.title ?? "Featured story",
        slug: cms.featuredArticle.slug ?? data.featured?.slug ?? "/journal",
      };
      if (cms.featuredArticle.hero) {
        const craftHub = data.hubs.craft;
        if (craftHub?.items?.length) {
          craftHub.items[0].hero = cms.featuredArticle.hero;
        }
      }
    }
  } catch (error) {
    warn((error as Error).message);
  }

  return data;
});

const fetchCategories = cache(async () => cloneCategories());

export async function getJournalCategoryData(key: CategoryKey): Promise<JournalCategoryData | null> {
  const categories = await fetchCategories();
  return categories[key] ?? null;
}

const fetchArticles = cache(async () => {
  const map = new Map(Object.entries(cloneArticles()));
  try {
    const cmsArticles = await getArticles();
    cmsArticles.forEach((article) => {
      if (!article.slug) return;
      const fallback = map.get(article.slug);
      if (!fallback) return;

      fallback.article.title = article.title ?? fallback.article.title;
      fallback.article.hero = article.hero ?? fallback.article.hero;
      fallback.article.bodyPortableText = article.bodyPortableText ?? fallback.article.bodyPortableText;
      fallback.article.tags = article.tags ?? fallback.article.tags;
    });
  } catch (error) {
    warn((error as Error).message);
  }
  return map;
});

export async function getJournalArticleData(slug: string): Promise<ArticlePageData | null> {
  const articles = await fetchArticles();
  return articles.get(slug) ?? null;
}

export const getJournalArticleSlugs = cache(async (): Promise<string[]> => {
  const articles = await fetchArticles();
  return Array.from(articles.keys());
});
