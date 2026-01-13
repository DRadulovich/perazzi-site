"use client";

import Image from "next/image";
import Link from "next/link";
import conciergeImage from "@/../docs/BIGCOMMERCE/Background-Images/concierge-image.jpg";
import { Button, Heading, RevealAnimatedBody, RevealGroup, RevealItem, Text } from "@/components/ui";

type ShopConciergePanelProps = Readonly<{
  eyebrow: string;
  heading: string;
  body: string;
  steps: Array<{ title: string; body: string }>;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}>;

export function ShopConciergePanel({
  eyebrow,
  heading,
  body,
  steps,
  primaryCta,
  secondaryCta,
}: ShopConciergePanelProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/55 p-5 shadow-elevated ring-1 ring-white/10 backdrop-blur-xl sm:rounded-3xl"
      aria-labelledby="shop-concierge-heading"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={conciergeImage.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-ink-30" aria-hidden="true" />
      </div>

      <RevealAnimatedBody sequence className="space-y-6">
        <RevealItem index={0}>
          <Text size="label-tight" className="text-white/70">
            {eyebrow}
          </Text>
        </RevealItem>

        <RevealItem index={1}>
          <div className="space-y-3">
            <Heading id="shop-concierge-heading" level={2} size="md" className="text-white">
              {heading}
            </Heading>
            <Text size="sm" className="text-white/75" leading="relaxed">
              {body}
            </Text>
          </div>
        </RevealItem>

        <RevealGroup delayMs={140} className="space-y-3">
          {steps.map((step, index) => (
            <RevealItem key={step.title} index={index}>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
                <Text size="label-tight" className="text-white/60">
                  Step {index + 1}
                </Text>
                <Heading level={3} size="sm" className="mt-2 text-white">
                  {step.title}
                </Heading>
                <Text size="sm" className="mt-1 text-white/70" leading="relaxed">
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
            <Button asChild size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
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
