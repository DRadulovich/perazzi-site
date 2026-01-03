"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button, Container, Heading, Input, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ExpandableSection } from "../ExpandableSection";
import {
  SplitChars,
  mergeSpec,
  type DeepPartial,
  type ExpandableMotionSpec,
} from "../expandable-section-motion";
import { SECTION_IDS, getSectionSpec, type ExpandableSectionId } from "../expandable-section-registry";

type Control = {
  label: string;
  path: string;
  min: number;
  max: number;
  step: number;
};

const CONTROLS: Control[] = [
  { label: "Expand time scale", path: "timeScale.expand", min: 0.6, max: 1.6, step: 0.05 },
  { label: "Collapse time scale", path: "timeScale.collapse", min: 0.3, max: 1, step: 0.05 },
  { label: "Header reveal", path: "timing.expand.headerExpandedIn", min: 0.1, max: 0.6, step: 0.02 },
  { label: "Main reveal", path: "timing.expand.mainIn", min: 0.1, max: 0.7, step: 0.02 },
  { label: "Main exit", path: "timing.collapse.mainOut", min: 0.08, max: 0.5, step: 0.02 },
  { label: "Content offset", path: "distance.contentY", min: 0, max: 40, step: 1 },
  { label: "Scrim converge", path: "distance.scrimY", min: 0, max: 40, step: 1 },
  { label: "Item stagger", path: "stagger.expand.items", min: 0, max: 0.12, step: 0.01 },
  { label: "Stagger max", path: "stagger.expand.maxTotal", min: 0.1, max: 0.7, step: 0.05 },
];

const updateNested = (
  current: DeepPartial<ExpandableMotionSpec>,
  path: string,
  value: number,
) => {
  const keys = path.split(".");
  if (keys.some((key) => key === "__proto__" || key === "constructor" || key === "prototype")) {
    return current;
  }

  const next = Object.assign(Object.create(null), current) as Record<string, unknown>;
  let node = next;
  keys.slice(0, -1).forEach((key) => {
    const currentValue = node[key];
    const nextNode = currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
      ? Object.assign(Object.create(null), currentValue as Record<string, unknown>)
      : Object.create(null);
    node[key] = nextNode;
    node = nextNode as Record<string, unknown>;
  });
  const lastKey = keys.at(-1);
  if (!lastKey) return current;
  node[lastKey] = value;
  return next as DeepPartial<ExpandableMotionSpec>;
};

const formatSnippet = (sectionId: string, override: DeepPartial<ExpandableMotionSpec>) => {
  const body = JSON.stringify(override, null, 2);
  return `{
  "${sectionId}": ${body.replaceAll("\n", "\n  ")}
}`;
};

