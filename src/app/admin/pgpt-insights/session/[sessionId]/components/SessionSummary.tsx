import { SessionSummarySection } from "@/components/pgpt-insights/session/SessionSummarySection";

export function SessionSummary({ sessionId }: { sessionId: string }) {
  return <SessionSummarySection sessionId={sessionId} />;
}
