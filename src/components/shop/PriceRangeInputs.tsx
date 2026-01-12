import { Input, Text } from "@/components/ui";

type PriceRangeInputsProps = Readonly<{
  minValue?: string;
  maxValue?: string;
}>;

export function PriceRangeInputs({ minValue, maxValue }: PriceRangeInputsProps) {
  return (
    <div className="space-y-2">
      <Text size="label-tight" muted>
        Price range
      </Text>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-ink type-label-tight">
          <span>Min</span>
          <Input
            name="minPrice"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="0"
            defaultValue={minValue}
          />
        </label>
        <label className="flex flex-col gap-1 text-ink type-label-tight">
          <span>Max</span>
          <Input
            name="maxPrice"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="10000"
            defaultValue={maxValue}
          />
        </label>
      </div>
    </div>
  );
}
