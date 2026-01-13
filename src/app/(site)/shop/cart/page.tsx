import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { CartConciergePanel } from "@/components/shop/CartConciergePanel";
import { CartLineItemRow, type CartLineItemUi } from "@/components/shop/CartLineItemRow";
import { CartSummaryPanel } from "@/components/shop/CartSummaryPanel";
import { ShopCatalogField } from "@/components/shop/ShopCatalogField";
import { Button, Text } from "@/components/ui";
import { formatMoney, getProductSlug } from "@/components/shop/utils";
import cartBg from "@/../docs/BIGCOMMERCE/Background-Images/cart-page-bg.jpg";
import { getCartFromCookies } from "@/lib/bigcommerce/cart";
import { getProductById } from "@/lib/bigcommerce";

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
            <Button asChild variant="ghost" size="sm">
              <Link href="/shop" prefetch={false}>
                Continue shopping
              </Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/70 p-8 text-center shadow-soft backdrop-blur-sm">
            <Text size="lg" className="text-ink">
              Your cart is empty.
            </Text>
            <Text muted className="mt-2">
              Add something from the shop to get started.
            </Text>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm">
                <Link href="/shop" prefetch={false}>
                  Continue shopping
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/shop#shop-catalog" prefetch={false}>
                  Browse categories
                </Link>
              </Button>
            </div>
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

  const cartItemsUi: CartLineItemUi[] = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId ? await getProductById(item.productId) : null;
      const href = product
        ? `/shop/product/${encodeURIComponent(getProductSlug(product.path, product.name))}?id=${product.id}`
        : undefined;
      const image = product?.defaultImage ?? product?.images[0];
      const variant = product?.variants.find((variant) => variant.id === item.variantId);
      const variantLabel = variant?.selectedOptions
        ?.filter((entry) => entry.name && entry.value)
        .map((entry) => `${entry.name}: ${entry.value}`)
        .join(" · ");
      const metaParts = [product?.sku ? `SKU: ${product.sku}` : "", variantLabel ?? ""].filter(Boolean);

      return {
        id: item.id,
        name: item.name,
        href,
        image: image ? { url: image.url, altText: image.altText || item.name } : undefined,
        meta: metaParts.length ? metaParts.join(" · ") : undefined,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      };
    }),
  );

  return (
    <ShopCatalogField
      id="shop-cart"
      backgroundSrc={cartBg.src}
      backgroundAlt="Perazzi workshop bench set for parts inspection"
      className="full-bleed-offset-top-lg"
    >
      <div className="space-y-8 pb-24 lg:pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeading
            title="Your cart"
            description="Review quantities and proceed to checkout when ready."
          />
          <Button asChild variant="ghost" size="sm">
            <Link href="/shop" prefetch={false}>
              Continue shopping
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="section-reveal-body" data-reveal-sequence="true">
              <div className="space-y-4">
                {cartItemsUi.map((item, index) => (
                  <div
                    key={item.id}
                    data-reveal-item
                    style={{ "--reveal-index": index } as CSSProperties}
                  >
                    <CartLineItemRow item={item} />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:hidden">
              <CartConciergePanel
                eyebrow={conciergeCopy.eyebrow}
                heading={conciergeCopy.heading}
                body={conciergeCopy.body}
                primaryCta={conciergeCopy.primaryCta}
                secondaryCta={conciergeCopy.secondaryCta}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <CartSummaryPanel subtotalLabel={subtotalLabel} totalQuantity={cart.totalQuantity} />
          </div>
        </div>

        <div className="hidden lg:block">
          <CartConciergePanel
            eyebrow={conciergeCopy.eyebrow}
            heading={conciergeCopy.heading}
            body={conciergeCopy.body}
            primaryCta={conciergeCopy.primaryCta}
            secondaryCta={conciergeCopy.secondaryCta}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-canvas/90 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-sm py-4 sm:px-md lg:px-lg">
          <div className="space-y-1">
            <Text size="label-tight" muted>
              Subtotal
            </Text>
            <Text size="sm" className="text-ink">
              {subtotalLabel || "Calculated at checkout"}
            </Text>
          </div>
          <Button asChild size="sm">
            <Link href="/shop/checkout" prefetch={false}>
              Proceed to checkout
            </Link>
          </Button>
        </div>
      </div>
    </ShopCatalogField>
  );
}
