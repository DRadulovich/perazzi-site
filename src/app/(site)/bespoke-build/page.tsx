import { PageHeading } from "@/components/page-heading";

export default function BespokeBuildPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Bespoke build"
        title="From measurements to final engraving"
        description="Use this overview to describe Perazzi’s made-to-measure process before linking to each workshop stage."
      />
      <p className="max-w-3xl text-base text-ink-muted">
        Future content might include motion, interviews with artisans, or a
        timeline visualization to tease tunnel testing, wood selection, and more.
      </p>
    </div>
  );
}
