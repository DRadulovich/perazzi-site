import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { CartConciergePanel } from "@/components/shop/CartConciergePanel";
import { ShopCatalogField } from "@/components/shop/ShopCatalogField";
import { Button, Heading, Input, Text } from "@/components/ui";
import { formatMoney } from "@/components/shop/utils";
import cartBg from "@/../docs/BIGCOMMERCE/Background-Images/cart-page-bg.jpg";
import { getCartFromCookies } from "@/lib/bigcommerce/cart";
import { removeCartItemAction, updateCartItemAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cart | Perazzi Shop",
    description: "Review your Perazzi cart before checkout.",
  };
}

export default async function CartPage() {
  const cart = await getCartFromCookies();
  const conciergeCopy = {
    eyebrow: "Concierge reassurance",
    heading: "Confirm fit before you check out",
    body:
      "Share measurements or serial notes and we will confirm fitment, lead time, and shipping windows before you place the order.",
    primaryCta: { label: "Ask the concierge", href: "/concierge" },
    secondaryCta: { label: "Continue shopping", href: "/shop" },
  };

  if (!cart || cart.totalQuantity === 0) {
    return (
      <ShopCatalogField
        id="shop-cart"
        backgroundSrc={cartBg.src}
        backgroundAlt="Perazzi workshop bench set for parts inspection"
        className="full-bleed-offset-top-lg"
      >
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <PageHeading
              title="Your cart"
              description="There is nothing here yet."
            />
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white">
              <Link href="/shop" prefetch={false}>
                Continue shopping
              </Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-white/12 bg-black/45 p-8 text-center shadow-soft">
            <Text size="lg">Your cart is empty.</Text>
            <Text muted className="mt-2">
              Add something from the shop to get started.
            </Text>
            <Button asChild className="mt-4">
              <Link href="/shop" prefetch={false}>
                Continue shopping
              </Link>
            </Button>
          </div>
          <CartConciergePanel
            eyebrow={conciergeCopy.eyebrow}
            heading={conciergeCopy.heading}
            body={conciergeCopy.body}
            primaryCta={conciergeCopy.primaryCta}
            secondaryCta={conciergeCopy.secondaryCta}
          />
        </div>
      </ShopCatalogField>
    );
  }

  const subtotalLabel = cart.subtotal ? formatMoney(cart.subtotal) : "";

  return (
    <ShopCatalogField
      id="shop-cart"
      backgroundSrc={cartBg.src}
      backgroundAlt="Perazzi workshop bench set for parts inspection"
      className="full-bleed-offset-top-lg"
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeading
            title="Your cart"
            description="Review quantities and proceed to checkout when ready."
          />
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white">
            <Link href="/shop" prefetch={false}>
              Continue shopping
            </Link>
          </Button>
        </div>

        <div className="section-reveal-body" data-reveal-sequence="true">
          <div className="space-y-4">
            {cart.items.map((item, index) => (
              <article
                key={item.id}
                data-reveal-item
                style={{ "--reveal-index": index } as CSSProperties}
                className="flex flex-col gap-4 rounded-3xl border border-white/12 bg-white/5 p-5 shadow-soft backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Heading level={3} size="sm">
                      {item.name}
                    </Heading>
                    <Text size="sm" muted>
                      Unit price: {formatMoney(item.price)}
                    </Text>
                    <Text size="sm" muted>
                      Line total: {formatMoney(item.totalPrice)}
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <form action={updateCartItemAction} className="flex items-center gap-2">
                      <input type="hidden" name="lineItemId" value={item.id} />
                      <input type="hidden" name="productId" value={item.productId} />
                      <input
                        type="hidden"
                        name="variantId"
                        value={item.variantId ?? ""}
                      />
                      <Input
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        defaultValue={item.quantity}
                        className="w-20"
                      />
                      <Button type="submit" size="sm" variant="secondary">
                        Update
                      </Button>
                    </form>
                    <form action={removeCartItemAction}>
                      <input type="hidden" name="lineItemId" value={item.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="space-y-1">
            <Text size="label-tight" muted>
              Subtotal
            </Text>
            <Text size="lg">{subtotalLabel || "Calculated at checkout"}</Text>
          </div>
          <Button asChild size="md">
            <Link href="/shop/checkout" prefetch={false}>
              Proceed to checkout
            </Link>
          </Button>
        </div>
        <Text size="caption" muted>
          Taxes and shipping are calculated at checkout.
        </Text>

        <CartConciergePanel
          eyebrow={conciergeCopy.eyebrow}
          heading={conciergeCopy.heading}
          body={conciergeCopy.body}
          primaryCta={conciergeCopy.primaryCta}
          secondaryCta={conciergeCopy.secondaryCta}
        />
      </div>
    </ShopCatalogField>
  );
}
