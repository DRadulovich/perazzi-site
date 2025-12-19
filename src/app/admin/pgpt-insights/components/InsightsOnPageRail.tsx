import { Suspense } from "react";

import { QaReviewLink } from "@/components/pgpt-insights/QaReviewLink";
import { LOW_SCORE_THRESHOLD } from "@/lib/pgpt-insights/constants";

type Link = { href: string; label: string };

function SectionLinks({ links }: Readonly<{ links: Link[] }>) {
  return (
    <div className="mt-3 flex flex-col gap-1 text-sm">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-md px-2 py-1 text-foreground transition hover:bg-muted/40"
        >
          {link.label}
        </a>
      ))}
      <Suspense fallback={<span className="rounded-md px-2 py-1 text-muted-foreground">QA Review</span>}>
        <QaReviewLink prefix="QA Review" className="rounded-md px-2 py-1 text-blue-600 underline" />
      </Suspense>
    </div>
  );
}

export function InsightsOnPageRail({
  isTriageView,
  density,
}: Readonly<{
  isTriageView: boolean;
  density: string;
}>) {
  const links: Link[] = isTriageView
    ? [
        { href: "#overview", label: "Overview" },
        { href: "#guardrails", label: "Guardrails" },
        { href: "#logs", label: "Logs" },
      ]
    : [
        { href: "#top-issues", label: "Top Issues" },
        { href: "#rag", label: "RAG" },
        { href: "#guardrails", label: "Guardrails" },
        { href: "#archetypes", label: "Archetypes" },
        { href: "#metrics", label: "Metrics" },
        { href: "#logs", label: "Logs" },
      ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">On this page</div>
        <SectionLinks links={links} />
      </div>

      <div className="border-t border-border pt-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Legend</div>
        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500/70" aria-hidden="true" />
            <span>Guardrail blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500/70" aria-hidden="true" />
            <span>Low confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500/70" aria-hidden="true" />
            <span>Low maxScore (&lt; {LOW_SCORE_THRESHOLD})</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-3 text-xs text-muted-foreground">
        Density: <span className="font-medium text-foreground">{density}</span>
      </div>
    </div>
  );
}
