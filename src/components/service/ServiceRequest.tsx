"use client";

import { useState } from "react";
import { Button, Heading, Input, Section, Text } from "@/components/ui";
import { useAnalyticsObserver } from "@/hooks/use-analytics-observer";
import { logAnalytics } from "@/lib/analytics";

type RequestProps = {
  readonly title: string;
  readonly description: string;
  readonly buttonLabel: string;
  readonly embedSrc: string;
  readonly fallbackHref: string;
  readonly analyticsOpenId: string;
  readonly fallbackLinkLabel?: string;
};

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

  return (
    <Section
      ref={analyticsRef}
      data-analytics-id={`${analyticsOpenId}Seen`}
      padding="md"
      className="space-y-3"
    >
      <div className="space-y-2">
        <Heading level={2} size="xl" className="text-ink">
          {title}
        </Heading>
        <Text size="md" muted>
          {description}
        </Text>
      </div>
      {open ? (
        <iframe
          src={embedSrc}
          title={`${title} form`}
          className="h-[520px] w-full rounded-2xl border border-border"
          loading="lazy"
        />
      ) : (
        <form
          className="space-y-3"
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
          <Text asChild size="sm" className="text-perazzi-red">
            <output aria-live="polite">{error}</output>
          </Text>
        </form>
      )}
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
    </Section>
  );
}
