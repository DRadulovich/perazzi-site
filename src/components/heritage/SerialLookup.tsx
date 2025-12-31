"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button, Heading, Input, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { cn } from "@/lib/utils";
import type { SerialLookupUi } from "@/types/heritage";
import { homeMotion } from "@/lib/motionConfig";

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
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
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
      className="relative isolate w-screen max-w-[100vw] min-h-[75vh] overflow-hidden py-10 sm:py-16 full-bleed scroll-mt-24"
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
        <div className="pointer-events-none absolute inset-0 film-grain opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 overlay-gradient-ink" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 lg:px-10">
        <motion.div
          className="group relative isolate space-y-6 overflow-hidden rounded-2xl border border-perazzi-black/50 bg-card/0 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:border-perazzi-black/50 sm:bg-card/0 sm:px-6 sm:py-8 sm:shadow-elevated lg:px-10"
          initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(12px)" }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={reduceMotion ? undefined : { once: true, amount: 0.55 }}
          transition={reduceMotion ? undefined : homeMotion.reveal}
        >
          <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          <div className="space-y-2">
            <Heading
              id="serial-lookup-heading"
              level={2}
              size="xl"
              className="text-white"
            >
              {heading}
            </Heading>
            <Text className="type-section-subtitle text-white/70">
              {subheading}
            </Text>
            <Text className="type-body text-white/70">
              {instructions}
            </Text>
          </div>
          <form action={formAction} className="space-y-4" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 font-serif-petite-caps text-white text-xl" htmlFor="serial-input">
                <span className="block">Serial Number</span>
                <Input
                  id="serial-input"
                  name="serial"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={serial}
                  onChange={(event) => { setSerial(event.target.value); }}
                  className={cn(
                    "mt-2 border-perazzi-black/50 bg-white/25 px-4 py-3 type-body-sm text-white",
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
              >
                <p id="serial-lookup-error">{state.message}</p>
              </Text>
            ) : null}
            <LookupResult state={state} emptyStateText={emptyStateText} />
          </form>
        </motion.div>
      </div>
    </section>
  );
}

function LookupSubmitButton({ label }: Readonly<{ label: string }>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="type-button text-ink min-h-12" disabled={pending}>
      {pending ? "Tracing Lineage..." : label}
    </Button>
  );
}

function LookupResult({ state, emptyStateText }: Readonly<{ state: SerialLookupFormState; emptyStateText: string }>) {
  const { pending } = useFormStatus();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <AnimatePresence mode="wait">
      {pending ? (
        <motion.div
          key="pending"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={reduceMotion ? undefined : homeMotion.micro}
        >
          <Text asChild className="type-section-subtitle text-white/70">
            <p aria-live="polite">Consulting the archives...</p>
          </Text>
        </motion.div>
      ) : state.status === "idle" ? (
        <motion.div
          key="idle"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={reduceMotion ? undefined : homeMotion.micro}
        >
          <Text asChild className="type-section-subtitle text-white/70">
            <p aria-live="polite">{emptyStateText}</p>
          </Text>
        </motion.div>
      ) : state.status === "error" ? null : (
        <motion.div
          key="success"
          className="relative isolate overflow-hidden rounded-2xl border border-perazzi-black/50 bg-perazzi-black/40 p-4 shadow-soft sm:bg-perazzi-black/70 md:p-6"
          initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(10px)" }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={reduceMotion ? undefined : homeMotion.revealFast}
          aria-live="polite"
        >
          <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

          <Text size="label-tight" className="text-white/70">
            Record Found
          </Text>
          <Heading level={3} size="xl" className="mt-2 text-white">
            {state.data.year}
          </Heading>
          <Text size="sm" className="text-white/70">
            Proof Code: {state.data.proofCode}
          </Text>
          <dl className="mt-4 space-y-1 type-body-sm text-white/70">
            <div className="flex items-center justify-between">
              <Text asChild size="sm" className="type-nav text-white">
                <dt>Serial</dt>
              </Text>
              <Text asChild size="sm" className="text-white/70">
                <dd>{state.data.serial.toLocaleString()}</dd>
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text asChild size="sm" className="type-nav text-white">
                <dt>Production Range:</dt>
              </Text>
              <Text asChild size="sm" className="text-white/70">
                <dd>
                  {state.data.range.start.toLocaleString()}-
                  {state.data.range.end ? state.data.range.end.toLocaleString() : "present"}
                </dd>
              </Text>
            </div>
            {state.data.model ? (
              <div className="flex items-center justify-between">
                <Text asChild size="sm" className="type-nav text-white">
                  <dt>Model Lineage:</dt>
                </Text>
                <Text asChild size="sm" className="text-white/70">
                  <dd>{state.data.model}</dd>
                </Text>
              </div>
            ) : null}
          </dl>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
