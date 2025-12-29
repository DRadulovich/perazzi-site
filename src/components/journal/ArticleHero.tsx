import Image from "next/image";
import SafeHtml from "@/components/SafeHtml";
import type { Article } from "@/types/journal";

type ArticleHeroProps = Readonly<{
  article: Article;
}>;

export function ArticleHero({ article }: ArticleHeroProps) {
  const ratio = article.hero.aspectRatio ?? 16 / 9;
  return (
    <header className="space-y-4">
      <p className="type-label text-ink-muted">
        {article.category}
      </p>
      <h1 className="type-display text-ink">{article.title}</h1>
      {article.dekHtml ? (
        <SafeHtml
          className="type-body-lg text-ink-muted"
          html={article.dekHtml}
        />
      ) : null}
      <div className="type-caption text-ink-muted">
        <time dateTime={article.dateISO}>{new Date(article.dateISO).toLocaleDateString()}</time>
        {" · "}
        {article.readingTimeMins} min read
      </div>
      <div className="relative aspect-dynamic" style={{ "--aspect-ratio": ratio }}>
        <Image
          src={article.hero.url}
          alt={article.hero.alt}
          fill
          priority
          sizes="(min-width: 1280px) 960px, (min-width: 1024px) 70vw, 100vw"
          className="rounded-3xl object-cover"
        />
      </div>
    </header>
  );
}
