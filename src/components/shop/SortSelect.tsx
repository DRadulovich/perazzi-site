import { Text } from "@/components/ui";
import { PRODUCT_SORT_OPTIONS } from "@/lib/bigcommerce/sort";
import type { ProductSortKey } from "@/lib/bigcommerce/types";

type SortSelectProps = Readonly<{
  value?: ProductSortKey;
  name?: string;
}>;

export function SortSelect({ value, name = "sort" }: SortSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-ink type-label-tight">
      <Text size="label-tight" muted>
        Sort
      </Text>
      <select
        name={name}
        defaultValue={value ?? "RELEVANCE"}
        className="rounded-2xl border border-border/70 bg-card px-3 py-2 type-body-sm text-ink shadow-soft focus-ring"
      >
        {PRODUCT_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
