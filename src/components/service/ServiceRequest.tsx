"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Button, Heading, Input, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";
import { homeMotion } from "@/lib/motionConfig";

type RequestProps = {
  readonly title: string;
  readonly description: string;
  readonly buttonLabel: string;
  readonly embedSrc: string;
  readonly fallbackHref: string;
  readonly analyticsOpenId: string;
  readonly fallbackLinkLabel?: string;
};

const MotionSection = motion(Section);

export function ServiceRequest({
  title,
  description,
  buttonLabel,
  embedSrc,
  fallbackHref,
  analyticsOpenId,
  fallbackLinkLabel,
}: RequestProps) {
  const analyticsRef = useAnalyticsObserver(`${analyticsOpenId}Seen`);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id={`${analyticsOpenId}Seen`}
      padding="md"
      className="group relative space-y-3 overflow-hidden"
      initial={motionEnabled ? { opacity: 0, y: 24, filter: "blur(10px)" } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      viewport={motionEnabled ? { once: true, amount: 0.35 } : undefined}
      transition={motionEnabled ? homeMotion.reveal : undefined}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div
        className="space-y-2"
        initial={motionEnabled ? { opacity: 0, y: 14, filter: "blur(10px)" } : false}
        whileInView={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
        viewport={motionEnabled ? { once: true, amount: 0.6 } : undefined}
        transition={motionEnabled ? homeMotion.revealFast : undefined}
      >
        <Heading level={2} size="xl" className="text-ink">
          {title}
        </Heading>
        <Text size="md" muted>
          {description}
        </Text>
      </motion.div>

      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="embed"
            initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
            animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            exit={motionEnabled ? { opacity: 0, y: -10, filter: "blur(8px)" } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
            className="relative overflow-hidden rounded-2xl border border-border"
          >
            <iframe
              src={embedSrc}
              title={`${title} form`}
              className="h-[520px] w-full"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className="space-y-3"
            initial={motionEnabled ? { opacity: 0, y: 12, filter: "blur(10px)" } : false}
            animate={motionEnabled ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
            exit={motionEnabled ? { opacity: 0, y: -10, filter: "blur(8px)" } : undefined}
            transition={motionEnabled ? homeMotion.revealFast : undefined}
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.includes("@")) {
                setError("Enter a valid email so we can reply.");
                return;
              }
              setError("");
              setOpen(true);
              logAnalytics(analyticsOpenId);
            }}
          >
            <label className="flex flex-col type-label-tight text-ink">
              <span>Contact email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); }}
                className="mt-1"
                required
              />
            </label>
            <Button type="submit" variant="primary">
              {buttonLabel}
            </Button>
            <AnimatePresence>
              {error ? (
                <motion.div
                  key="error"
                  initial={motionEnabled ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={motionEnabled ? { opacity: 0, y: -6 } : undefined}
                  transition={motionEnabled ? homeMotion.micro : undefined}
                >
                  <Text asChild size="sm" className="text-perazzi-red">
                    <output aria-live="polite">{error}</output>
                  </Text>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
      <Text size="sm" muted>
        Prefer email?{" "}
        <a
          href={fallbackHref}
          target="_blank"
          rel="noreferrer"
          className="text-perazzi-red focus-ring"
        >
          {fallbackLinkLabel ?? "Open the request form"}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Text>
    </MotionSection>
  );
}
