import { PageHeading } from "@/components/page-heading";

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Journal"
        title="Latest editorial dispatches"
        description="Stories of craft, interviews, and news updates live here. Hook this up to Sanity entries later."
      />
      <p className="max-w-3xl text-base text-ink-muted">
        Consider adding category cards or featured stories that drive deeper
        into the category routes.
      </p>
    </div>
  );
}
