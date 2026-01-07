"use client";

import Image from "next/image";
import { createPortal } from "react-dom";

import {
  buildChoreoPresenceVars,
  choreoDistance,
  choreoDurations,
  dreamyPace,
  type ChoreoPresenceState,
} from "@/lib/choreo";
import { ChoreoGroup, ChoreoPresence, Heading, Text } from "@/components/ui";

import type { ModelDetail } from "./DisciplineRailData";

type DisciplineRailModelModalProps = {
  readonly model: ModelDetail | null;
  readonly isVisible: boolean;
  readonly modalPresence: ChoreoPresenceState;
  readonly modalRoot: HTMLElement | null;
  readonly onRequestClose: () => void;
};

export function DisciplineRailModelModal({
  model,
  isVisible,
  modalPresence,
  modalRoot,
  onRequestClose,
}: DisciplineRailModelModalProps) {
  if (!modalRoot || !isVisible || !model) return null;

  const overlayPresenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.textMs,
    exitDurationMs: choreoDurations.short,
    enterEase: dreamyPace.easing,
    enterScale: 1,
    exitScale: 1,
    enterY: 0,
    exitY: 0,
  });
  const modalPresenceVars = buildChoreoPresenceVars({
    enterDurationMs: dreamyPace.enterMs,
    exitDurationMs: choreoDurations.short,
    enterEase: dreamyPace.easing,
    enterScale: 0.98,
    exitScale: 0.98,
    enterY: 0,
    exitY: 0,
  });

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <ChoreoPresence
        state={modalPresence}
        style={overlayPresenceVars}
        asChild
      >
        <div
          className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"
          aria-hidden
        />
      </ChoreoPresence>
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-default border-0 bg-transparent"
        aria-label="Close modal"
        onClick={onRequestClose}
      />
      <ChoreoPresence
        state={modalPresence}
        style={modalPresenceVars}
        asChild
      >
        <div className="relative z-20 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-perazzi-black/90 text-white shadow-elevated ring-1 ring-white/15 backdrop-blur-xl">
          <button
            type="button"
            className="type-button absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-white shadow-soft backdrop-blur-sm hover:border-white/30 hover:bg-black/55 focus-ring sm:right-5 sm:top-5"
            onClick={onRequestClose}
          >
            Close
          </button>

          <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[3fr,1.6fr]">
            <div className="group card-media relative aspect-16/10 w-full overflow-hidden rounded-3xl bg-white">
              {model.imageUrl ? (
                <Image
                  src={model.imageUrl}
                  alt={model.imageAlt || model.name}
                  fill
                  className="object-contain bg-white"
                  sizes="(min-width: 1024px) 70vw, 100vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-600">No Image Available</div>
              )}
              <div className="absolute inset-x-0 bottom-6 flex flex-col gap-2 px-6 text-black">
                <Text size="label-tight" className="text-perazzi-red">
                  {model.grade}
                </Text>
                <Heading
                  level={2}
                  size="xl"
                  className="text-black"
                >
                  {model.name}
                </Heading>
                <Text size="sm" className="text-black/70">
                  {model.use}
                </Text>
              </div>
            </div>
            <ChoreoGroup
              effect="slide"
              axis="x"
              direction="right"
              distance={choreoDistance.tight}
              durationMs={dreamyPace.textMs}
              easing={dreamyPace.easing}
              staggerMs={dreamyPace.staggerMs}
              className="grid gap-4 rounded-3xl border border-white/12 bg-black/35 p-4 shadow-soft ring-1 ring-white/10 backdrop-blur-sm sm:p-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Detail label="Platform" value={model.platform} />
              <Detail label="Gauge" value={model.gaugeNames?.join(", ")} />
              <Detail label="Trigger Type" value={model.triggerTypes?.join(", ")} />
              <Detail label="Trigger Springs" value={model.triggerSprings?.join(", ")} />
              <Detail label="Rib Type" value={model.ribTypes?.join(", ")} />
              <Detail label="Rib Style" value={model.ribStyles?.join(", ")} />
            </ChoreoGroup>
          </div>
        </div>
      </ChoreoPresence>
    </div>,
    modalRoot,
  );
}

function Detail({ label, value }: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <Text size="label-tight" className="text-perazzi-red">
        {label}
      </Text>
      <Text size="sm" className="text-white">
        {value || "—"}
      </Text>
    </div>
  );
}
