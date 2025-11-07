"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="space-y-3 rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-sm sm:px-10">
      <h2 className="text-2xl font-semibold text-ink">Stay in the loop</h2>
      <p className="text-sm text-ink-muted">
        Receive new stories, interviews, and news straight from Botticino.
      </p>
      {submitted ? (
        <p className="text-sm text-perazzi-red" aria-live="polite">
          Thank you—check your inbox for confirmation.
        </p>
      ) : (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            console.log("SubscribeSubmit", email);
            setSubmitted(true);
          }}
        >
          <label className="flex-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm text-ink focus-ring"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-perazzi-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white focus-ring"
          >
            Subscribe
          </button>
        </form>
      )}
    </section>
  );
}
