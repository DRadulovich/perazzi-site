import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BarChart } from "@/components/pgpt-insights/charts/BarChart";
import { StackedAreaChart, type StackedAreaPoint } from "@/components/pgpt-insights/charts/StackedAreaChart";
import { ValueCard } from "@/components/pgpt-insights/charts/ValueCard";
import { CANONICAL_ARCHETYPE_ORDER, UI_TIMEZONE } from "@/lib/pgpt-insights/constants";
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

// Format YYYY-MM-DD strings into "Apr 16" using the canonical UI time-zone so
// server-side and client-side renders match and avoid hydration warnings.
function formatDayLabel(day: string, tz: string = UI_TIMEZONE) {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
}

function normalizeArchetype(label: string | null): string {
  const raw = (label ?? "").trim();
  if (!raw) return "Unknown";
  const match = CANONICAL_ARCHETYPE_ORDER.find((a) => a.toLowerCase() === raw.toLowerCase());
  return match ?? raw;
}

type DayAccumulator = {
  segments: Record<string, number>;
  total: number;
  marginSum: number;
};

function createDayAccumulator(): DayAccumulator {
  return {
    segments: {},
    total: 0,
    marginSum: 0,
  };
}

function getDayAccumulator(byDay: Map<string, DayAccumulator>, day: string): DayAccumulator {
  const existing = byDay.get(day);
  if (existing) return existing;
  const next = createDayAccumulator();
  byDay.set(day, next);
  return next;
}

function toFiniteNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? Number(value) : null;
}

function addRowToAccumulator(entry: DayAccumulator, row: ArchetypeDailyRow): void {
  const count = row.cnt ?? 0;
  const archetype = normalizeArchetype(row.archetype);
  entry.segments[archetype] = (entry.segments[archetype] ?? 0) + count;
  entry.total += count;
  const margin = toFiniteNumber(row.avg_margin);
  if (margin === null) return;
  entry.marginSum += margin * count;
}

function compareDayStrings(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

function buildSegments(entrySegments: Record<string, number>, order: readonly string[]): Record<string, number> {
  const segments: Record<string, number> = {};
  order.forEach((key) => {
    segments[key] = entrySegments[key] ?? 0;
  });
  Object.keys(entrySegments).forEach((key) => {
    segments[key] ??= entrySegments[key];
  });
  return segments;
}

export function buildTrendPoints(
  rows: ArchetypeDailyRow[],
  order: readonly string[],
): StackedAreaPoint[] {
  const byDay = new Map<string, DayAccumulator>();

  for (const row of rows) {
    const day = String(row.day);
    const entry = getDayAccumulator(byDay, day);
    addRowToAccumulator(entry, row);
  }

  const sortedDays = Array.from(byDay.keys()).sort(compareDayStrings);

  return sortedDays.map((day) => {
    const entry = byDay.get(day)!;
    const margin = entry.total > 0 ? entry.marginSum / entry.total : null;
    return {
      label: formatDayLabel(day),
      segments: buildSegments(entry.segments, order),
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

const VARIANT_ORDER = ["baseline", "tiered"];

type VariantBarDatum = {
  label: string;
  value: number;
  secondary: string | null;
};

function getVariantRank(variant: ArchetypeVariantSplitRow["variant"]): number {
  const index = VARIANT_ORDER.indexOf((variant ?? "").toLowerCase());
  return index === -1 ? VARIANT_ORDER.length : index;
}

function compareVariantRows(a: ArchetypeVariantSplitRow, b: ArchetypeVariantSplitRow): number {
  const ai = getVariantRank(a.variant);
  const bi = getVariantRank(b.variant);
  if (ai !== bi) return ai - bi;
  return (b.total ?? 0) - (a.total ?? 0);
}

function formatVariantData(rows: ArchetypeVariantSplitRow[]): ArchetypeVariantSplitRow[] {
  return [...rows].sort(compareVariantRows);
}

function formatVariantSecondary(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return `Avg margin ${formatMargin(value)}`;
}

function buildVariantBars(rows: ArchetypeVariantSplitRow[]): VariantBarDatum[] {
  return formatVariantData(rows).map((row) => ({
    label: (row.variant ?? "unknown").toString(),
    value: row.total ?? 0,
    secondary: formatVariantSecondary(row.avg_margin),
  }));
}

type ArchetypePageSearchParams = { days?: string };

type ArchetypePageProps = Readonly<{
  searchParams?: ArchetypePageSearchParams;
}>;

type ArchetypePageState = {
  days: number;
  trendPoints: StackedAreaPoint[];
  margin: number | null;
  marginGrade: ReturnType<typeof gradeMargin>;
  variantBars: VariantBarDatum[];
};

function resolveDays(searchParams?: { days?: string }): number {
  const daysRaw = Number.parseInt(searchParams?.days ?? "45", 10);
  if (!Number.isFinite(daysRaw) || daysRaw <= 0) return 45;
  return Math.min(daysRaw, 120);
}

async function loadArchetypeInsights(days: number) {
  const [daily, margin, variants] = await Promise.all([
    getArchetypeDailySeries(days),
    getArchetypeMarginSummary(Math.min(days, 30)),
    getArchetypeVariantSplit(Math.min(days, 60)),
  ]);

  return {
    trendPoints: buildTrendPoints(daily, CANONICAL_ARCHETYPE_ORDER),
    margin,
    marginGrade: gradeMargin(margin),
    variantBars: buildVariantBars(variants),
  };
}

async function getArchetypePageState(searchParams?: ArchetypePageSearchParams): Promise<ArchetypePageState> {
  await withAdminAuth();
  const days = resolveDays(searchParams);
  const { trendPoints, margin, marginGrade, variantBars } = await loadArchetypeInsights(days);

  return {
    days,
    trendPoints,
    margin,
    marginGrade,
    variantBars,
  };
}

function ArchetypePageView({ days, trendPoints, margin, marginGrade, variantBars }: Readonly<ArchetypePageState>) {
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

export default async function ArchetypePage({ searchParams }: ArchetypePageProps) {
  const state = await getArchetypePageState(searchParams);
  return <ArchetypePageView {...state} />;
}
