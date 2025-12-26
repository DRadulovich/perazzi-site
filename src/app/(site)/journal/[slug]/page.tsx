import Link from "next/link";
import type { Metadata } from "next";
import type { Article } from "@/types/journal";
import { ArticleHero } from "@/components/journal/ArticleHero";
import { PortableBody } from "@/components/journal/PortableBody";
import { MetaBar } from "@/components/journal/MetaBar";
import { AuthorBox } from "@/components/journal/AuthorBox";
import { RelatedList } from "@/components/shotguns/RelatedList";
import { NewsletterSignup } from "@/components/journal/NewsletterSignup";
import { stripHtml } from "@/utils/text";
import {
  getJournalArticleData,
  getJournalArticleSlugs,
} from "@/lib/journal-data";
import { Heading, Text } from "@/components/ui";

type ArticlePageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const slugs = await getJournalArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const data = await getJournalArticleData(params.slug);
  if (!data) return {};
  const { article } = data;
  const description = article.dekHtml ? stripHtml(article.dekHtml) : "Perazzi Journal story";
  const url = `https://perazzi.example/journal/${article.slug}`;
  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description,
      images: [{ url: article.hero.url }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [article.hero.url],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const data = await getJournalArticleData(params.slug);
  if (!data) {
    return (
      <div className="space-y-6 rounded-3xl border border-border/70 bg-card/70 p-6 text-ink shadow-sm sm:p-8">
        <Heading level={1} size="xl">
          Article coming soon
        </Heading>
        <Text size="lg" muted>
          We&apos;re shaping this story now. Check back shortly or explore other Journal features.
        </Text>
        <Link href="/journal" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-perazzi-red focus-ring">
          Return to Journal{" "}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const { article, author, related } = data;
  const jsonLd = getArticleJsonLd(article, author?.name ?? article.authorRef.name);
  const breadcrumbs = getBreadcrumbJsonLd(article);
  const jsonLdText = JSON.stringify(jsonLd);
  const breadcrumbsText = JSON.stringify(breadcrumbs);

  return (
    <div className="space-y-10">
      <script type="application/ld+json">{jsonLdText}</script>
      <script type="application/ld+json">{breadcrumbsText}</script>
      <ArticleHero article={article} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <PortableBody blocks={article.bodyPortableText} />
        <MetaBar article={article} />
      </div>
      <AuthorBox author={author} />
      <RelatedList items={related} />
      <NewsletterSignup />
    </div>
  );
}

function getArticleJsonLd(article: Article, authorName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    image: [article.hero.url],
    datePublished: article.dateISO,
    dateModified: article.dateISO,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Perazzi",
      logo: {
        "@type": "ImageObject",
        url: "https://res.cloudinary.com/pwebsite/image/upload/v1720000000/perazzi/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://perazzi.example/journal/${article.slug}`,
    },
  };
}

function getBreadcrumbJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://perazzi.example" },
      { "@type": "ListItem", position: 2, name: "Journal", item: "https://perazzi.example/journal" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://perazzi.example/journal/${article.slug}` },
    ],
  };
}
