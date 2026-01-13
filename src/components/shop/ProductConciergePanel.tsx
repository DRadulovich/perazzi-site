"use client";

import Image from "next/image";
import Link from "next/link";
import productPanelBg from "@/../docs/BIGCOMMERCE/Background-Images/product-page-bg.jpg";
import { Button, Heading, RevealAnimatedBody, RevealItem, Text } from "@/components/ui";

type ProductConciergePanelProps = Readonly<{
  eyebrow: string;
  heading: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}>;

export function ProductConciergePanel({
  eyebrow,
  heading,
  body,
  primaryCta,
  secondaryCta,
}: ProductConciergePanelProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/55 p-5 shadow-elevated ring-1 ring-white/10 backdrop-blur-xl sm:rounded-3xl"
      aria-labelledby="product-concierge-heading"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={productPanelBg.src}
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
            <Heading id="product-concierge-heading" level={2} size="md" className="text-white">
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
            <Button asChild size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <Link href={secondaryCta.href} prefetch={false}>
                {secondaryCta.label}
              </Link>
            </Button>
          </div>
        </RevealItem>
      </RevealAnimatedBody>
    </section>
  );
}
