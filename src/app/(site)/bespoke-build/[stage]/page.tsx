import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Text } from "@/components/ui/text";
import { getBespokeBuildStage, getBespokeBuildStageSlugs } from "@/sanity/queries/bespoke-build";

const stageCopy = {
  fitting: {
    title: "Fitting Session",
    description: "On-shoulder fitting with craftsmen capturing stance and sight picture.",
    body: "Placeholder for stories about the Brescia showroom and regional fitting partners.",
  },
  measurement: {
    title: "Precision Measurement",
    description: "Documenting cast, drop, pitch, and grip geometry for the stock blank.",
    body: "Pair this copy with schematics, measurement tables, or client anecdotes.",
  },
  "tunnel-test": {
    title: "Tunnel Test",
    description: "Live-fire evaluation of point of impact in the underground tunnel.",
    body: "Explain how Perazzi tunes barrels, ribs, and weights before final finishing.",
  },
  "wood-selection": {
    title: "Wood Selection",
    description: "Selecting Turkish walnut blanks and bookmatched sets.",
    body: "Highlight grading, drying, and finishing notes to set expectations.",
  },
  "engraving-finishing": {
    title: "Engraving & Finishing",
    description: "From hand engraving to oil finishing and final inspection.",
    body: "Use this slot for engraver profiles or step-by-step photography.",
  },
} as const;

type StageSlug = keyof typeof stageCopy;

export async function generateStaticParams() {
  const cmsSlugs = await getBespokeBuildStageSlugs();
  const slugs = cmsSlugs.length ? cmsSlugs : Object.keys(stageCopy);
  return slugs.map((stage) => ({ stage }));
}

export default async function BespokeBuildStagePage({
  params,
}: {
  params: { stage: string };
}) {
  const cms = await getBespokeBuildStage(params.stage);
  const fallback = stageCopy[params.stage as StageSlug];
  const title = cms?.title ?? fallback?.title;
  const description = cms?.description ?? fallback?.description;
  const body = cms?.body ?? fallback?.body;

  if (!title && !description && !body) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Bespoke build"
        title={title ?? "Bespoke build"}
        description={description ?? ""}
      />
      <Text size="lg" className="max-w-3xl text-ink-muted">
        {body ?? ""}
      </Text>
    </div>
  );
}
