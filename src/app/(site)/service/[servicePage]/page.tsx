import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";

const serviceCopy = {
  maintenance: {
    title: "Maintenance",
    description: "Routine service schedules, trigger group refreshes, and refinishing.",
    body: "Drop in pricing tables, lead-time callouts, or links to service request forms.",
  },
  parts: {
    title: "Parts",
    description: "Factory-original parts ordering and availability.",
    body: "List common assemblies, serial number requirements, and shipping details.",
  },
} as const;

type ServiceSlug = keyof typeof serviceCopy;

export function generateStaticParams() {
  return Object.keys(serviceCopy).map((servicePage) => ({ servicePage }));
}

export default function ServiceDetailPage({
  params,
}: {
  params: { servicePage: ServiceSlug };
}) {
  const copy = serviceCopy[params.servicePage];

  if (!copy) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Service"
        title={copy.title}
        description={copy.description}
      />
      <p className="max-w-3xl text-base text-ink-muted">{copy.body}</p>
    </div>
  );
}
