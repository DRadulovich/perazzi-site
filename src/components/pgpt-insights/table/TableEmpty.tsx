type TableEmptyProps = Readonly<{
  colSpan: number;
  message?: string;
}>;

export function TableEmpty({ colSpan, message = "No rows to display." }: TableEmptyProps) {
  return (
    <tr data-no-zebra>
      <td colSpan={colSpan} className="px-3 py-6 text-center text-xs text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
