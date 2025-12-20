import type { PgptSessionTimelineRow } from "@/lib/pgpt-insights/types";
import { SessionArchetypeTimeline } from "@/components/pgpt-insights/session/SessionArchetypeTimeline";

export function ArchetypeTimeline({ rows }: { rows: PgptSessionTimelineRow[] }) {
  return <SessionArchetypeTimeline rows={rows} />;
}
