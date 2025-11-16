"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";

export interface SerialLookupSuccess {
  serial: number;
  year: number;
  proofCode: string;
  matchType: "primary" | "model";
  model: string | null;
  range: {
    start: number;
    end?: number;
  };
}

export type SerialLookupFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; data: SerialLookupSuccess };

export type SerialLookupAction = (
  prevState: SerialLookupFormState,
  formData: FormData,
) => Promise<SerialLookupFormState>;

const initialState: SerialLookupFormState = { status: "idle" };

type SerialLookupProps = {
  lookupAction: SerialLookupAction;
};

export function SerialLookup({ lookupAction }: SerialLookupProps) {
  const analyticsRef = useAnalyticsObserver("SerialLookupSeen");
  const [serial, setSerial] = useState("");
  const [state, formAction] = useActionState(lookupAction, initialState);
  const errorId = state.status === "error" ? "serial-lookup-error" : undefined;

  return (
    <section
      ref={analyticsRef}
      data-analytics-id="SerialLookupSeen"
      className="space-y-6 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
      aria-labelledby="serial-lookup-heading"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
          Heritage Record
        </p>
        <h2 id="serial-lookup-heading" className="text-2xl font-semibold text-ink">
          Discover When Your Story Began
        </h2>
        <p className="text-base text-ink-muted md:text-lg">
          Enter the serial number engraved on your receiver. We’ll consult the Perazzi archives and reveal the year your shotgun was born—and the proof mark that sealed its place in history.
        </p>
      </div>
      <form action={formAction} className="space-y-4" noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-medium text-ink" htmlFor="serial-input">
            Serial Number
            <input
              id="serial-input"
              name="serial"
              inputMode="numeric"
              pattern="[0-9]*"
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              className={cn(
                "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-ink",
                "placeholder:text-ink-muted focus:border-perazzi-red focus:outline-none focus:ring-2 focus:ring-perazzi-red/40",
              )}
              aria-describedby={errorId}
            />
          </label>
          <LookupSubmitButton />
        </div>
        {state.status === "error" ? (
          <p id="serial-lookup-error" className="text-sm text-perazzi-red">
            {state.message}
          </p>
        ) : null}
        <LookupResult state={state} />
      </form>
    </section>
  );
}

function LookupSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Tracing Lineage…" : "Reveal Record"}
    </Button>
  );
}

function LookupResult({ state }: { state: SerialLookupFormState }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <p className="text-sm text-ink-muted" aria-live="polite">
        Consulting the archives…
      </p>
    );
  }

  if (state.status === "idle") {
    return (
      <p className="text-sm text-ink-muted" aria-live="polite">
        Your Perazzi’s origin story will appear here when its number is entered.
      </p>
    );
  }

  if (state.status === "error") {
    return null;
  }

  const { data } = state;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 md:p-6" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">
        Record Found
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-ink">{data.year}</h3>
      <p className="text-sm text-ink-muted">Proof Code: {data.proofCode}</p>
      <dl className="mt-4 space-y-1 text-sm text-ink-muted">
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-ink">Serial</dt>
          <dd>{data.serial.toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-ink">Production Range:</dt>
          <dd>
            {data.range.start.toLocaleString()}–
            {data.range.end ? data.range.end.toLocaleString() : "present"}
          </dd>
        </div>
        {data.model ? (
          <div className="flex items-center justify-between">
            <dt className="font-semibold text-ink">Model Lineage:</dt>
            <dd>{data.model}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
