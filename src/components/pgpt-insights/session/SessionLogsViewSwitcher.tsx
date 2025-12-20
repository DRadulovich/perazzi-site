"use client";

import { useState } from "react";

import type { PerazziLogPreviewRow, PerazziLogRow } from "../../../lib/pgpt-insights/types";

import { LogsTableWithDrawer } from "../LogsTableWithDrawer";
import { SessionConversationView } from "./SessionConversationView";

function cn(...parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function SessionLogsViewSwitcher({
  tableLogs,
  conversationLogs,
  tableDensityClass,
  truncPrimary,
  hasMore,
  sessionId,
}: Readonly<{
  tableLogs: PerazziLogPreviewRow[];
  conversationLogs: PerazziLogRow[];
  tableDensityClass: string;
  truncPrimary: number;
  hasMore: boolean;
  sessionId: string;
}>) {
  const [view, setView] = useState<"table" | "conversation">("table");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-border bg-background p-1 text-xs shadow-sm">
          {(
            [
              ["table", "Table View"],
              ["conversation", "Conversation View"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                view === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-muted-foreground">
          {view === "conversation" ? "Full prompts/responses with summary accordions." : "Inspect rows or open details."}
        </span>
      </div>

      {view === "table" ? (
        <LogsTableWithDrawer
          logs={tableLogs}
          tableDensityClass={tableDensityClass}
          truncPrimary={truncPrimary}
        />
      ) : (
        <SessionConversationView logs={conversationLogs} hasMore={hasMore} sessionId={sessionId} />
      )}
    </div>
  );
}
