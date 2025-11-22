"use client";

import { useEffect, useRef, useState } from "react";
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

type BuildSheetDrawerProps = {
  open: boolean;
  entries: Array<BuildSheetEntry & { details?: BuildSheetDetails }>;
  onClose?: () => void;
  onRevisit?: (fieldId: string) => void;
  onSave?: () => void;
  savedBuilds?: SavedBuild[];
  onLoadSaved?: (id: string) => void;
  onDeleteSaved?: (id: string) => void;
};

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
  const [editMode, setEditMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) {
      setEditMode(false);
      setCollapsed({});
    }
  }, [open]);

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
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const entriesWithDetails = entries.filter((entry) => entry.details);
  const allCollapsed =
    entriesWithDetails.length > 0 &&
    entriesWithDetails.every((entry) => collapsed[entry.id]);

  const handleToggleAll = () => {
    const next: Record<string, boolean> = {};
    entriesWithDetails.forEach((entry) => {
      next[entry.id] = !allCollapsed ? true : false;
    });
    setCollapsed((prev) => ({ ...prev, ...next }));
  };

  return (
    <>
      <button
        type="button"
        className={clsx(
          "fixed inset-0 z-40 h-full w-full bg-black/30 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={() => onClose?.()}
      />
      <div
        ref={containerRef}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-full max-w-xl flex-col border-r border-subtle bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        tabIndex={-1}
        role="dialog"
        aria-label="Current build sheet"
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-2 border-b border-subtle px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Build sheet</p>
              <p className="text-sm text-ink">Selections so far</p>
            </div>
            <div className="flex items-center gap-2">
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-subtle bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
                >
                  Close
                </button>
              ) : null}
              {onRevisit ? (
                <button
                  type="button"
                  onClick={() => setEditMode((prev) => !prev)}
                  className="rounded-full border border-subtle bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
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
                className="rounded-full border border-subtle bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
              >
                Save build
              </button>
            ) : null}
            {entriesWithDetails.length ? (
              <button
                type="button"
                onClick={handleToggleAll}
                className="rounded-full border border-subtle bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
              >
                {allCollapsed ? "Expand all" : "Collapse all"}
              </button>
            ) : null}
          </div>
        </div>
        {savedBuilds.length ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-4 py-3 text-xs text-ink sm:px-6">
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
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink hover:text-ink"
                  >
                    {build.name}
                  </button>
                  {onDeleteSaved ? (
                    <button
                      type="button"
                      onClick={() => onDeleteSaved(build.id)}
                      className="text-[11px] font-semibold text-ink-muted hover:text-red-600"
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
            <p className="text-sm text-ink-muted">Selections will appear here as you choose them.</p>
          ) : (
            <ul className="space-y-2 text-sm text-ink">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className={clsx(
                    "rounded-2xl border border-subtle bg-card px-3 py-2 transition",
                    editMode ? "cursor-pointer hover:border-ink hover:shadow-sm" : "",
                  )}
                  onClick={() => {
                    if (editMode && onRevisit) {
                      onRevisit(entry.id);
                      onClose?.();
                      return;
                    }
                    if (entry.details) {
                      setCollapsed((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }));
                    }
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold">{entry.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-ink-muted">{entry.value}</span>
                        {entry.details ? (
                          <FiChevronUp
                            className={clsx(
                              "text-perazzi-red transition-transform",
                              collapsed[entry.id] ? "rotate-180" : "rotate-0",
                            )}
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    </div>
                    {entry.details && !collapsed[entry.id] ? (
                      <div className="space-y-2">
                        {entry.details.fullImageUrl || entry.details.imageUrl ? (
                          <img
                            src={entry.details.fullImageUrl ?? entry.details.imageUrl ?? ""}
                            alt={entry.label}
                            className="w-full max-h-48 rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="space-y-1 text-xs text-ink">
                          {entry.details.description ? <p className="text-ink">{entry.details.description}</p> : null}
                          {entry.details.platform ? (
                            <p className="text-ink-muted">Platform: {entry.details.platform}</p>
                          ) : null}
                          {entry.details.grade ? <p className="text-ink-muted">Grade: {entry.details.grade}</p> : null}
                          {entry.details.gauges?.length ? (
                            <p className="text-ink-muted">Gauges: {entry.details.gauges.join(", ")}</p>
                          ) : null}
                          {entry.details.triggerTypes?.length ? (
                            <p className="text-ink-muted">Trigger types: {entry.details.triggerTypes.join(", ")}</p>
                          ) : null}
                          {entry.details.recommendedPlatforms?.length ? (
                            <p className="text-ink-muted">
                              Recommended platforms: {entry.details.recommendedPlatforms.join(", ")}
                            </p>
                          ) : null}
                          {entry.details.popularModels?.length ? (
                            <p className="text-ink-muted">Popular models: {entry.details.popularModels.join(", ")}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
