"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import type { SerialLookupUi } from "@/types/heritage";

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
  readonly lookupAction: SerialLookupAction;
  readonly ui: SerialLookupUi;
};

export function SerialLookup({ lookupAction, ui }: SerialLookupProps) {
  const analyticsRef = useAnalyticsObserver("SerialLookupSeen");
  const [serial, setSerial] = useState("");
  const [state, formAction] = useActionState(lookupAction, initialState);
  const errorId = state.status === "error" ? "serial-lookup-error" : undefined;
  const heading = ui.heading ?? "Heritage Record";
  const subheading = ui.subheading ?? "Discover when your story began";
  const instructions =
    ui.instructions ??
    "Enter the serial number engraved on your receiver. We'll consult the Perazzi archives and reveal the year your shotgun was born and the proof mark that sealed its place in history.";
  const primaryButtonLabel = ui.primaryButtonLabel ?? "Reveal Record";
  const emptyStateText =
    ui.emptyStateText ?? "Your Perazzi's origin story will appear here when its number is entered.";
  const backgroundSrc = ui.backgroundImage?.url ?? "/cinematic_background_photos/p-web-2.jpg";
  const backgroundAlt = ui.backgroundImage?.alt ?? "Perazzi champions background";

  return (
    <section
      id="heritage-serial-lookup"
      ref={analyticsRef}
      data-analytics-id="SerialLookupSeen"
      className="relative isolate w-screen max-w-[100vw] min-h-[75vh] overflow-hidden py-10 sm:py-16"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
      aria-labelledby="serial-lookup-heading"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={backgroundSrc}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          className="object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-[color:var(--scrim-hard)]"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--color-black) 24%, transparent) 0%, color-mix(in srgb, var(--color-black) 6%, transparent) 50%, color-mix(in srgb, var(--color-black) 24%, transparent) 100%), " +
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-black) 100%, transparent) 0%, transparent 75%), " +
              "linear-gradient(to top, color-mix(in srgb, var(--color-black) 100%, transparent) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 lg:px-10">
        <div className="space-y-6 rounded-2xl border border-perazzi-black/50 bg-card/0 p-4 shadow-sm backdrop-blur-sm sm:rounded-3xl sm:border-perazzi-black/50 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-lg lg:px-10">
          <div className="space-y-2">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-[0.35em] text-white">
              {heading}
            </p>
            <h2
              id="serial-lookup-heading"
              className="text-sm sm:text-base font-light italic leading-relaxed text-white/70"
            >
              {subheading}
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/70">
              {instructions}
            </p>
          </div>
          <form action={formAction} className="space-y-4" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium text-white" htmlFor="serial-input">
                <span className="block">Serial Number</span>
                <input
                  id="serial-input"
                  name="serial"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={serial}
                  onChange={(event) => { setSerial(event.target.value); }}
                  className={cn(
                    "mt-2 w-full rounded-xl border border-perazzi-black/50 bg-white/25 px-4 py-3 text-sm sm:text-base text-white",
                    "placeholder:text-white/70 focus:border-perazzi-red focus:outline-none focus:ring-2 focus:ring-perazzi-red/40",
                  )}
                  aria-describedby={errorId}
                />
              </label>
              <LookupSubmitButton label={primaryButtonLabel} />
            </div>
            {state.status === "error" ? (
              <p id="serial-lookup-error" className="text-sm text-perazzi-red">
                {state.message}
              </p>
            ) : null}
            <LookupResult state={state} emptyStateText={emptyStateText} />
          </form>
        </div>
      </div>
    </section>
  );
}

function LookupSubmitButton({ label }: Readonly<{ label: string }>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Tracing Lineage..." : label}
    </Button>
  );
}

function LookupResult({ state, emptyStateText }: Readonly<{ state: SerialLookupFormState; emptyStateText: string }>) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <p className="text-sm text-white/70" aria-live="polite">
        Consulting the archives...
      </p>
    );
  }

  if (state.status === "idle") {
    return (
      <p className="text-sm text-white/70" aria-live="polite">
        {emptyStateText}
      </p>
    );
  }

  if (state.status === "error") {
    return null;
  }

  const { data } = state;
  return (
    <div className="rounded-2xl border border-perazzi-black/50 bg-perazzi-black/40 p-4 shadow-sm sm:bg-perazzi-black/70 md:p-6" aria-live="polite">
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
        Record Found
      </p>
      <h3 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
        {data.year}
      </h3>
      <p className="text-sm text-white/70">Proof Code: {data.proofCode}</p>
      <dl className="mt-4 space-y-1 text-sm text-white/70">
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-white">Serial</dt>
          <dd>{data.serial.toLocaleString()}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-white">Production Range:</dt>
          <dd>
            {data.range.start.toLocaleString()}-
            {data.range.end ? data.range.end.toLocaleString() : "present"}
          </dd>
        </div>
        {data.model ? (
          <div className="flex items-center justify-between">
            <dt className="font-semibold text-white">Model Lineage:</dt>
            <dd>{data.model}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
