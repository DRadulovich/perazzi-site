"use client";

import Image from "next/image";
import Link from "next/link";
import cartPanelBg from "@/../docs/BIGCOMMERCE/Background-Images/cart-page-bg.jpg";
import { Button, Heading, RevealAnimatedBody, RevealItem, Text } from "@/components/ui";

type CartConciergePanelProps = Readonly<{
  eyebrow: string;
  heading: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}>;

export function CartConciergePanel({
  eyebrow,
  heading,
  body,
  primaryCta,
  secondaryCta,
}: CartConciergePanelProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/55 p-5 shadow-elevated ring-1 ring-white/10 backdrop-blur-xl sm:rounded-3xl"
      aria-labelledby="cart-concierge-heading"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={cartPanelBg.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="pointer-events-none absolute inset-0 overlay-gradient-ink-30" aria-hidden="true" />
      </div>

      <RevealAnimatedBody sequence className="space-y-5">
        <RevealItem index={0}>
          <Text size="label-tight" className="text-white/70">
            {eyebrow}
          </Text>
        </RevealItem>
        <RevealItem index={1}>
          <div className="space-y-3">
            <Heading id="cart-concierge-heading" level={2} size="md" className="text-white">
              {heading}
            </Heading>
            <Text size="sm" className="text-white/75" leading="relaxed">
              {body}
            </Text>
          </div>
        </RevealItem>
        <RevealItem index={2}>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href={primaryCta.href} prefetch={false}>
                {primaryCta.label}
              </Link>
            </Button>
            {secondaryCta ? (
              <Button asChild size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                <Link href={secondaryCta.href} prefetch={false}>
                  {secondaryCta.label}
                </Link>
              </Button>
            ) : null}
          </div>
        </RevealItem>
      </RevealAnimatedBody>
    </section>
  );
}
