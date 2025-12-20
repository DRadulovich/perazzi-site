import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  breadcrumb: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  kicker?: ReactNode;
};

export function AdminPageHeader({
  breadcrumb,
  title,
  description,
  actions,
  kicker,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card shadow-sm px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Admin</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{breadcrumb}</span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {kicker ? <div className="text-xs text-muted-foreground">{kicker}</div> : null}
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
