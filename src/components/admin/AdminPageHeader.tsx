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
}: Readonly<AdminPageHeaderProps>) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/70 shadow-sm backdrop-blur-sm px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-muted">
            <span>Admin</span>
            <span className="text-ink-muted">/</span>
            <span className="text-ink">{breadcrumb}</span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
          </div>
          {kicker ? <div className="text-xs text-ink-muted">{kicker}</div> : null}
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
