"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <section
      ref={analyticsRef}
      data-analytics-id={`${analyticsOpenId}Seen`}
      className="space-y-3 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-muted">{description}</p>
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
          <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-ink">
            <span>Contact email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); }}
              className="mt-1 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
              required
            />
          </label>
          <Button type="submit" variant="primary">
            {buttonLabel}
          </Button>
          <output className="text-xs text-perazzi-red" aria-live="polite">
            {error}
          </output>
        </form>
      )}
      <p className="text-xs text-ink-muted">
        Prefer email?{" "}
        <a
          href={fallbackHref}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-perazzi-red focus-ring"
        >
          {fallbackLinkLabel ?? "Open the request form"}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </section>
  );
}
