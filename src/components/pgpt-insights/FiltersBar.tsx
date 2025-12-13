"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CANONICAL_ARCHETYPE_ORDER } from "../../lib/pgpt-insights/constants";

type Chip = { key: string; label: string; onRemove: () => void };

function safeLabel(value: string, max = 36) {
  const s = String(value ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function FiltersBar({ defaultDays }: { defaultDays: number }) {
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
          key === "qa") &&
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
    defaultDays,
  ]);

  return (
    <section id="filters" className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">Filters</h2>
          <p className="text-xs text-muted-foreground">
            Env/endpoint/time window scope analytics. Advanced filters + search apply to the log viewer.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted/20 hover:text-foreground"
        >
          Reset
        </button>
      </div>

      {chips.length > 0 ? (
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
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="text-sm">
          Env:
          <select
            value={env}
            onChange={(e) => setParam("env", e.target.value)}
            className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="all">all</option>
            <option value="local">local</option>
            <option value="preview">preview</option>
            <option value="production">production</option>
          </select>
        </label>

        <label className="text-sm">
          Endpoint:
          <select
            value={endpoint}
            onChange={(e) => setParam("endpoint", e.target.value)}
            className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="all">all</option>
            <option value="assistant">assistant</option>
            <option value="soul_journey">soul_journey</option>
          </select>
        </label>

        <label className="text-sm">
          Time window:
          <select
            value={days}
            onChange={(e) => setParam("days", e.target.value)}
            className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="7">last 7 days</option>
            <option value={String(defaultDays)}>{`last ${defaultDays} days`}</option>
            <option value="90">last 90 days</option>
            <option value="all">all time</option>
          </select>
        </label>

        <label className="text-sm">
          Density:
          <select
            value={density}
            onChange={(e) => setParam("density", e.target.value)}
            className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="comfortable">comfortable</option>
            <option value="compact">compact</option>
          </select>
        </label>

        <label className="text-sm">
          View:
          <select
            value={view}
            onChange={(e) => setParam("view", e.target.value)}
            className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="full">full</option>
            <option value="triage">triage</option>
          </select>
        </label>

        <label className="text-sm">
          Search logs:
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search prompts/responses…"
            className="ml-2 h-9 w-[320px] max-w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <details className="group rounded-xl border border-border bg-background p-3">
        <summary className="cursor-pointer list-none text-xs text-muted-foreground [&::-webkit-details-marker]:hidden">
          <span className="font-medium text-foreground">Advanced</span>{" "}
          <span className="ml-2 text-muted-foreground">guardrails · QA · score · model/archetype</span>
        </summary>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-sm">
            Guardrail status:
            <select
              value={grStatus}
              onChange={(e) => setParam("gr_status", e.target.value)}
              className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="any">any</option>
              <option value="blocked">blocked</option>
              <option value="not_blocked">not blocked</option>
            </select>
          </label>

          <label className="text-sm">
            Guardrail reason:
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
              className="ml-2 h-9 w-[240px] max-w-full rounded-md border bg-background px-3 text-sm"
            />
          </label>

          <label className="text-sm">
            Low confidence:
            <select
              value={lowConf}
              onChange={(e) => setParam("low_conf", e.target.value)}
              className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="any">any</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>

          <label className="text-sm">
            maxScore:
            <select
              value={score}
              onChange={(e) => setParam("score", e.target.value)}
              className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="any">any</option>
              <option value="lt0.25">&lt; 0.25</option>
              <option value="lt0.5">&lt; 0.5</option>
              <option value="0.25-0.5">0.25–0.5</option>
              <option value="0.5-0.75">0.5–0.75</option>
              <option value="gte0.75">≥ 0.75</option>
            </select>
          </label>

          <label className="text-sm">
            Archetype:
            <select
              value={archetype}
              onChange={(e) => setParam("archetype", e.target.value)}
              className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="any">any</option>
              {CANONICAL_ARCHETYPE_ORDER.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Model:
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
              className="ml-2 h-9 w-[220px] max-w-full rounded-md border bg-background px-3 text-sm"
            />
          </label>

          <label className="text-sm">
            Used gateway:
            <select
              value={gateway}
              onChange={(e) => setParam("gateway", e.target.value)}
              className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="any">any</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>

          <label className="text-sm">
            QA status:
            <select
              value={qa}
              onChange={(e) => setParam("qa", e.target.value)}
              className="ml-2 h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="any">any</option>
              <option value="open">open</option>
              <option value="resolved">resolved</option>
              <option value="none">none</option>
            </select>
          </label>
        </div>
      </details>
    </section>
  );
}
