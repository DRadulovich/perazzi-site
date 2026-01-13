import Link from "next/link";
import { Button, Heading, Text } from "@/components/ui";

export function CartSummaryPanel({
  subtotalLabel,
  totalQuantity,
  checkoutHref = "/shop/checkout",
}: Readonly<{
  subtotalLabel: string;
  totalQuantity: number;
  checkoutHref?: string;
}>) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm lg:sticky lg:top-[calc(var(--site-header-offset-lg)+16px)] lg:self-start">
      <Heading level={2} size="md">
        Summary
      </Heading>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Text size="sm" muted>
            Items
          </Text>
          <Text size="sm" className="text-ink">
            {totalQuantity}
          </Text>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Text size="sm" muted>
            Subtotal
          </Text>
          <Text size="sm" className="text-ink">
            {subtotalLabel || "Calculated at checkout"}
          </Text>
        </div>
        <Text size="caption" muted>
          Taxes and shipping are calculated at checkout.
        </Text>
      </div>
      <Button asChild size="md" className="mt-6 w-full">
        <Link href={checkoutHref} prefetch={false}>
          Proceed to checkout
        </Link>
      </Button>
    </section>
  );
}

