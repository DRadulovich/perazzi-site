import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Text } from "@/components/ui/text";
import { getHeritageSection, getHeritageSectionSlugs } from "@/sanity/queries/heritage-sections";

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

export async function generateStaticParams() {
  const cmsSlugs = await getHeritageSectionSlugs();
  const slugs = cmsSlugs.length ? cmsSlugs : Object.keys(heritageSections);
  return slugs.map((section) => ({ section }));
}

export default async function HeritageSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const cms = await getHeritageSection(params.section);
  const fallback = heritageSections[params.section as HeritageSectionSlug];
  const title = cms?.title ?? fallback?.title;
  const description = cms?.description ?? fallback?.description;
  const body = cms?.body ?? fallback?.body;

  if (!title && !description && !body) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Heritage"
        title={title ?? "Heritage"}
        description={description ?? ""}
      />
      <Text className="max-w-3xl text-ink-muted">
        {body ?? ""}
      </Text>
    </div>
  );
}
