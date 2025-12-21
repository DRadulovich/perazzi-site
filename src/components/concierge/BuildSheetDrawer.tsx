"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { FiChevronUp } from "react-icons/fi";

type BuildSheetEntry = { id: string; label: string; value: string };
type BuildSheetDetails = {
  description?: string;
  platform?: string | null;
  grade?: string | null;
  gauges?: string[];
  triggerTypes?: string[];
  recommendedPlatforms?: string[];
  popularModels?: string[];
  imageUrl?: string | null;
  fullImageUrl?: string | null;
};

export type SavedBuild = {
  id: string;
  name: string;
  timestamp: number;
};

type EntryWithDetails = BuildSheetEntry & { details?: BuildSheetDetails };

type BuildSheetDrawerProps = Readonly<{
  open: boolean;
  entries: ReadonlyArray<EntryWithDetails>;
  onClose?: () => void;
  onRevisit?: (fieldId: string) => void;
  onSave?: () => void;
  savedBuilds?: ReadonlyArray<SavedBuild>;
  onLoadSaved?: (id: string) => void;
  onDeleteSaved?: (id: string) => void;
}>;

type BuildSheetEntryCardProps = Readonly<{
  entry: EntryWithDetails;
  editMode: boolean;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  onClose?: () => void;
  onRevisit?: (fieldId: string) => void;
}>;

type DetailLine = { id: string; text: string; label?: string; isDescription?: boolean };

type BuildSheetDrawerContentProps = Readonly<{
  entries: ReadonlyArray<EntryWithDetails>;
  onClose?: () => void;
  onRevisit?: (fieldId: string) => void;
  onSave?: () => void;
  savedBuilds: ReadonlyArray<SavedBuild>;
  onLoadSaved?: (id: string) => void;
  onDeleteSaved?: (id: string) => void;
}>;

const formatDetailLines = (details?: BuildSheetDetails): DetailLine[] => {
  if (!details) return [];

  const labeledLines = [
    { id: "platform", label: "Platform", value: details.platform },
    { id: "grade", label: "Grade", value: details.grade },
    { id: "gauges", label: "Gauges", value: details.gauges?.join(", ") },
    { id: "triggerTypes", label: "Trigger types", value: details.triggerTypes?.join(", ") },
    { id: "recommendedPlatforms", label: "Recommended platforms", value: details.recommendedPlatforms?.join(", ") },
    { id: "popularModels", label: "Popular models", value: details.popularModels?.join(", ") },
  ].filter((line) => Boolean(line.value));

  const detailLines = labeledLines.map(
    (line) => ({ id: line.id, label: line.label, text: line.value as string }) satisfies DetailLine,
  );

  return details.description
    ? [{ id: "description", text: details.description, isDescription: true }, ...detailLines]
    : detailLines;
};

