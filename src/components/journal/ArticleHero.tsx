import Image from "next/image";
import type { Article } from "@/types/journal";

type ArticleHeroProps = {
  article: Article;
};

export function ArticleHero({ article }: ArticleHeroProps) {
  const ratio = article.hero.aspectRatio ?? 16 / 9;
  return (
    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
        {article.category}
      </p>
      <h1 className="text-4xl font-semibold text-ink">{article.title}</h1>
      {article.dekHtml ? (
        <div
          className="prose prose-lg text-ink-muted"
          dangerouslySetInnerHTML={{ __html: article.dekHtml }}
        />
      ) : null}
      <div className="text-sm text-ink-muted">
        <time dateTime={article.dateISO}>{new Date(article.dateISO).toLocaleDateString()}</time>
        {" · "}
        {article.readingTimeMins} min read
      </div>
      <div className="relative" style={{ aspectRatio: ratio }}>
        <Image
          src={article.hero.url}
          alt={article.hero.alt}
          fill
          priority
          sizes="(min-width: 1024px) 900px, 100vw"
          className="rounded-3xl object-cover"
        />
      </div>
    </header>
  );
}
