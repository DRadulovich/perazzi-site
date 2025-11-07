import { landing } from "./landing";
import { craft } from "./categories/craft";
import { interviews } from "./categories/interviews";
import { news } from "./categories/news";
import { article as mx8Lineage } from "./articles/mx8-lineage";
import { article as fittingRitual } from "./articles/fitting-ritual";
import { authors } from "./authors";
import type { ArticlePageData, JournalCategoryData } from "@/types/journal";

export const journalLanding = landing;

export const journalCategories: Record<string, JournalCategoryData> = {
  craft,
  interviews,
  news,
};

export const journalArticles: Record<string, ArticlePageData> = {
  "mx8-lineage": {
    article: mx8Lineage,
    author: authors.find((a) => a.id === mx8Lineage.authorRef.id),
    related: [
      { id: fittingRitual.id, title: fittingRitual.title, slug: fittingRitual.slug },
    ],
  },
  "fitting-ritual": {
    article: fittingRitual,
    author: authors.find((a) => a.id === fittingRitual.authorRef.id),
    related: [
      { id: mx8Lineage.id, title: mx8Lineage.title, slug: mx8Lineage.slug },
    ],
  },
};

export { authors };
