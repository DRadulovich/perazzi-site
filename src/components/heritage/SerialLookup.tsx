"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";

import { Button, Heading, Input, Text } from "@/components/ui";
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
          className="absolute inset-0 bg-(--scrim-hard)"
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
        <div className="space-y-6 rounded-2xl border border-perazzi-black/50 bg-card/0 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:border-perazzi-black/50 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10">
          <div className="space-y-2">
            <Heading
              id="serial-lookup-heading"
              level={2}
              size="xl"
              className="font-black uppercase italic tracking-[0.35em] text-white"
            >
              {heading}
            </Heading>
            <Text className="font-light italic text-white/70" leading="relaxed">
              {subheading}
            </Text>
            <Text className="text-white/70 md:text-lg">
              {instructions}
            </Text>
          </div>
          <form action={formAction} className="space-y-4" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium text-white" htmlFor="serial-input">
                <span className="block">Serial Number</span>
                <Input
                  id="serial-input"
                  name="serial"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={serial}
                  onChange={(event) => { setSerial(event.target.value); }}
                  className={cn(
                    "mt-2 border-perazzi-black/50 bg-white/25 px-4 py-3 text-sm sm:text-base text-white",
                    "placeholder:text-white/70 focus:border-perazzi-red",
                  )}
                  aria-describedby={errorId}
                />
              </label>
              <LookupSubmitButton label={primaryButtonLabel} />
            </div>
            {state.status === "error" ? (
              <Text
                asChild
                className="text-perazzi-red"
                leading="normal"
              >
                <p id="serial-lookup-error">{state.message}</p>
              </Text>
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
      <Text asChild className="text-white/70" leading="normal">
        <p aria-live="polite">Consulting the archives...</p>
      </Text>
    );
  }

  if (state.status === "idle") {
    return (
      <Text asChild className="text-white/70" leading="normal">
        <p aria-live="polite">{emptyStateText}</p>
      </Text>
    );
  }

  if (state.status === "error") {
    return null;
  }

  const { data } = state;
  return (
    <div className="rounded-2xl border border-perazzi-black/50 bg-perazzi-black/40 p-4 shadow-soft sm:bg-perazzi-black/70 md:p-6" aria-live="polite">
      <Text size="xs" className="font-semibold tracking-[0.35em] text-white/70" leading="normal">
        Record Found
      </Text>
      <Heading level={3} size="xl" className="mt-2 text-white">
        {data.year}
      </Heading>
      <Text className="text-white/70" leading="normal">
        Proof Code: {data.proofCode}
      </Text>
      <dl className="mt-4 space-y-1 text-sm text-white/70">
        <div className="flex items-center justify-between">
          <Text asChild className="font-semibold text-white" leading="normal">
            <dt>Serial</dt>
          </Text>
          <Text asChild className="text-white/70" leading="normal">
            <dd>{data.serial.toLocaleString()}</dd>
          </Text>
        </div>
        <div className="flex items-center justify-between">
          <Text asChild className="font-semibold text-white" leading="normal">
            <dt>Production Range:</dt>
          </Text>
          <Text asChild className="text-white/70" leading="normal">
            <dd>
              {data.range.start.toLocaleString()}-
              {data.range.end ? data.range.end.toLocaleString() : "present"}
            </dd>
          </Text>
        </div>
        {data.model ? (
          <div className="flex items-center justify-between">
            <Text asChild className="font-semibold text-white" leading="normal">
              <dt>Model Lineage:</dt>
            </Text>
            <Text asChild className="text-white/70" leading="normal">
              <dd>{data.model}</dd>
            </Text>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
