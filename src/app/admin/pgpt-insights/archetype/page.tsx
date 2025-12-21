import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BarChart } from "@/components/pgpt-insights/charts/BarChart";
import { StackedAreaChart, type StackedAreaPoint } from "@/components/pgpt-insights/charts/StackedAreaChart";
import { ValueCard } from "@/components/pgpt-insights/charts/ValueCard";
import { CANONICAL_ARCHETYPE_ORDER } from "@/lib/pgpt-insights/constants";
import {
  getArchetypeDailySeries,
  getArchetypeMarginSummary,
  getArchetypeVariantSplit,
} from "@/lib/pgpt-insights/cached";
import { withAdminAuth } from "@/lib/withAdminAuth";
import type { ArchetypeDailyRow, ArchetypeVariantSplitRow } from "@/lib/pgpt-insights/types";
import { AlertStream } from "./components/AlertStream";

export const dynamic = "force-dynamic";

const ARCHETYPE_COLORS: Record<string, string> = {
  Loyalist: "#00224E",
  Prestige: "#35456C",
  Analyst: "#666970",
  Achiever: "#948E77",
  Legacy: "#C8B866",
  Unknown: "#94a3b8",
};

function shortDayLabel(day: string) {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function normalizeArchetype(label: string | null): string {
  const raw = (label ?? "").trim();
  if (!raw) return "Unknown";
  const match = CANONICAL_ARCHETYPE_ORDER.find((a) => a.toLowerCase() === raw.toLowerCase());
  return match ?? raw;
}

export function buildTrendPoints(
  rows: ArchetypeDailyRow[],
  order: readonly string[],
): StackedAreaPoint[] {
  const byDay = new Map<
    string,
    {
      segments: Record<string, number>;
      total: number;
      marginSum: number;
    }
  >();

  rows.forEach((row) => {
    const day = String(row.day);
    const entry =
      byDay.get(day) ??
      {
        segments: {},
        total: 0,
        marginSum: 0,
      };
    const archetype = normalizeArchetype(row.archetype);
    entry.segments[archetype] = (entry.segments[archetype] ?? 0) + (row.cnt ?? 0);
    entry.total += row.cnt ?? 0;
    if (row.avg_margin !== null && row.avg_margin !== undefined && Number.isFinite(row.avg_margin)) {
      entry.marginSum += Number(row.avg_margin) * (row.cnt ?? 0);
    }
    byDay.set(day, entry);
  });

  const sortedDays = Array.from(byDay.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return sortedDays.map((day) => {
    const entry = byDay.get(day)!;
    const margin = entry.total > 0 ? entry.marginSum / entry.total : null;
    const segments: Record<string, number> = {};
    order.forEach((key) => {
      segments[key] = entry.segments[key] ?? 0;
    });
    const extras = Object.keys(entry.segments).filter((k) => !order.includes(k));
    extras.forEach((key) => {
      segments[key] = entry.segments[key];
    });
    return {
      label: shortDayLabel(day),
      segments,
      line: margin,
    };
  });
}

function formatMargin(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function gradeMargin(
  value: number | null,
): { tone: "default" | "positive" | "warning" | "critical"; label: string } {
  if (value === null || !Number.isFinite(value)) return { tone: "default", label: "No margin data" };
  if (value >= 0.12) return { tone: "positive", label: "Healthy margin" };
  if (value >= 0.08) return { tone: "warning", label: "Watch margin" };
  return { tone: "critical", label: "Low margin" };
}

function formatVariantData(rows: ArchetypeVariantSplitRow[]): ArchetypeVariantSplitRow[] {
  const order = ["baseline", "tiered"];
  const sorted = [...rows].sort((a, b) => {
    const ai = order.indexOf((a.variant ?? "").toLowerCase());
    const bi = order.indexOf((b.variant ?? "").toLowerCase());
    if (ai !== -1 && bi !== -1 && ai !== bi) return ai - bi;
    return (b.total ?? 0) - (a.total ?? 0);
  });
  return sorted;
}

export default async function ArchetypePage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ days?: string }>;
}>) {
  await withAdminAuth();
  const resolvedSearchParams = (await searchParams) ?? {};
  const daysRaw = Number.parseInt(resolvedSearchParams.days ?? "45", 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 120) : 45;

  const [daily, margin, variants] = await Promise.all([
    getArchetypeDailySeries(days),
    getArchetypeMarginSummary(Math.min(days, 30)),
    getArchetypeVariantSplit(Math.min(days, 60)),
  ]);

  const trendPoints = buildTrendPoints(daily, CANONICAL_ARCHETYPE_ORDER);
  const marginGrade = gradeMargin(margin);
  const variantBars = formatVariantData(variants).map((row) => ({
    label: (row.variant ?? "unknown").toString(),
    value: row.total ?? 0,
    secondary: row.avg_margin !== null && row.avg_margin !== undefined ? `Avg margin ${formatMargin(row.avg_margin)}` : null,
  }));

  const subtitle = `Last ${days} days · stacked archetype mix + avg margin line`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb="Archetypes"
        title="Archetype Trend"
        description="Stacked daily archetype mix with confidence margin overlay and alert stream."
        kicker={`Last ${days} days`}
      />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <StackedAreaChart
          points={trendPoints}
          order={[...CANONICAL_ARCHETYPE_ORDER, "Unknown"]}
          colors={ARCHETYPE_COLORS}
          title="Archetype trend"
          subtitle={subtitle}
          lineLabel="Avg margin"
          height={340}
        />

        <div className="space-y-3">
          <ValueCard
            title="Confidence margin (avg)"
            value={formatMargin(margin)}
            tone={marginGrade.tone}
            description={marginGrade.label}
            kicker="Rolling window"
          />

          <BarChart
            title="A/B variant split"
            subtitle="Baseline vs tiered boost buckets"
            data={variantBars}
          />
        </div>
      </div>

      <AlertStream />
    </div>
  );
}
