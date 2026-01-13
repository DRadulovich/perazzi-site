"use client";

import Link from "next/link";
import conciergeImage from "@/../docs/BIGCOMMERCE/Background-Images/concierge-image.jpg";
import {
  Button,
  Container,
  Heading,
  RevealAnimatedBody,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
} from "@/components/ui";

const steps = [
  {
    title: "Tell us your discipline",
    body: "Share the events you shoot and your timing needs so we can narrow the right components.",
  },
  {
    title: "Confirm your fit profile",
    body: "Send your measurements or past build notes and we will align stock and balance options.",
  },
  {
    title: "Book a workshop session",
    body: "Secure a concierge slot and receive a dealer-ready brief with availability and pricing.",
  },
];

const ctas = {
  primary: { label: "Open the concierge", href: "/concierge" },
  secondary: { label: "Explore bespoke fitting", href: "/bespoke" },
};

export function ShopConciergePanel() {
  return (
    <section
      className="relative isolate w-screen max-w-[100vw] full-bleed"
      aria-labelledby="shop-concierge-heading"
    >
      <SectionBackdrop
        image={{
          url: conciergeImage.src,
          alt: "Perazzi concierge preparing a fitting dossier",
        }}
        reveal
        revealOverlay
        enableParallax
        overlay="ink-50"
        loading="lazy"
      />

      <Container size="xl" className="relative z-10 py-12 sm:py-16">
        <SectionShell reveal className="space-y-8">
          <RevealAnimatedBody sequence className="space-y-8">
            <RevealItem index={0}>
              <Text size="label-tight" muted>
                Concierge guidance
              </Text>
            </RevealItem>

            <RevealItem index={1}>
              <div className="space-y-3">
                <Heading id="shop-concierge-heading" level={2} size="lg">
                  Build a shop brief with Botticino
                </Heading>
                <Text size="md" className="max-w-3xl" leading="relaxed">
                  Tell us what you shoot and how you like your gun to move. We will align
                  availability with fit, balance, and scheduling before you place the order.
                </Text>
              </div>
            </RevealItem>

            <RevealGroup delayMs={140} className="grid gap-4 lg:grid-cols-3">
              {steps.map((step, index) => (
                <RevealItem key={step.title} index={index}>
                  <div className="h-full rounded-2xl border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur-sm">
                    <Text size="label-tight" muted>
                      Step {index + 1}
                    </Text>
                    <Heading level={3} size="sm" className="mt-2">
                      {step.title}
                    </Heading>
                    <Text size="sm" className="mt-2 text-ink-muted" leading="relaxed">
                      {step.body}
                    </Text>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <RevealItem index={2}>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="md">
                  <Link href={ctas.primary.href} prefetch={false}>
                    {ctas.primary.label}
                  </Link>
                </Button>
                <Button asChild size="md" variant="secondary">
                  <Link href={ctas.secondary.href} prefetch={false}>
                    {ctas.secondary.label}
                  </Link>
                </Button>
              </div>
            </RevealItem>
          </RevealAnimatedBody>
        </SectionShell>
      </Container>
    </section>
  );
}
