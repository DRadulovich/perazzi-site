/* eslint-disable @next/next/no-img-element */
"use client";

import clsx from "clsx";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { useEffect, useMemo, useState } from "react";

import { urlFor } from "@/sanity/lib/image";

type SpecList = string[] | undefined;

export type ModelSearchRow = {
  _id: string;
  name: string;
  version?: string;
  platform?: string;
  use?: string | null;
  grade?: string;
  gaugeNames?: string[];
  triggerTypes?: string[];
  triggerSprings?: string[];
  ribTypes?: string[];
  ribStyles?: string[];
  image?: SanityImageSource | null;
  imageAlt?: string;
};

type ModelShowcaseProps = {
  models: ModelSearchRow[];
};

export function ModelSearchTable({ models }: ModelShowcaseProps) {
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [gaugeFilter, setGaugeFilter] = useState<string | null>(null);
  const [useFilter, setUseFilter] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelSearchRow | null>(null);

  useEffect(() => {
    if (!selectedModel) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedModel(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedModel]);

  const platformOptions = useMemo(
    () => Array.from(new Set(models.map((m) => m.platform).filter(Boolean))) as string[],
    [models],
  );
  const gaugeOptions = useMemo(() => {
    const flat = models.flatMap((m) => m.gaugeNames || []);
    return Array.from(new Set(flat));
  }, [models]);
  const useOptions = useMemo(
    () => Array.from(new Set(models.map((m) => m.use).filter(Boolean))) as string[],
    [models],
  );

  const filteredModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return models.filter((model) => {
      if (needle) {
        const haystack = [
          model.name,
          model.version,
          model.platform,
          model.use,
          model.grade,
          (model.gaugeNames || []).join(" "),
          (model.triggerTypes || []).join(" "),
          (model.triggerSprings || []).join(" "),
          (model.ribTypes || []).join(" "),
          (model.ribStyles || []).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (platformFilter && model.platform !== platformFilter) return false;
      if (useFilter && model.use !== useFilter) return false;
      if (gaugeFilter && !(model.gaugeNames || []).includes(gaugeFilter)) return false;
      return true;
    });
  }, [models, platformFilter, useFilter, gaugeFilter, query]);

  return (
    <section className="mt-10 space-y-8">
      <div className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-950/90 to-neutral-900/70 p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex w-full items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm text-neutral-300 focus-within:border-white">
            <span className="text-neutral-500">Search</span>
            <input
              type="search"
              placeholder="Search models, gauges, triggers..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-base text-white placeholder:text-neutral-600 focus:outline-none"
            />
          </label>
          <p className="text-sm text-neutral-400">
            Showing <span className="font-semibold text-white">{filteredModels.length}</span> of
            <span className="font-semibold text-white"> {models.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <FilterGroup
            label="Platform"
            options={platformOptions}
            value={platformFilter}
            onChange={setPlatformFilter}
          />
          <FilterGroup
            label="Gauge"
            options={gaugeOptions}
            value={gaugeFilter}
            onChange={setGaugeFilter}
          />
          <FilterGroup
            label="Use"
            options={useOptions}
            value={useFilter}
            onChange={setUseFilter}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredModels.map((model) => (
          <button
            key={model._id}
            onClick={() => setSelectedModel(model)}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/80 text-left shadow-2xl shadow-black/40 transition hover:-translate-y-1 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-3xl bg-white">
              {model.image ? (
                <Image
                  src={urlFor(model.image).width(2400).quality(90).url()}
                  alt={model.imageAlt || model.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-neutral-900 text-neutral-600">
                  No Image Available
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-black">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-perazzi-red">
                  {model.use}
                </p>
                <h3 className="text-2xl font-semibold leading-tight">{model.name}</h3>
                <p className="text-sm text-neutral-600">{model.version}</p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 bg-black/40 px-6 py-5 text-sm text-neutral-200 sm:grid-cols-2">
              <Spec label="Platform" value={model.platform} />
              <Spec label="Gauge" value={(model.gaugeNames || []).join(", ") || undefined} />
              <Spec label="Trigger" value={(model.triggerTypes || []).join(", ") || undefined} />
              <Spec label="Springs" value={(model.triggerSprings || []).join(", ") || undefined} />
              <Spec label="Rib" value={(model.ribTypes || []).join(", ") || undefined} />
              <Spec label="Rib Style" value={(model.ribStyles || []).join(", ") || undefined} />
              <Spec label="Grade" value={model.grade} />
            </div>
          </button>
        ))}
        {filteredModels.length === 0 && (
          <p className="col-span-full rounded-3xl border border-dashed border-white/20 py-16 text-center text-neutral-500">
            No models match your current filters.
          </p>
        )}
      </div>

      {selectedModel ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedModel(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/10 bg-neutral-950/95 text-white shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-5 top-5 z-10 rounded-full border border-white/30 px-4 py-1 text-sm uppercase tracking-widest text-white/80 hover:border-white hover:text-white"
              onClick={() => setSelectedModel(null)}
            >
              Close
            </button>

            <div className="flex flex-col gap-6 p-6 lg:flex-row">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-white lg:w-4/5">
                {selectedModel.image ? (
                  <Image
                    src={urlFor(selectedModel.image).width(3200).quality(95).url()}
                    alt={selectedModel.imageAlt || selectedModel.name}
                    fill
                    sizes="(min-width: 1024px) 80vw, 100vw"
                    className="object-contain bg-white"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">
                    No Image Available
                  </div>
                )}
                <div className="absolute bottom-6 left-6 right-6 text-black">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-perazzi-red">
                    {selectedModel.use}
                  </p>
                  <h2 className="text-4xl font-semibold leading-tight">{selectedModel.name}</h2>
                  <p className="text-sm text-neutral-300">{selectedModel.version}</p>
                </div>
              </div>

              <div className="flex-1 space-y-5 rounded-3xl border border-white/10 bg-black/40 p-6">
                <DetailGrid label="Platform" value={selectedModel.platform} />
                <DetailGrid
                  label="Gauge"
                  value={(selectedModel.gaugeNames || []).join(", ") || undefined}
                />
                <DetailGrid
                  label="Trigger Type"
                  value={renderList(selectedModel.triggerTypes)}
                />
                <DetailGrid
                  label="Trigger Springs"
                  value={renderList(selectedModel.triggerSprings)}
                />
                <DetailGrid label="Rib Type" value={renderList(selectedModel.ribTypes)} />
                <DetailGrid label="Rib Style" value={renderList(selectedModel.ribStyles)} />
                <DetailGrid label="Use" value={selectedModel.use || undefined} />
                <DetailGrid label="Grade" value={selectedModel.grade || undefined} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="flex items-center gap-3 overflow-auto">
      <span className="text-sm uppercase tracking-[0.3em] text-neutral-500">{label}</span>
      <div className="flex gap-2">
        <FilterChip active={!value} label="All" onClick={() => onChange(null)} />
        {options.map((option) => (
          <FilterChip
            key={option}
            active={value === option}
            label={option}
            onClick={() => onChange(value === option ? null : option)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-full px-4 py-1 text-xs uppercase tracking-widest transition",
        active
          ? "bg-white text-black"
          : "border border-white/20 bg-transparent text-white/70 hover:border-white/60",
      )}
    >
      {label}
    </button>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-perazzi-red">
        {label}
      </p>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}

function DetailGrid({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-perazzi-red">
        {label}
      </p>
      <p className="text-lg text-white">{value || "—"}</p>
    </div>
  );
}

function renderList(list: SpecList) {
  if (!list || !list.length) return undefined;
  return list.join(", ");
}
