import type { PerazziLogPreviewRow, PerazziLogRow } from "@/lib/pgpt-insights/types";
import { SessionLogsViewSwitcher } from "@/components/pgpt-insights/session/SessionLogsViewSwitcher";

type SessionLogsViewProps = {
  tableLogs: PerazziLogPreviewRow[];
  conversationLogs: PerazziLogRow[];
  tableDensityClass: string;
  truncPrimary: number;
  hasMore: boolean;
  sessionId: string;
};

export function SessionLogsView({
  tableLogs,
  conversationLogs,
  tableDensityClass,
  truncPrimary,
  hasMore,
  sessionId,
}: SessionLogsViewProps) {
  return (
    <SessionLogsViewSwitcher
      tableLogs={tableLogs}
      conversationLogs={conversationLogs}
      tableDensityClass={tableDensityClass}
      truncPrimary={truncPrimary}
      hasMore={hasMore}
      sessionId={sessionId}
    />
  );
}
