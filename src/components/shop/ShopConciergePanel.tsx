"use client";

import Image from "next/image";
import Link from "next/link";
import conciergeImage from "@/../docs/BIGCOMMERCE/Background-Images/concierge-image.jpg";
import { Button, Heading, RevealAnimatedBody, RevealGroup, RevealItem, Text } from "@/components/ui";
import { cn } from "@/lib/utils";

type ShopConciergePanelProps = Readonly<{
  eyebrow: string;
  heading: string;
  body: string;
  steps: Array<{ title: string; body: string }>;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  variant?: "panel" | "embedded" | "strip";
  className?: string;
}>;

export function ShopConciergePanel({
  eyebrow,
  heading,
  body,
  steps,
  primaryCta,
  secondaryCta,
  variant = "panel",
  className,
}: ShopConciergePanelProps) {
  if (variant === "strip") {
    return (
      <div
        className={cn("grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]", className)}
        aria-labelledby="shop-concierge-heading"
      >
        <RevealAnimatedBody sequence className="space-y-6">
          <RevealItem index={0}>
            <Text size="label-tight" className="text-ink-muted">
              {eyebrow}
            </Text>
          </RevealItem>

          <RevealItem index={1}>
            <div className="space-y-3">
              <Heading id="shop-concierge-heading" level={2} size="lg" className="text-ink">
                {heading}
              </Heading>
              <Text size="md" className="text-ink-muted" leading="relaxed">
                {body}
              </Text>
            </div>
          </RevealItem>

          <RevealItem index={2}>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="md">
                <Link href={primaryCta.href} prefetch={false}>
                  {primaryCta.label}
                </Link>
              </Button>
              <Button asChild size="md" variant="secondary">
                <Link href={secondaryCta.href} prefetch={false}>
                  {secondaryCta.label}
                </Link>
              </Button>
            </div>
          </RevealItem>
        </RevealAnimatedBody>

        <RevealGroup delayMs={160} className="space-y-3">
          {steps.map((step, index) => (
            <RevealItem key={step.title} index={index}>
              <div className="rounded-2xl border border-border/70 bg-canvas/45 px-4 py-3 shadow-soft backdrop-blur-sm">
                <Text size="label-tight" className="text-ink-muted">
                  Step {index + 1}
                </Text>
                <Heading level={3} size="sm" className="mt-2 text-ink">
                  {step.title}
                </Heading>
                <Text size="sm" className="mt-1 text-ink-muted" leading="relaxed">
                  {step.body}
                </Text>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative",
        variant === "panel"
          ? "overflow-hidden rounded-2xl border border-border/70 bg-card/75 p-5 shadow-elevated backdrop-blur-xl sm:rounded-3xl"
          : "p-0",
        className,
      )}
      aria-labelledby="shop-concierge-heading"
    >
      {variant === "panel" ? (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <Image
            src={conciergeImage.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 420px, 100vw"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-(--scrim-strong)" />
          <div className="pointer-events-none absolute inset-0 overlay-gradient-canvas-80" aria-hidden="true" />
        </div>
      ) : null}

      <RevealAnimatedBody sequence className="space-y-6">
        <RevealItem index={0}>
          <Text size="label-tight" className="text-ink-muted">
            {eyebrow}
          </Text>
        </RevealItem>

        <RevealItem index={1}>
          <div className="space-y-3">
            <Heading id="shop-concierge-heading" level={2} size="md" className="text-ink">
              {heading}
            </Heading>
            <Text size="sm" className="text-ink-muted" leading="relaxed">
              {body}
            </Text>
          </div>
        </RevealItem>

        <RevealGroup delayMs={140} className="space-y-3">
          {steps.map((step, index) => (
            <RevealItem key={step.title} index={index}>
              <div className="rounded-2xl border border-border/70 bg-canvas/45 px-4 py-3 shadow-soft backdrop-blur-sm">
                <Text size="label-tight" className="text-ink-muted">
                  Step {index + 1}
                </Text>
                <Heading level={3} size="sm" className="mt-2 text-ink">
                  {step.title}
                </Heading>
                <Text size="sm" className="mt-1 text-ink-muted" leading="relaxed">
                  {step.body}
                </Text>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <RevealItem index={2}>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href={primaryCta.href} prefetch={false}>
                {primaryCta.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={secondaryCta.href} prefetch={false}>
                {secondaryCta.label}
              </Link>
            </Button>
          </div>
        </RevealItem>
      </RevealAnimatedBody>
    </div>
  );
}
