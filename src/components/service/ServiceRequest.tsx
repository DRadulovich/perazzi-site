"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ChangeEvent, type FormEvent } from "react";
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

const MotionSection = motion.create(Section);

const ERROR_MESSAGE = "Enter a valid email so we can reply.";

const getMotionSettings = (enabled: boolean) => {
  if (!enabled) {
    return {
      section: { initial: false },
      header: { initial: false },
      embed: { initial: false },
      form: { initial: false },
      error: { initial: false, animate: { opacity: 1, y: 0 } },
    };
  }

  return {
    section: {
      initial: { opacity: 0, y: 24, filter: "blur(10px)" },
      whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
      viewport: { once: true, amount: 0.35 },
      transition: homeMotion.reveal,
    },
    header: {
      initial: { opacity: 0, y: 14, filter: "blur(10px)" },
      whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
      viewport: { once: true, amount: 0.6 },
      transition: homeMotion.revealFast,
    },
    embed: {
      initial: { opacity: 0, y: 12, filter: "blur(10px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, y: -10, filter: "blur(8px)" },
      transition: homeMotion.revealFast,
    },
    form: {
      initial: { opacity: 0, y: 12, filter: "blur(10px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, y: -10, filter: "blur(8px)" },
      transition: homeMotion.revealFast,
    },
    error: {
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
      transition: homeMotion.micro,
    },
  };
};

type MotionSettings = ReturnType<typeof getMotionSettings>;

type ServiceRequestEmbedProps = {
  readonly embedSrc: string;
  readonly title: string;
  readonly motionProps: MotionSettings["embed"];
};

function ServiceRequestEmbed({ embedSrc, title, motionProps }: ServiceRequestEmbedProps) {
  return (
    <motion.div
      {...motionProps}
      className="relative overflow-hidden rounded-2xl border border-border"
    >
      <iframe src={embedSrc} title={`${title} form`} className="h-[520px] w-full" loading="lazy" />
      <div className="pointer-events-none absolute inset-0 film-grain opacity-12" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />
    </motion.div>
  );
}

type ServiceRequestFormProps = {
  readonly buttonLabel: string;
  readonly email: string;
  readonly error: string;
  readonly motionProps: MotionSettings["form"];
  readonly errorMotionProps: MotionSettings["error"];
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function ServiceRequestForm({
  buttonLabel,
  email,
  error,
  motionProps,
  errorMotionProps,
  onSubmit,
  onEmailChange,
}: ServiceRequestFormProps) {
  return (
    <motion.form className="space-y-3" {...motionProps} onSubmit={onSubmit}>
      <label className="flex flex-col type-label-tight text-ink">
        <span>Contact email</span>
        <Input type="email" value={email} onChange={onEmailChange} className="mt-1" required />
      </label>
      <Button type="submit" variant="primary">
        {buttonLabel}
      </Button>
      <AnimatePresence>
        {error ? (
          <motion.div key="error" {...errorMotionProps}>
            <Text asChild size="sm" className="text-perazzi-red">
              <output aria-live="polite">{error}</output>
            </Text>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.form>
  );
}

const isValidEmail = (value: string) => value.trim().includes("@");

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
  const motionSettings = getMotionSettings(motionEnabled);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError(ERROR_MESSAGE);
      return;
    }
    setError("");
    setOpen(true);
    logAnalytics(analyticsOpenId);
  };

  return (
    <MotionSection
      ref={analyticsRef}
      data-analytics-id={`${analyticsOpenId}Seen`}
      padding="md"
      className="group relative space-y-3 overflow-hidden"
      {...motionSettings.section}
    >
      <div className="pointer-events-none absolute inset-0 film-grain opacity-10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 glint-sweep" aria-hidden="true" />

      <motion.div className="space-y-2" {...motionSettings.header}>
        <Heading level={2} size="xl" className="text-ink">
          {title}
        </Heading>
        <Text size="md" muted>
          {description}
        </Text>
      </motion.div>

      <AnimatePresence mode="wait">
        {open ? (
          <ServiceRequestEmbed
            key="embed"
            embedSrc={embedSrc}
            title={title}
            motionProps={motionSettings.embed}
          />
        ) : (
          <ServiceRequestForm
            key="form"
            buttonLabel={buttonLabel}
            email={email}
            error={error}
            motionProps={motionSettings.form}
            errorMotionProps={motionSettings.error}
            onSubmit={handleSubmit}
            onEmailChange={handleEmailChange}
          />
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
