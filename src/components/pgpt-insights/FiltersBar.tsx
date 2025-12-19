"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Disclosure, Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";

import { CANONICAL_ARCHETYPE_ORDER } from "../../lib/pgpt-insights/constants";
import { cn } from "@/lib/utils";

type Chip = { key: string; label: string; onRemove: () => void };
type FiltersPanelProps = {
  defaultDays: number;
  variant?: "default" | "sidebar";
  className?: string;
};

function safeLabel(value: string, max = 36) {
  const s = String(value ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

type Option = { label: string; value: string };

function FilterSelect({
  value,
  onChange,
  options,
  srLabel,
  className,
  buttonClassName,
  fullWidth = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  srLabel?: string;
  className?: string;
  buttonClassName?: string;
  fullWidth?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  const displayLabel = current?.label ?? value;
  const baseWidth = fullWidth ? "w-full" : "w-full min-w-[140px] sm:w-auto";

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={cn("relative", baseWidth, className)}>
        <Listbox.Button
          className={cn(
            "inline-flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm transition",
            "hover:border-border/80 hover:bg-muted/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            buttonClassName,
          )}
          aria-label={srLabel}
        >
          <span className="truncate text-left">{displayLabel}</span>
          <span className="ml-2 flex items-center text-muted-foreground" aria-hidden="true">
            <ChevronDown className="h-4 w-4" />
          </span>
          {srLabel ? <span className="sr-only">{srLabel}</span> : null}
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-1"
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
        >
          <Listbox.Options className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card text-sm shadow-xl focus:outline-none">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                className={({ active }) =>
                  cn(
                    "flex cursor-pointer items-center justify-between gap-3 px-3 py-2",
                    active ? "bg-muted/60 text-foreground" : "text-muted-foreground",
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className={cn("truncate", selected && "font-semibold text-foreground")}>
                      {option.label}
                    </span>
                    {selected ? <Check className="h-4 w-4 text-blue-500" aria-hidden="true" /> : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

export function PgptInsightsFiltersPanel({
  defaultDays,
  variant = "default",
  className,
}: FiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const densityKey = "pgptInsights.density";
  const viewKey = "pgptInsights.view";

  const get = (k: string) => searchParams.get(k) ?? "";

  const env = get("env") || "all";
  const endpoint = get("endpoint") || "all";
  const days = get("days") || String(defaultDays);

  const density = get("density") || "comfortable";
  const view = get("view") || "full";

  const qUrl = get("q");

  const grStatus = get("gr_status") || "any";
  const grReasonUrl = get("gr_reason");

  const lowConf = get("low_conf") || "any";
  const score = get("score") || "any";

  const archetype = get("archetype") || "any";
  const modelUrl = get("model");

  const gateway = get("gateway") || "any";
  const qa = get("qa") || "any";
  const rerank = get("rerank") || "any";
  const snapped = get("snapped") || "any";
  const marginLt = get("margin_lt") || "any";

  function replaceParams(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    const deleteIfDefault = () => {
      if (key === "env" && value === "all") next.delete("env");
      if (key === "endpoint" && value === "all") next.delete("endpoint");

      if (key === "days" && value === String(defaultDays)) next.delete("days");
      if (key === "density" && value === "comfortable") next.delete("density");
      if (key === "view" && value === "full") next.delete("view");

      if (
        (key === "gr_status" ||
          key === "low_conf" ||
          key === "score" ||
          key === "archetype" ||
          key === "gateway" ||
          key === "qa" ||
          key === "rerank" ||
          key === "snapped" ||
          key === "margin_lt") &&
        value === "any"
      ) {
        next.delete(key);
      }
    };

    const v = String(value ?? "").trim();

    if (!v) {
      next.delete(key);
    } else {
      next.set(key, v);
      deleteIfDefault();
    }

    next.delete("page");
    replaceParams(next);
  }

  function removeParam(key: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(key);
    next.delete("page");
    replaceParams(next);
  }

  function resetAll() {
    const storedDensity = typeof window !== "undefined" ? window.localStorage.getItem(densityKey) : null;
    const storedView = typeof window !== "undefined" ? window.localStorage.getItem(viewKey) : null;

    const keepDensity = storedDensity || density || "comfortable";
    const keepView = storedView || view || "full";

    const next = new URLSearchParams();
    if (keepDensity !== "comfortable") next.set("density", keepDensity);
    if (keepView !== "full") next.set("view", keepView);

    replaceParams(next);
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(densityKey, density);
    } catch {}
  }, [density]);

  useEffect(() => {
    try {
      window.localStorage.setItem(viewKey, view);
    } catch {}
  }, [view]);

  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    let changed = false;
    const next = new URLSearchParams(searchParams.toString());

    try {
      const storedDensity = window.localStorage.getItem(densityKey);
      const storedView = window.localStorage.getItem(viewKey);

      if (!searchParams.get("density") && storedDensity && storedDensity !== "comfortable") {
        next.set("density", storedDensity);
        changed = true;
      }

      if (!searchParams.get("view") && storedView && storedView !== "full") {
        next.set("view", storedView);
        changed = true;
      }
    } catch {}

    if (changed) replaceParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [qInput, setQInput] = useState(qUrl);
  useEffect(() => setQInput(qUrl), [qUrl]);

  useEffect(() => {
    if (qInput === qUrl) return;
    const t = window.setTimeout(() => {
      setParam("q", qInput.trim());
      if (!qInput.trim()) {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("q");
        next.delete("page");
        replaceParams(next);
      }
    }, 350);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput, qUrl]);

  const [grReasonInput, setGrReasonInput] = useState(grReasonUrl);
  useEffect(() => setGrReasonInput(grReasonUrl), [grReasonUrl]);

  const [modelInput, setModelInput] = useState(modelUrl);
  useEffect(() => setModelInput(modelUrl), [modelUrl]);

  const chips: Chip[] = useMemo(() => {
    const out: Chip[] = [];

    if (env && env !== "all") out.push({ key: "env", label: `env: ${env}`, onRemove: () => removeParam("env") });
    if (endpoint && endpoint !== "all")
      out.push({ key: "endpoint", label: `endpoint: ${endpoint}`, onRemove: () => removeParam("endpoint") });

    if (days === "all") out.push({ key: "days", label: `time: all`, onRemove: () => removeParam("days") });
    else if (days && days !== String(defaultDays))
      out.push({ key: "days", label: `last ${days} days`, onRemove: () => removeParam("days") });

    if (density && density !== "comfortable")
      out.push({ key: "density", label: `density: ${density}`, onRemove: () => removeParam("density") });
    if (view && view !== "full") out.push({ key: "view", label: `view: ${view}`, onRemove: () => removeParam("view") });

    if (qUrl) out.push({ key: "q", label: `q: “${safeLabel(qUrl, 28)}”`, onRemove: () => removeParam("q") });

    if (grStatus !== "any")
      out.push({
        key: "gr_status",
        label: `guardrail: ${grStatus}`,
        onRemove: () => removeParam("gr_status"),
      });

    if (grReasonUrl)
      out.push({
        key: "gr_reason",
        label: `reason: ${safeLabel(grReasonUrl, 28)}`,
        onRemove: () => removeParam("gr_reason"),
      });

    if (lowConf !== "any")
      out.push({ key: "low_conf", label: `low_conf: ${lowConf}`, onRemove: () => removeParam("low_conf") });

    if (score !== "any") out.push({ key: "score", label: `score: ${score}`, onRemove: () => removeParam("score") });

    if (archetype !== "any")
      out.push({ key: "archetype", label: `archetype: ${archetype}`, onRemove: () => removeParam("archetype") });

    if (modelUrl)
      out.push({ key: "model", label: `model: ${safeLabel(modelUrl, 28)}`, onRemove: () => removeParam("model") });

    if (gateway !== "any")
      out.push({ key: "gateway", label: `gateway: ${gateway}`, onRemove: () => removeParam("gateway") });

    if (qa !== "any") out.push({ key: "qa", label: `qa: ${qa}`, onRemove: () => removeParam("qa") });

    if (rerank !== "any")
      out.push({ key: "rerank", label: `rerank: ${rerank === "true" ? "on" : "off"}`, onRemove: () => removeParam("rerank") });

    if (snapped !== "any")
      out.push({
        key: "snapped",
        label: `confidence: ${snapped === "true" ? "snapped" : "mixed"}`,
        onRemove: () => removeParam("snapped"),
      });

    if (marginLt !== "any")
      out.push({
        key: "margin_lt",
        label: `margin < ${marginLt}`,
        onRemove: () => removeParam("margin_lt"),
      });

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    env,
    endpoint,
    days,
    density,
    view,
    qUrl,
    grStatus,
    grReasonUrl,
    lowConf,
    score,
    archetype,
    modelUrl,
    gateway,
    qa,
    rerank,
    snapped,
    marginLt,
    defaultDays,
  ]);

  const isSidebar = variant === "sidebar";
  const headerLayout = cn(
    "flex flex-col gap-2",
    isSidebar ? "sm:items-start" : "sm:flex-row sm:items-start sm:justify-between",
  );
  const primaryControls = isSidebar
    ? "grid grid-cols-1 gap-3"
    : "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end";
  const advancedControls = isSidebar
    ? "mt-3 grid grid-cols-1 gap-3"
    : "mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end";

  const chipsBlock =
    chips.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted/20 hover:text-foreground"
            title="Remove filter"
          >
            <span>{chip.label}</span>
            <span className="text-[12px] leading-none">×</span>
          </button>
        ))}
      </div>
    ) : (
      <div className="text-xs text-muted-foreground">No active filters.</div>
    );

  const controlRowClass = isSidebar ? "flex flex-col gap-1 text-sm" : "flex items-center gap-2 text-sm";
  const controlSelectFullWidth = isSidebar;
  const inputClass = cn(
    "h-9 rounded-md border bg-background px-3 text-sm",
    isSidebar ? "w-full" : "ml-2 w-[320px] max-w-full",
  );
  const inlineLabelClass = isSidebar ? "text-sm font-medium text-foreground" : undefined;

  const controls = (
    <>
      <div className={primaryControls}>
        <div className={controlRowClass}>
          <span className={inlineLabelClass}>Env:</span>
          <FilterSelect
            value={env}
            onChange={(val) => setParam("env", val)}
            options={[
              { value: "all", label: "all" },
              { value: "local", label: "local" },
              { value: "preview", label: "preview" },
              { value: "production", label: "production" },
            ]}
            srLabel="Environment"
            fullWidth={controlSelectFullWidth}
          />
        </div>

        <div className={controlRowClass}>
          <span className={inlineLabelClass}>Endpoint:</span>
          <FilterSelect
            value={endpoint}
            onChange={(val) => setParam("endpoint", val)}
            options={[
              { value: "all", label: "all" },
              { value: "assistant", label: "assistant" },
              { value: "soul_journey", label: "soul_journey" },
            ]}
            srLabel="Endpoint"
            fullWidth={controlSelectFullWidth}
          />
        </div>

        <div className={controlRowClass}>
          <span className={inlineLabelClass}>Time window:</span>
          <FilterSelect
            value={days}
            onChange={(val) => setParam("days", val)}
            options={[
              { value: "7", label: "last 7 days" },
              { value: String(defaultDays), label: `last ${defaultDays} days` },
              { value: "90", label: "last 90 days" },
              { value: "all", label: "all time" },
            ]}
            srLabel="Time window"
            fullWidth={controlSelectFullWidth}
          />
        </div>

        <div className={controlRowClass}>
          <span className={inlineLabelClass}>Density:</span>
          <FilterSelect
            value={density}
            onChange={(val) => setParam("density", val)}
            options={[
              { value: "comfortable", label: "comfortable" },
              { value: "compact", label: "compact" },
            ]}
            srLabel="Table density"
            fullWidth={controlSelectFullWidth}
          />
        </div>

        <div className={controlRowClass}>
          <span className={inlineLabelClass}>View:</span>
          <FilterSelect
            value={view}
            onChange={(val) => setParam("view", val)}
            options={[
              { value: "full", label: "full" },
              { value: "triage", label: "triage" },
            ]}
            srLabel="View mode"
            fullWidth={controlSelectFullWidth}
          />
        </div>

        <label className={controlRowClass}>
          <span className={inlineLabelClass}>Search logs:</span>
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search prompts/responses…"
            className={inputClass}
          />
        </label>
      </div>

      <details className="group rounded-xl border border-border bg-background p-3">
        <summary className="cursor-pointer list-none text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">
          <span className="font-medium text-foreground">Advanced</span>{" "}
          <span className="ml-2 text-muted-foreground">guardrails · QA · score · model/archetype</span>
        </summary>

        <div className={advancedControls}>
          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Guardrail status:</span>
            <FilterSelect
              value={grStatus}
              onChange={(val) => setParam("gr_status", val)}
              options={[
                { value: "any", label: "any" },
                { value: "blocked", label: "blocked" },
                { value: "not_blocked", label: "not blocked" },
              ]}
              srLabel="Guardrail status"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <label className={controlRowClass}>
            <span className={inlineLabelClass}>Guardrail reason:</span>
            <input
              value={grReasonInput}
              onChange={(e) => setGrReasonInput(e.target.value)}
              onBlur={() => setParam("gr_reason", grReasonInput.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setParam("gr_reason", grReasonInput.trim());
                }
              }}
              placeholder="e.g. sexual_content"
              className={inputClass}
            />
          </label>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Low confidence:</span>
            <FilterSelect
              value={lowConf}
              onChange={(val) => setParam("low_conf", val)}
              options={[
                { value: "any", label: "any" },
                { value: "true", label: "true" },
                { value: "false", label: "false" },
              ]}
              srLabel="Low confidence"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>maxScore:</span>
            <FilterSelect
              value={score}
              onChange={(val) => setParam("score", val)}
              options={[
                { value: "any", label: "any" },
                { value: "lt0.25", label: "< 0.25" },
                { value: "lt0.5", label: "< 0.5" },
                { value: "0.25-0.5", label: "0.25–0.5" },
                { value: "0.5-0.75", label: "0.5–0.75" },
                { value: "gte0.75", label: "≥ 0.75" },
              ]}
              srLabel="Max score"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Archetype:</span>
            <FilterSelect
              value={archetype}
              onChange={(val) => setParam("archetype", val)}
              options={[
                { value: "any", label: "any" },
                ...CANONICAL_ARCHETYPE_ORDER.map((a) => ({ value: a, label: a })),
              ]}
              srLabel="Archetype"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <label className={controlRowClass}>
            <span className={inlineLabelClass}>Model:</span>
            <input
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              onBlur={() => setParam("model", modelInput.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setParam("model", modelInput.trim());
                }
              }}
              placeholder="e.g. gpt-4.1-mini"
              className={inputClass}
            />
          </label>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Used gateway:</span>
            <FilterSelect
              value={gateway}
              onChange={(val) => setParam("gateway", val)}
              options={[
                { value: "any", label: "any" },
                { value: "true", label: "true" },
                { value: "false", label: "false" },
              ]}
              srLabel="Used gateway"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>QA status:</span>
            <FilterSelect
              value={qa}
              onChange={(val) => setParam("qa", val)}
              options={[
                { value: "any", label: "any" },
                { value: "open", label: "open" },
                { value: "resolved", label: "resolved" },
                { value: "none", label: "none" },
              ]}
              srLabel="QA status"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Rerank:</span>
            <FilterSelect
              value={rerank}
              onChange={(val) => setParam("rerank", val)}
              options={[
                { value: "any", label: "any" },
                { value: "true", label: "enabled" },
                { value: "false", label: "disabled" },
              ]}
              srLabel="Rerank"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Confidence:</span>
            <FilterSelect
              value={snapped}
              onChange={(val) => setParam("snapped", val)}
              options={[
                { value: "any", label: "any" },
                { value: "true", label: "snapped" },
                { value: "false", label: "mixed" },
              ]}
              srLabel="Confidence"
              fullWidth={controlSelectFullWidth}
            />
          </div>

          <div className={controlRowClass}>
            <span className={inlineLabelClass}>Margin &lt;</span>
            <FilterSelect
              value={marginLt}
              onChange={(val) => setParam("margin_lt", val)}
              options={[
                { value: "any", label: "any" },
                { value: "0.08", label: "0.08" },
                { value: "0.12", label: "0.12" },
                { value: "0.20", label: "0.20" },
              ]}
              srLabel="Margin less than"
              fullWidth={controlSelectFullWidth}
            />
          </div>
        </div>
      </details>
    </>
  );

  if (isSidebar) {
    return (
      <div className={cn("space-y-3", className)}>
        <Disclosure defaultOpen>
          {({ open }) => (
            <div className="space-y-3">
              <Disclosure.Button className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3 py-3 text-left shadow-sm transition hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-foreground/80">
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Filters</p>
                    <p className="text-[11px] text-muted-foreground">
                      Env/endpoint/time window scope analytics.
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-180" : "rotate-0")}
                  aria-hidden="true"
                />
              </Disclosure.Button>

              <Disclosure.Panel className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Filters apply to analytics and logs.</p>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>

                {chipsBlock}
                {controls}
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className={headerLayout}>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Filters</h2>
          <p className="text-xs text-muted-foreground">
            Env/endpoint/time window scope analytics. Advanced filters + search apply to the log viewer.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted/20 hover:text-foreground",
            isSidebar && "w-full sm:w-auto",
          )}
        >
          Reset
        </button>
      </div>

      {chipsBlock}

      {controls}
    </div>
  );
}

export function FiltersBar({ defaultDays }: { defaultDays: number }) {
  return (
    <section id="filters" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6">
      <PgptInsightsFiltersPanel defaultDays={defaultDays} />
    </section>
  );
}
