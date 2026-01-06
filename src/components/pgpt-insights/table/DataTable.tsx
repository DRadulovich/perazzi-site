import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Header = Readonly<{
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}>;

type DataTableProps = Readonly<{
  headers: readonly Header[];
  children: ReactNode;
  colgroup?: ReactNode;
  minWidth?: string;
  tableDensityClass?: string;
  maxHeightClassName?: string;
  stickyHeader?: boolean;
  className?: string;
  bodyClassName?: string;
}>;

function withRowChrome(node: ReactNode, idx: number) {
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<{ className?: string; ["data-no-zebra"]?: boolean }>;
  const elementType = typeof element.type === "string" ? element.type : null;
  if (elementType !== "tr") return element;

  const existing = element.props.className;
  const noZebra = Boolean(element.props["data-no-zebra"]);

  const baseRowClass = cn(
    !noZebra && idx % 2 === 1 ? "bg-muted/20" : null,
    "transition-colors hover:bg-muted/40",
    existing,
  );

  return cloneElement(element, { className: baseRowClass });
}

function getHeaderAlignmentClass(align?: Header["align"]) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
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
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-linear-to-b from-card/90 via-card/80 to-muted/20 shadow-sm ring-1 ring-border/50",
        maxHeightClassName ? "overflow-y-auto" : "overflow-x-auto",
      )}
    >
      <div className={cn("overflow-x-auto", maxHeightClassName && "min-w-full", maxHeightClassName)}>
        <table
          className={cn(
            "w-full table-fixed border-collapse text-[13px] text-foreground",
            minWidth,
            "[&_th]:text-left [&_th]:font-semibold [&_th]:text-muted-foreground/90 [&_th]:leading-snug [&_th]:tracking-wide [&_th]:uppercase [&_th]:text-[11px]",
            "[&_td]:align-top [&_td]:text-foreground [&_td]:leading-snug",
            "[&_th]:px-3.5 [&_th]:py-3 [&_td]:px-3.5 [&_td]:py-2.5",
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
                    "border-b border-border/80 bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/80 shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                    stickyHeader && "sticky top-0 z-20",
                    getHeaderAlignmentClass(header.align),
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
