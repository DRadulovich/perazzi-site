import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";

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

export function generateStaticParams() {
  return Object.keys(stageCopy).map((stage) => ({ stage }));
}

export default function BespokeBuildStagePage({
  params,
}: {
  params: { stage: StageSlug };
}) {
  const copy = stageCopy[params.stage];

  if (!copy) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Bespoke build"
        title={copy.title}
        description={copy.description}
      />
      <p className="max-w-3xl text-base text-ink-muted">{copy.body}</p>
    </div>
  );
}
