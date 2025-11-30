import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";

const heritageSections = {
  timeline: {
    title: "Timeline",
    description: "Major innovations from 1957 to today.",
    body: "Plot milestone cards, patent callouts, or audio from Daniele Perazzi.",
  },
  champions: {
    title: "Champions",
    description: "Shooters who carried Perazzi to the podium.",
    body: "Add interview snippets or stats from Olympics, ISSF, and FITASC events.",
  },
  factory: {
    title: "Factory",
    description: "A behind-the-scenes look at the Botticino facility.",
    body: "Use this page for workshop photography, artisan quotes, and process steps.",
  },
} as const;

type HeritageSectionSlug = keyof typeof heritageSections;

export function generateStaticParams() {
  return Object.keys(heritageSections).map((section) => ({ section }));
}

export default function HeritageSectionPage({
  params,
}: {
  params: { section: HeritageSectionSlug };
}) {
  const copy = heritageSections[params.section];

  if (!copy) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Heritage"
        title={copy.title}
        description={copy.description}
      />
      <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-ink-muted">
        {copy.body}
      </p>
    </div>
  );
}
