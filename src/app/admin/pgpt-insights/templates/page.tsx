import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HeatMapGrid } from "@/components/pgpt-insights/charts/HeatMapGrid";
import { CANONICAL_ARCHETYPE_ORDER } from "@/lib/pgpt-insights/constants";
import { getTemplateUsageHeatmap } from "@/lib/pgpt-insights/cached";
import { withAdminAuth } from "@/lib/withAdminAuth";
import type { TemplateUsageRow } from "@/lib/pgpt-insights/types";

export const dynamic = "force-dynamic";

const CANONICAL_MAP = new Map(CANONICAL_ARCHETYPE_ORDER.map((name) => [name.toLowerCase(), name]));

function normalizeArchetypeLabel(archetype: string | null) {
  const label = (archetype ?? "").trim();
  if (!label) return "(unknown)";
  const canonical = CANONICAL_MAP.get(label.toLowerCase());
  return canonical ?? label;
}

function normalizeIntentLabel(intent: string | null) {
  const label = (intent ?? "").trim();
  return label || "(none)";
}

type HeatmapColumn = { key: string; label: string; tooltip?: string };

export function buildHeatmap(rows: TemplateUsageRow[], maxRows = 40): {
  columns: HeatmapColumn[];
  rows: Array<{ archetype: string; total: number; cells: Array<{ key: string; hits: number }> }>;
  omitted: number;
  rowOmitted: number;
} {
  if (rows.length === 0) {
    return { columns: [], rows: [], omitted: 0, rowOmitted: 0 };
  }

  const cellMap = new Map<string, number>();
  const templateTotals = new Map<string, number>();
  const rowTotals = new Map<string, number>();

  rows.forEach((row) => {
    const archetype = normalizeArchetypeLabel(row.archetype);
    const intent = normalizeIntentLabel(row.intent);
    const template = (row.template ?? "").trim() || "(unknown)";
    const key = `${archetype} · ${intent}`;
    const hits = row.hits ?? 0;

    const cellKey = `${key}||${template}`;
    cellMap.set(cellKey, (cellMap.get(cellKey) ?? 0) + hits);
    templateTotals.set(template, (templateTotals.get(template) ?? 0) + hits);
    rowTotals.set(key, (rowTotals.get(key) ?? 0) + hits);
  });

  const sortedTemplates = [...templateTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const maxColumns = 10;
  const primaryTemplates = sortedTemplates.slice(0, maxColumns);
  const omittedTemplates = sortedTemplates.slice(maxColumns);
  const columns: HeatmapColumn[] = primaryTemplates.map(([template]) => ({ key: template, label: template }));

  if (omittedTemplates.length > 0) {
    columns.push({
      key: "__other__",
      label: omittedTemplates.length === 1 ? "Other template" : `Other (${omittedTemplates.length})`,
    });
  }

  const rowEntries = [...rowTotals.entries()].sort((a, b) => b[1] - a[1]);
  const limitedRowEntries = rowEntries.slice(0, maxRows);
  const rowOmitted = rowEntries.length - limitedRowEntries.length;

  const rowsPrepared = limitedRowEntries.map(([key, total]) => {
    const baseCells = primaryTemplates.map(([template]) => ({
      key: template,
      hits: cellMap.get(`${key}||${template}`) ?? 0,
    }));
    const otherHits =
      omittedTemplates.length > 0
        ? omittedTemplates.reduce((acc, [template]) => acc + (cellMap.get(`${key}||${template}`) ?? 0), 0)
        : 0;
    const cells = omittedTemplates.length > 0 ? [...baseCells, { key: "__other__", hits: otherHits }] : baseCells;
    return { archetype: key, total, cells };
  });

  // Attach tooltip listing omitted template names (comma-separated, truncated)
  if (omittedTemplates.length > 0) {
    const tooltip = omittedTemplates.map(([name]) => name).join(", ").slice(0, 200);
    const otherCol = columns.find((c) => c.key === "__other__");
    if (otherCol) otherCol.tooltip = tooltip;
  }

  return { columns, rows: rowsPrepared, omitted: omittedTemplates.length, rowOmitted };
}

export default async function TemplateHeatmapPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ days?: string; rows?: string }>;
}>) {
  await withAdminAuth();
  const resolvedSearchParams = (await searchParams) ?? {};
  const daysRaw = Number.parseInt(resolvedSearchParams.days ?? "45", 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 120) : 45;

  const paramsTyped = resolvedSearchParams as { days?: string; rows?: string };
  const rowLimitRaw = Number.parseInt(paramsTyped.rows ?? "40", 10);
  const rowLimit = Number.isFinite(rowLimitRaw) && rowLimitRaw > 0 ? Math.min(rowLimitRaw, 200) : 40;

  const templateRows = await getTemplateUsageHeatmap(days);
  const dataset = buildHeatmap(templateRows, rowLimit);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb="Templates"
        title="Template Usage Heat-map"
        description="Pivot of archetype × intent × response template_id pulled from logs metadata."
        kicker={`Last ${days} days`}
      />

      <HeatMapGrid
        title="Template usage"
        subtitle={`Top ${dataset.columns.length} templates · showing ${dataset.rows.length}${dataset.rowOmitted && dataset.rowOmitted > 0 ? ` ( ${dataset.rowOmitted} more rows hidden )` : ""}`}
        columns={dataset.columns}
        rows={dataset.rows}
        className="min-w-0"
      />
    </div>
  );
}
