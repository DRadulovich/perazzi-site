"use client";

import { useState } from "react";
import { logAnalytics } from "@/lib/analytics";
import { Button, Heading, Input, Text } from "@/components/ui";
import { useSiteSettings } from "@/components/site-settings-context";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { journalUi } = useSiteSettings();
  const newsletter = journalUi?.newsletter;
  const heading = newsletter?.heading ?? "Stay in the loop";
  const body = newsletter?.body ?? "Receive new stories, interviews, and news straight from Botticino.";
  const inputLabel = newsletter?.inputLabel ?? "Email";
  const inputPlaceholder = newsletter?.inputPlaceholder ?? "you@example.com";
  const submitLabel = newsletter?.submitLabel ?? "Subscribe";
  const successMessage = newsletter?.successMessage ?? "Thank you—check your inbox for confirmation.";

  return (
    <section className="space-y-3 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-soft sm:px-10">
      <Heading level={2} size="xl" className="text-ink">
        {heading}
      </Heading>
      <Text size="md" muted>
        {body}
      </Text>
      {submitted ? (
        <Text size="md" className="text-perazzi-red" aria-live="polite">
          {successMessage}
        </Text>
      ) : (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            logAnalytics("SubscribeSubmit");
            setSubmitted(true);
          }}
        >
          <label className="flex flex-1 flex-col type-label-tight text-ink">
            <span>{inputLabel}</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => { setEmail(event.target.value); }}
              className="mt-1"
              placeholder={inputPlaceholder}
            />
          </label>
          <Button type="submit" size="sm">
            {submitLabel}
          </Button>
        </form>
      )}
    </section>
  );
}
