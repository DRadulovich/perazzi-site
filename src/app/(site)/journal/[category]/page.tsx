import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";

const journalCategories = {
  "stories-of-craft": {
    title: "Stories of Craft",
    description: "Long-form features about artisans and materials.",
    body: "Replace this body copy with CMS-driven stories, quotes, or photography.",
  },
  "champion-interviews": {
    title: "Champion Interviews",
    description: "Conversations with athletes on the podium.",
    body: "Embed audio clips, pull quotes, or stats from recent competitions.",
  },
  news: {
    title: "News",
    description: "Product drops, partnerships, and major announcements.",
    body: "Use cards or a timeline layout when connecting to live content.",
  },
} as const;

type JournalCategorySlug = keyof typeof journalCategories;

export function generateStaticParams() {
  return Object.keys(journalCategories).map((category) => ({ category }));
}

export default function JournalCategoryPage({
  params,
}: {
  params: { category: JournalCategorySlug };
}) {
  const copy = journalCategories[params.category];

  if (!copy) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Journal"
        title={copy.title}
        description={copy.description}
      />
      <p className="max-w-3xl text-base text-ink-muted">{copy.body}</p>
    </div>
  );
}
