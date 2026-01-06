import { useId } from "react";

import { DataTable } from "./DataTable";

type TableSkeletonProps = Readonly<{
  columns: number;
  rows?: number;
  minWidth?: string;
  tableDensityClass?: string;
}>;

export function TableSkeleton({ columns, rows = 6, minWidth, tableDensityClass }: TableSkeletonProps) {
  const skeletonId = useId();
  const headers = Array.from({ length: columns }, (_, index) => ({
    key: `${skeletonId}-col-${index + 1}`,
    label: <div className="h-3 w-16 rounded bg-muted/40" />,
  }));
  const rowKeys = Array.from({ length: rows }, (_, index) => `${skeletonId}-row-${index + 1}`);

  return (
    <DataTable headers={headers} minWidth={minWidth} tableDensityClass={tableDensityClass} stickyHeader={false}>
      {rowKeys.map((rowKey) => (
        <tr key={rowKey}>
          {headers.map((header) => (
            <td key={`${rowKey}-${header.key}`}>
              <div className="h-4 w-full max-w-40 rounded bg-muted/30" />
            </td>
          ))}
        </tr>
      ))}
    </DataTable>
  );
}
