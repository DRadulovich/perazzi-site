import { DataTable } from "./DataTable";

type TableSkeletonProps = {
  columns: number;
  rows?: number;
  minWidth?: string;
  tableDensityClass?: string;
};

export function TableSkeleton({ columns, rows = 6, minWidth, tableDensityClass }: TableSkeletonProps) {
  const headers = Array.from({ length: columns }).map((_, idx) => ({
    key: `col-${idx}`,
    label: <div className="h-3 w-16 rounded bg-muted/40" />,
  }));

  return (
    <DataTable headers={headers} minWidth={minWidth} tableDensityClass={tableDensityClass} stickyHeader={false}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={`skeleton-row-${rowIdx}`}>
          {headers.map((header, colIdx) => (
            <td key={`${header.key}-row-${colIdx}`}>
              <div className="h-4 w-full max-w-[160px] rounded bg-muted/30" />
            </td>
          ))}
        </tr>
      ))}
    </DataTable>
  );
}
