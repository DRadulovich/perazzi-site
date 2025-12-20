import { ArchetypeFiltersBar } from "@/components/pgpt-insights/archetype/ArchetypeFiltersBar";
import { PgptInsightsFiltersPanel } from "@/components/pgpt-insights/FiltersBar";

export function InsightsFilters() {
  return <ArchetypeFiltersBar />;
}

export function InsightsSidebarFilters({ defaultDays }: { defaultDays: number }) {
  return (
    <div id="filters" className="space-y-3">
      <PgptInsightsFiltersPanel defaultDays={defaultDays} variant="sidebar" />
    </div>
  );
}
