"use client";

import type { TextVerbosity } from "@/types/perazzi-assistant";

type VerbosityToggleProps = Readonly<{
  value: TextVerbosity;
  onChange: (verbosity: TextVerbosity) => void;
  disabled?: boolean;
}>;

const OPTIONS: ReadonlyArray<{ value: TextVerbosity; label: string; title: string }> = [
  { value: "low", label: "Concise", title: "Short, direct answers" },
  { value: "medium", label: "Normal", title: "Balanced detail (recommended)" },
  { value: "high", label: "Detailed", title: "More structure, depth, and nuance" },
];

export function VerbosityToggle({ value, onChange, disabled = false }: VerbosityToggleProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Verbosity</legend>
      <span className="type-label-tight text-ink-muted">Verbosity</span>
      <div
        className="inline-flex items-center rounded-full border border-border bg-card/70 p-1 shadow-soft backdrop-blur-sm"
        role="radiogroup"
        aria-label="Verbosity"
        aria-disabled={disabled}
      >
        {OPTIONS.map((option) => (
          <label key={option.value} className="cursor-pointer select-none">
            <input
              type="radio"
              name="pgpt-verbosity"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only peer"
            />
            <span
              className={[
                "block rounded-full px-3 py-1 type-label-tight transition",
                "text-ink-muted hover:bg-subtle",
                "peer-checked:bg-ink peer-checked:text-card peer-checked:shadow-soft",
                "peer-focus-visible:outline peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
              ].join(" ")}
              title={option.title}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
