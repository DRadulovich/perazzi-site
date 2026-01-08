import { PageHeading } from "@/components/page-heading";
import { Text } from "@/components/ui/text";
import { getBespokeBuildLanding } from "@/sanity/queries/bespoke-build";

export default async function BespokeBuildPage() {
  const cms = await getBespokeBuildLanding();
  const kicker = cms?.kicker ?? "Bespoke build";
  const title = cms?.title ?? "From measurements to final engraving";
  const description =
    cms?.description ??
    "Use this overview to describe Perazzi’s made-to-measure process before linking to each workshop stage.";
  const body =
    cms?.body ??
    "Future content might include motion, interviews with artisans, or a timeline visualization to tease tunnel testing, wood selection, and more.";

  return (
    <div className="space-y-6">
      <PageHeading
        kicker={kicker}
        title={title}
        description={description}
      />
      <Text size="lg" className="max-w-3xl text-ink-muted">
        {body}
      </Text>
    </div>
  );
}
