"use client";

import { Fragment, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Option = Readonly<{ value: string; label: string }>;

type FilterSelectProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  srLabel?: string;
  className?: string;
  id?: string;
}>;

function FilterSelect({
  value,
  onChange,
  options,
  srLabel,
  className,
  id,
}: FilterSelectProps) {
  const current = options.find((o) => o.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <div className={cn("relative w-full min-w-[140px]", className)}>
        <ListboxButton
          id={id}
          className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm transition hover:border-border/80 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="truncate">{current?.label ?? value}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {srLabel ? <span className="sr-only">{srLabel}</span> : null}
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-1"
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
        >
          <ListboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card text-sm shadow-xl focus:outline-none">
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ focus }) =>
                  cn(
                    "flex cursor-pointer items-center justify-between gap-3 px-3 py-2",
                    focus ? "bg-muted/60 text-foreground" : "text-muted-foreground",
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className={cn("truncate", selected && "font-semibold text-foreground")}>{option.label}</span>
                    {selected ? <Check className="h-4 w-4 text-blue-500" aria-hidden="true" /> : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}

function getBrowserWindow(): (Window & typeof globalThis) | null {
  return globalThis.window ?? null;
}

export function ArchetypeFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const pendingScrollRef = useRef<number | null>(null);

  const get = (k: string) => searchParams.get(k) ?? "";

  const winnerChanged = get("winner_changed") || "any";
  const marginLt = get("margin_lt") || "any";
  const scoreArchetype = get("score_archetype") || "any";
  const min = get("min") || "0.40";

  function replaceParams(next: URLSearchParams) {
    const qs = next.toString();
    const baseHref = qs ? `${pathname}?${qs}` : pathname;
    const browserWindow = getBrowserWindow();
    const hash = browserWindow ? browserWindow.location.hash : "";

    if (browserWindow) {
      pendingScrollRef.current = browserWindow.scrollY;
    }

    router.replace(`${baseHref}${hash}`, { scroll: false });
  }

  useEffect(() => {
    if (pendingScrollRef.current === null) return;
    const browserWindow = getBrowserWindow();
    if (browserWindow === null) return;
    const y = pendingScrollRef.current;
    pendingScrollRef.current = null;
    browserWindow.requestAnimationFrame(() => browserWindow.scrollTo({ top: y }));
  }, [searchParamsKey]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    const v = String(value ?? "").trim();

    const anyKeys = new Set(["winner_changed", "margin_lt", "score_archetype"]);
    if (v) next.set(key, v);
    else next.delete(key);

    if (anyKeys.has(key) && v === "any") next.delete(key);
    if (key === "score_archetype" && v === "any") next.delete("min");

    next.delete("page");
    replaceParams(next);
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-6 space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Archetype Diagnostics</h2>
        <p className="text-xs text-muted-foreground">Query archetype behavior via logged distributions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 text-sm">
          <span className="block text-xs text-muted-foreground">Winner changed</span>
          <FilterSelect
            value={winnerChanged}
            onChange={(v) => setParam("winner_changed", v)}
            id="pgpt-winner-changed"
            options={[
              { value: "any", label: "any" },
              { value: "true", label: "true" },
            ]}
            srLabel="Winner changed"
          />
        </div>

        <div className="space-y-1 text-sm">
          <span className="block text-xs text-muted-foreground">Margin &lt;</span>
          <FilterSelect
            value={marginLt}
            onChange={(v) => setParam("margin_lt", v)}
            id="pgpt-margin-lt"
            options={[
              { value: "any", label: "any" },
              { value: "0.08", label: "0.08" },
              { value: "0.12", label: "0.12" },
              { value: "0.20", label: "0.20" },
            ]}
            srLabel="Margin less than"
          />
        </div>

        <div className="space-y-1 text-sm">
          <span className="block text-xs text-muted-foreground">Archetype score</span>
          <FilterSelect
            value={scoreArchetype}
            onChange={(v) => {
              setParam("score_archetype", v);
              if (v === "any") setParam("min", "");
            }}
            id="pgpt-score-archetype"
            options={[
              { value: "any", label: "any" },
              { value: "Loyalist", label: "Loyalist" },
              { value: "Prestige", label: "Prestige" },
              { value: "Analyst", label: "Analyst" },
              { value: "Achiever", label: "Achiever" },
              { value: "Legacy", label: "Legacy" },
            ]}
            srLabel="Archetype score"
          />
        </div>

        {scoreArchetype === "any" ? null : (
          <div className="space-y-1 text-sm">
            <span className="block text-xs text-muted-foreground">≥ min</span>
            <FilterSelect
              value={min}
              onChange={(v) => setParam("min", v)}
              id="pgpt-score-min"
              options={[
                { value: "0.20", label: "0.20" },
                { value: "0.30", label: "0.30" },
                { value: "0.40", label: "0.40" },
                { value: "0.50", label: "0.50" },
                { value: "0.60", label: "0.60" },
              ]}
              srLabel="Minimum archetype score"
            />
          </div>
        )}
      </div>
    </section>
  );
}