function BuildSheetEntryCard({
  entry,
  editMode,
  isCollapsed,
  onToggle,
  onClose,
  onRevisit,
}: BuildSheetEntryCardProps) {
  const hasDetails = Boolean(entry.details);
  const isExpanded = hasDetails && !isCollapsed;
  const handleClick = () => {
    if (editMode && onRevisit) {
      onRevisit(entry.id);
      onClose?.();
      return;
    }
    if (hasDetails) {
      onToggle(entry.id);
    }
  };

  const imageUrl = entry.details?.fullImageUrl ?? entry.details?.imageUrl;
  const detailLines = formatDetailLines(entry.details);

  return (
    <li>
      <button
        type="button"
        className={clsx(
          "w-full rounded-2xl border border-subtle/60 bg-card px-3 py-2 text-left transition focus-ring",
          editMode ? "cursor-pointer hover:border-ink hover:shadow-sm" : "",
        )}
        onClick={handleClick}
        aria-expanded={hasDetails ? isExpanded : undefined}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold">{entry.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">{entry.value}</span>
              {hasDetails ? (
                <FiChevronUp
                  className={clsx(
                    "text-perazzi-red transition-transform",
                    isExpanded ? "rotate-0" : "rotate-180",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>
          {isExpanded ? (
            <div className="space-y-2">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={entry.label}
                  width={1600}
                  height={1000}
                  className="w-full max-h-48 rounded-lg object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              ) : null}
              <div className="space-y-1 text-[11px] sm:text-xs leading-relaxed text-ink">
                {detailLines.map((detail) =>
                  detail.isDescription ? (
                    <p key={detail.id} className="text-ink">
                      {detail.text}
                    </p>
                  ) : (
                    <p key={detail.id} className="text-ink-muted">
                      {detail.label ? `${detail.label}: ${detail.text}` : detail.text}
                    </p>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </div>
      </button>
    </li>
  );
}

function BuildSheetDrawerContent({
  entries,
  onClose,
  onRevisit,
  onSave,
  savedBuilds,
  onLoadSaved,
  onDeleteSaved,
}: BuildSheetDrawerContentProps) {
  const [editMode, setEditMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const entriesWithDetails = entries.filter((entry) => entry.details);
  const allCollapsed =
    entriesWithDetails.length > 0 &&
    entriesWithDetails.every((entry) => collapsed[entry.id]);

  const handleToggleAll = () => {
    const next: Record<string, boolean> = {};
    const shouldCollapse = !allCollapsed;
    entriesWithDetails.forEach((entry) => {
      next[entry.id] = shouldCollapse;
    });
    setCollapsed((prev) => ({ ...prev, ...next }));
  };

  const handleEntryToggle = (entryId: string) => {
    setCollapsed((prev) => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-subtle px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
              Build sheet
            </p>
            <p className="text-sm sm:text-base text-ink">Selections so far</p>
          </div>
          <div className="flex items-center gap-2">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-subtle bg-card px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink focus-ring"
              >
                Close
              </button>
            ) : null}
            {onRevisit ? (
              <button
                type="button"
                onClick={() => {
                  setEditMode((prev) => !prev);
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-subtle bg-card px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink focus-ring"
              >
                {editMode ? "Done" : "Edit"}
              </button>
            ) : null}
          </div>
        </div>
        <div className="h-px w-full bg-subtle" />
        <div className="flex flex-wrap items-center gap-2">
          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-subtle bg-card px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink focus-ring"
            >
              Save build
            </button>
          ) : null}
          {entriesWithDetails.length ? (
            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-subtle bg-card px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink focus-ring"
            >
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          ) : null}
        </div>
      </div>
      {savedBuilds.length ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-4 py-3 text-[11px] sm:text-xs text-ink sm:px-6">
          <span className="text-ink-muted uppercase tracking-[0.2em]">Saved</span>
          {savedBuilds
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((build) => (
              <div
                key={build.id}
                className="flex items-center gap-1 rounded-full border border-subtle bg-card px-3 py-1"
              >
                <button
                  type="button"
                  onClick={() => onLoadSaved?.(build.id)}
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink hover:text-ink focus-ring"
                >
                  {build.name}
                </button>
                {onDeleteSaved ? (
                  <button
                    type="button"
                    onClick={() => onDeleteSaved(build.id)}
                    className="text-[11px] font-semibold text-ink-muted hover:text-red-600 focus-ring"
                    aria-label={`Delete ${build.name}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {entries.length === 0 ? (
          <p className="text-sm sm:text-base leading-relaxed text-ink-muted">
            Selections will appear here as you choose them.
          </p>
        ) : (
          <ul className="space-y-2 text-sm sm:text-base text-ink">
            {entries.map((entry) => (
              <BuildSheetEntryCard
                key={entry.id}
                entry={entry}
                editMode={editMode}
                isCollapsed={Boolean(collapsed[entry.id])}
                onToggle={handleEntryToggle}
                onClose={onClose}
                onRevisit={onRevisit}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function BuildSheetDrawer({
  open,
  entries,
  onClose,
  onRevisit,
  onSave,
  savedBuilds = [],
  onLoadSaved,
  onDeleteSaved,
}: BuildSheetDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resetKey = open ? "open" : "closed";

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    globalThis.addEventListener("keydown", handleKey);
    return () => globalThis.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className={clsx(
          "fixed inset-0 z-40 h-full w-full bg-black/30 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Close build sheet"
        onClick={() => onClose?.()}
      />
      <div
        ref={containerRef}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-xl flex-col border-r border-subtle bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        tabIndex={-1}
        aria-label="Current build sheet"
        aria-modal="true"
        role="dialog"
      >
        <BuildSheetDrawerContent
          key={resetKey}
          entries={entries}
          onClose={onClose}
          onRevisit={onRevisit}
          onSave={onSave}
          savedBuilds={savedBuilds}
          onLoadSaved={onLoadSaved}
          onDeleteSaved={onDeleteSaved}
        />
      </div>
    </>
  );
}