export default function MotionPlayground() {
  const [sectionId, setSectionId] = useState<ExpandableSectionId>(SECTION_IDS[0]);
  const [override, setOverride] = useState<DeepPartial<ExpandableMotionSpec>>({});
  const [copied, setCopied] = useState(false);

  const baseSpec = useMemo(() => getSectionSpec(sectionId), [sectionId]);
  const resolvedSpec = useMemo(
    () => mergeSpec(baseSpec, override),
    [baseSpec, override],
  );
  const snippet = useMemo(
    () => formatSnippet(sectionId, override),
    [override, sectionId],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-neutral-950 to-neutral-900 text-white">
      <Container size="xl" className="py-12 space-y-10">
        <div className="space-y-2">
          <Text size="label-tight" className="text-white/60">
            Expandable Section Motion System
          </Text>
          <Heading level={1} size="xl" className="text-white">
            Motion Playground
          </Heading>
          <Text size="lg" className="text-white/70 max-w-3xl">
            Tweak the motion spec and preview how the ESMS timeline behaves. Copy overrides
            to paste into the registry.
          </Text>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur">
            <div className="space-y-2">
              <Text size="label-tight" className="text-white/60">Section</Text>
              <select
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value as ExpandableSectionId)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus-ring"
              >
                {SECTION_IDS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            <div className="space-y-5">
              {CONTROLS.map((control) => {
                const currentValue = control.path
                  .split(".")
                  .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], resolvedSpec) as number;
                return (
                  <div key={control.path} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{control.label}</span>
                      <span className="text-white/90 tabular-nums">{currentValue.toFixed(2)}</span>
                    </div>
                    <Input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={currentValue}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setOverride((prev) => updateNested(prev, control.path, nextValue));
                      }}
                      className="accent-perazzi-red"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => setOverride({})}
              >
                Reset overrides
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="rounded-full"
                onClick={handleCopy}
              >
                {copied ? "Copied" : "Copy overrides"}
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70 overflow-auto">
              <pre>{snippet}</pre>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-white/70">
              <Text size="label-tight" className="text-white/60">Resolved spec</Text>
              <pre className="mt-3 text-xs overflow-auto max-h-[360px]">
                {JSON.stringify(resolvedSpec, null, 2)}
              </pre>
            </div>

            <ExpandableSection
              key={sectionId}
              sectionId={sectionId}
              defaultExpanded={false}
              runtimeSpecOverride={override}
              className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-black/40"
            >
              {({
                getTriggerProps,
                getCloseProps,
                layoutProps,
                contentVisible,
                isExpanded,
                reducedMotion,
                spec,
                bodyId,
              }) => {
                const title = "Motion System";
                const canSplit =
                  !reducedMotion &&
                  spec.text.enableCharReveal &&
                  title.length <= spec.text.maxCharsForCharReveal;

                return (
                  <div className="relative min-h-[360px]">
                    <div className="absolute inset-0 -z-10">
                      <div
                        data-es="bg"
                        className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7f1d1d,#1b0c0c_60%,#050505)]"
                      />
                      <div
                        data-es="scrim-bottom"
                        className="absolute inset-0 bg-black/55"
                        aria-hidden
                      />
                      <div
                        data-es="scrim-top"
                        className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent"
                        aria-hidden
                      />
                    </div>

                    <motion.div {...layoutProps} className="relative min-h-[360px] p-6">
                      <div
                        data-es="glass"
                        className="relative flex flex-col gap-6 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-elevated backdrop-blur-md"
                      >
                        {contentVisible ? (
                          <>
                            <div
                              data-es="header-expanded"
                              className="flex flex-wrap items-start justify-between gap-4"
                            >
                              <div className="space-y-2">
                                <Heading level={2} size="lg" className="text-white">
                                  <SplitChars text={title} enabled={canSplit} />
                                </Heading>
                                <Text size="lg" className="text-white/70">
                                  Tunable choreography across shared slots.
                                </Text>
                              </div>
                              <Button
                                {...getCloseProps()}
                                data-es="close"
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="rounded-full"
                              >
                                Close
                              </Button>
                            </div>

                            <div data-es="meta" className="flex flex-wrap gap-2">
                              {["Spec", "Timeline", "Slots"].map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/70"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>

                            <div data-es="main" className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                <Text size="label-tight" className="text-white/60">
                                  Primary Visual
                                </Text>
                                <div className="mt-3 h-28 rounded-xl bg-white/10" />
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                <Text size="label-tight" className="text-white/60">
                                  Supporting Card
                                </Text>
                                <div className="mt-3 h-28 rounded-xl bg-white/10" />
                              </div>
                            </div>

                            <div data-es="body" id={bodyId} className="space-y-3">
                              <Text className="text-white/70">
                                The ESMS timeline reveals content in sequenced beats, with
                                adjustable easing, staggering, and distances.
                              </Text>
                              <Text className="text-white/70">
                                Reduced motion keeps transitions near-instant and skips
                                decorative choreography.
                              </Text>
                            </div>

                            <ul data-es="list" className="space-y-2">
                              {["Scrims converge", "Glass enters", "Content reveals"].map((item) => (
                                <li
                                  key={item}
                                  data-es="item"
                                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/70"
                                >
                                  {item}
                                </li>
                              ))}
                            </ul>

                            <div data-es="cta" className="flex flex-wrap gap-3">
                              <Button variant="primary" size="sm" className="rounded-full">
                                Primary action
                              </Button>
                              <Button variant="secondary" size="sm" className="rounded-full">
                                Secondary action
                              </Button>
                            </div>
                          </>
                        ) : null}
                      </div>

                      <div
                        data-es="header-collapsed"
                        className={cn(
                          "absolute inset-0 flex flex-col items-center justify-center gap-3 text-center",
                          isExpanded && "pointer-events-none",
                        )}
                        aria-hidden={isExpanded}
                      >
                        <Heading level={2} size="lg" className="text-white">
                          {title}
                        </Heading>
                        <Text size="lg" className="text-white/70">
                          Click to preview the full choreography.
                        </Text>
                        <div className="flex items-center gap-3">
                          <Button
                            {...getTriggerProps({ kind: "cta" })}
                            type="button"
                            variant="primary"
                            size="sm"
                            className="rounded-full"
                          >
                            Read more
                          </Button>
                        </div>
                        <button
                          {...getTriggerProps({ kind: "header", withHover: true })}
                          type="button"
                          className="absolute inset-0"
                          aria-label="Expand motion preview"
                        />
                      </div>
                    </motion.div>
                  </div>
                );
              }}
            </ExpandableSection>
          </div>
        </div>
      </Container>
    </div>
  );
}
