import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Header = {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

type DataTableProps = {
  headers: Header[];
  children: ReactNode;
  colgroup?: ReactNode;
  minWidth?: string;
  tableDensityClass?: string;
  maxHeightClassName?: string;
  stickyHeader?: boolean;
  className?: string;
  bodyClassName?: string;
};

function withRowChrome(node: ReactNode, idx: number) {
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<{ className?: string; ["data-no-zebra"]?: boolean }>;
  const existing = element.props.className;
  const noZebra = Boolean(element.props["data-no-zebra"]);

  const baseRowClass = cn(
    !noZebra && idx % 2 === 1 ? "bg-muted/30" : null,
    "transition-colors hover:bg-muted/50",
    existing,
  );

  return cloneElement(element, { className: baseRowClass });
}

export function DataTable({
  headers,
  children,
  colgroup,
  minWidth = "min-w-[960px]",
  tableDensityClass,
  maxHeightClassName,
  stickyHeader = true,
  className,
  bodyClassName,
}: DataTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-background/40 shadow-inner", maxHeightClassName ? "overflow-y-auto" : "overflow-x-auto")}>
      <div className={cn("overflow-x-auto", maxHeightClassName && "min-w-full", maxHeightClassName)}>
        <table
          className={cn(
            "w-full table-fixed border-collapse text-xs text-foreground",
            minWidth,
            "[&_th]:text-left [&_th]:font-medium [&_th]:text-muted-foreground [&_th]:leading-snug",
            "[&_td]:align-top [&_td]:text-foreground [&_td]:leading-snug",
            "[&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2",
            tableDensityClass,
            className,
          )}
        >
          {colgroup}
          <thead className={stickyHeader ? "sticky top-0 z-20" : undefined}>
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className={cn(
                    "border-b border-border/80 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80",
                    stickyHeader && "sticky top-0 z-20",
                    header.align === "right" ? "text-right" : header.align === "center" ? "text-center" : "text-left",
                    header.className,
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("divide-y divide-border/60", bodyClassName)}>
            {Children.map(children, (child, idx) => withRowChrome(child, idx))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
