"use client";

import { useState } from "react";
import { logAnalytics } from "@/lib/analytics";
import { Button, Heading, Input, Text } from "@/components/ui";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="space-y-3 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-soft sm:px-10">
      <Heading level={2} size="xl" className="text-ink">
        Stay in the loop
      </Heading>
      <Text size="md" muted>
        Receive new stories, interviews, and news straight from Botticino.
      </Text>
      {submitted ? (
        <Text size="md" className="text-perazzi-red" aria-live="polite">
          Thank you—check your inbox for confirmation.
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
            <span>Email</span>
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => { setEmail(event.target.value); }}
              className="mt-1"
              placeholder="you@example.com"
            />
          </label>
          <Button type="submit" size="sm">
            Subscribe
          </Button>
        </form>
      )}
    </section>
  );
}
