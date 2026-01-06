import { errorMessage } from "@/lib/pgpt-insights/error-utils";
import { recordInsightsError } from "@/lib/pgpt-insights/insights-errors";
import { SectionHeader } from "../SectionHeader";

type SectionErrorProps = Readonly<{
  id?: string;
  title: string;
  error: unknown;
}>;

type SectionSkeletonProps = Readonly<{
  id?: string;
  title: string;
  lines?: number;
}>;

export function SectionError({ id, title, error }: SectionErrorProps) {
  const msg = errorMessage(error);
  recordInsightsError({ sectionId: id, sectionTitle: title, error });

  return (
    <section
      id={id}
      className="rounded-2xl border border-border/80 bg-linear-to-b from-card via-card/80 to-muted/20 shadow-lg"
    >
      <SectionHeader
        title={title}
        description="Failed to load this section."
        rightMeta={
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            error
          </span>
        }
      />

      <div className="space-y-2 border-t border-border/80 bg-card/70 px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
        <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground whitespace-pre-wrap">
          {msg}
        </div>
      </div>
    </section>
  );
}

export function SectionSkeleton({
  id,
  title,
  lines = 4,
}: SectionSkeletonProps) {
  const lineKeys = Array.from({ length: lines }, (_, idx) => `line-${idx + 1}`);

  return (
    <section
      id={id}
      className="rounded-2xl border border-border/80 bg-linear-to-b from-card via-card/80 to-muted/20 shadow-lg"
    >
      <SectionHeader
        title={title}
        description="Loading…"
        rightMeta={
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            …
          </span>
        }
      />

      <div className="border-t border-border/80 bg-card/70 px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
        <div className="animate-pulse space-y-2">
          {lineKeys.map((lineKey) => (
            <div key={lineKey} className="h-4 w-full rounded bg-muted/30" />
          ))}
          <div className="h-24 w-full rounded bg-muted/20" />
        </div>
      </div>
    </section>
  );
}
