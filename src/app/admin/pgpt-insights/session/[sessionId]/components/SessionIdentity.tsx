import { CopyButton } from "@/components/pgpt-insights/CopyButton";

type SessionIdentityProps = {
  sessionId: string;
  interactionCount: number;
  hasMore: boolean;
  limit: number;
};

export function SessionIdentity({ sessionId, interactionCount, hasMore, limit }: SessionIdentityProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Session</span>
        <span className="font-mono text-xs text-foreground break-all">{sessionId}</span>
        <CopyButton value={sessionId} label="Copy" ariaLabel="Copy session id" />
      </div>

      <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {hasMore ? `${limit}+` : String(interactionCount)}
        </span>
        <span>interactions</span>
      </div>
    </div>
  );
}
