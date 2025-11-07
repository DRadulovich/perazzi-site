import { PageHeading } from "@/components/page-heading";

export default function ServicePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Service"
        title="Ownership support"
        description="Stand up editorial for maintenance programs, spare parts, and concierge care."
      />
      <p className="max-w-3xl text-base text-ink-muted">
        Introduce service expectations, lead times, and how to schedule work
        with authorized partners.
      </p>
    </div>
  );
}
