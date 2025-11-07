import type { FactoryAsset } from "../types/content";

export type CategoryKey = "craft" | "interviews" | "news";

export interface ArticleRef {
  id: string;
  title: string;
  slug: string;
}

export interface TagRef {
  id: string;
  label: string;
  slug: string;
  count?: number;
}

export interface Author {
  id: string;
  name: string;
  slug?: string;
  bioHtml?: string;
  headshot?: FactoryAsset;
  links?: Array<{ label: string; href: string }>;
}

export interface PortableBlock {
  [key: string]: unknown;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  dekHtml?: string;
  hero: FactoryAsset;
  bodyPortableText: PortableBlock[];
  authorRef: { id: string; name: string };
  dateISO: string;
  readingTimeMins: number;
  category: CategoryKey;
  tags: string[];
}

export interface Category {
  id: string;
  key: CategoryKey;
  title: string;
  subtitleHtml?: string;
}

export interface JournalLandingData {
  hero: { title: string; subheading?: string; background: FactoryAsset };
  featured: ArticleRef | null;
  hubs: Record<
    CategoryKey,
    {
      headerHtml?: string;
      items: Array<{
        title: string;
        excerptHtml?: string;
        author: string;
        dateISO: string;
        readingTimeMins: number;
        hero: FactoryAsset;
        tags?: TagRef[];
        slug: string;
      }>;
      viewAllHref: string;
    }
  >;
  tags?: TagRef[];
}

export interface JournalCategoryData {
  header: { title: string; subtitleHtml?: string; featured?: ArticleRef | null };
  items: Array<{
    title: string;
    excerptHtml?: string;
    author: string;
    dateISO: string;
    readingTimeMins: number;
    hero: FactoryAsset;
    tags?: TagRef[];
    slug: string;
  }>;
  filters: { tags: TagRef[]; authors: string[] };
  pagination: { page: number; pageCount: number };
}

export interface ArticlePageData {
  article: Article;
  author?: Author;
  related?: ArticleRef[];
}
