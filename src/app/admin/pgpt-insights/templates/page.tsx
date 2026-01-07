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

function normalizeTemplateLabel(template: string | null) {
  const label = (template ?? "").trim();
  return label || "(unknown)";
}

type HeatmapColumn = { key: string; label: string; tooltip?: string };
type TemplateEntry = [string, number];
type HeatmapRow = { archetype: string; total: number; cells: Array<{ key: string; hits: number }> };

function collectHeatmapData(rows: TemplateUsageRow[]) {
  const cellMap = new Map<string, number>();
  const templateTotals = new Map<string, number>();
  const rowTotals = new Map<string, number>();

  for (const row of rows) {
    const archetype = normalizeArchetypeLabel(row.archetype);
    const intent = normalizeIntentLabel(row.intent);
    const template = normalizeTemplateLabel(row.template);
    const key = `${archetype} · ${intent}`;
    const hits = row.hits ?? 0;

    const cellKey = `${key}||${template}`;
    cellMap.set(cellKey, (cellMap.get(cellKey) ?? 0) + hits);
    templateTotals.set(template, (templateTotals.get(template) ?? 0) + hits);
    rowTotals.set(key, (rowTotals.get(key) ?? 0) + hits);
  }

  return { cellMap, templateTotals, rowTotals };
}

function buildHeatmapColumns(templateTotals: Map<string, number>, maxColumns: number) {
  const sortedTemplates = [...templateTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const primaryTemplates = sortedTemplates.slice(0, maxColumns);
  const omittedTemplates = sortedTemplates.slice(maxColumns);
  const columns: HeatmapColumn[] = primaryTemplates.map(([template]) => ({ key: template, label: template }));

  if (omittedTemplates.length > 0) {
    columns.push({
      key: "__other__",
      label: omittedTemplates.length === 1 ? "Other template" : `Other (${omittedTemplates.length})`,
    });
  }

  return { columns, primaryTemplates, omittedTemplates };
}

function buildHeatmapRows(
  rowTotals: Map<string, number>,
  cellMap: Map<string, number>,
  primaryTemplates: TemplateEntry[],
  omittedTemplates: TemplateEntry[],
  maxRows: number,
) {
  const rowEntries = [...rowTotals.entries()].sort((a, b) => b[1] - a[1]);
  const limitedRowEntries = rowEntries.slice(0, maxRows);
  const rowOmitted = rowEntries.length - limitedRowEntries.length;

  const rows = limitedRowEntries.map(([key, total]) => {
    const baseCells = primaryTemplates.map(([template]) => ({
      key: template,
      hits: cellMap.get(`${key}||${template}`) ?? 0,
    }));
    if (omittedTemplates.length === 0) {
      return { archetype: key, total, cells: baseCells };
    }

    const otherHits = omittedTemplates.reduce(
      (acc, [template]) => acc + (cellMap.get(`${key}||${template}`) ?? 0),
      0,
    );
    return { archetype: key, total, cells: [...baseCells, { key: "__other__", hits: otherHits }] };
  });

  return { rows, rowOmitted };
}

function attachOtherColumnTooltip(columns: HeatmapColumn[], omittedTemplates: TemplateEntry[]) {
  if (omittedTemplates.length === 0) return;
  const otherCol = columns.find((col) => col.key === "__other__");
  if (!otherCol) return;
  otherCol.tooltip = omittedTemplates.map(([name]) => name).join(", ").slice(0, 200);
}

export function buildHeatmap(rows: TemplateUsageRow[], maxRows = 40): {
  columns: HeatmapColumn[];
  rows: HeatmapRow[];
  omitted: number;
  rowOmitted: number;
} {
  if (rows.length === 0) {
    return { columns: [], rows: [], omitted: 0, rowOmitted: 0 };
  }

  const { cellMap, templateTotals, rowTotals } = collectHeatmapData(rows);
  const maxColumns = 10;
  const { columns, primaryTemplates, omittedTemplates } = buildHeatmapColumns(templateTotals, maxColumns);
  const { rows: rowsPrepared, rowOmitted } = buildHeatmapRows(
    rowTotals,
    cellMap,
    primaryTemplates,
    omittedTemplates,
    maxRows,
  );
  attachOtherColumnTooltip(columns, omittedTemplates);

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
  const rowOmittedSuffix =
    dataset.rowOmitted > 0 ? ` ( ${dataset.rowOmitted} more rows hidden )` : "";
  const subtitle = `Top ${dataset.columns.length} templates · showing ${dataset.rows.length}${rowOmittedSuffix}`;

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
        subtitle={subtitle}
        columns={dataset.columns}
        rows={dataset.rows}
        className="min-w-0"
      />
    </div>
  );
}
