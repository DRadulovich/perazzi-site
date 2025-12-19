import { ArchetypeFiltersBar } from "@/components/pgpt-insights/archetype/ArchetypeFiltersBar";
import { FiltersBar } from "@/components/pgpt-insights/FiltersBar";

export function InsightsFilters({ defaultDays }: { defaultDays: number }) {
  return (
    <div className="space-y-4">
      <FiltersBar defaultDays={defaultDays} />
      <ArchetypeFiltersBar />
    </div>
  );
}
