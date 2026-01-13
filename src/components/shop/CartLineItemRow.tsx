"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/components/shop/utils";
import { removeCartItemAction, updateCartItemAction } from "@/app/(site)/shop/cart/actions";

type Money = Readonly<{ value: number; currencyCode: string }>;

export type CartLineItemUi = Readonly<{
  id: string;
  name: string;
  href?: string;
  image?: Readonly<{ url: string; altText?: string }>;
  meta?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: Money;
  totalPrice: Money;
}>;

const clampQuantity = (value: number) => Math.max(1, Math.floor(value));

export function CartLineItemRow({ item }: Readonly<{ item: CartLineItemUi }>) {
  const updateFormRef = useRef<HTMLFormElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(item.quantity);

  const unitPriceLabel = useMemo(() => formatMoney(item.price), [item.price]);
  const lineTotalLabel = useMemo(() => formatMoney(item.totalPrice), [item.totalPrice]);

  const submitUpdate = useCallback(() => {
    const form = updateFormRef.current;
    if (!form) {
      return;
    }
    startTransition(() => {
      form.requestSubmit();
    });
  }, []);

  const setQuantityAndSubmit = useCallback(
    (nextQuantity: number) => {
      const safe = clampQuantity(nextQuantity);
      setQuantity(safe);

      if (quantityInputRef.current) {
        quantityInputRef.current.value = String(safe);
      }

      submitUpdate();
    },
    [submitUpdate],
  );

  const onQuantityInputChange = useCallback((value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      setQuantity(item.quantity);
      return;
    }
    setQuantity(clampQuantity(parsed));
  }, [item.quantity]);

  return (
    <article className={cn(
      "rounded-3xl border border-border/70 bg-card/70 p-5 shadow-soft backdrop-blur-sm",
      isPending && "opacity-70",
    )}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-canvas/70">
            {item.image?.url ? (
              <Image
                src={item.image.url}
                alt={item.image.altText ?? item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : null}
          </div>

          <div className="min-w-0 space-y-2">
            {item.href ? (
              <Link
                href={item.href}
                prefetch={false}
                className="type-title-sm block text-ink transition-colors hover:text-perazzi-red focus-ring rounded-xl"
              >
                {item.name}
              </Link>
            ) : (
              <Text size="sm" className="text-ink">
                {item.name}
              </Text>
            )}

            {item.meta ? (
              <Text size="caption" muted>
                {item.meta}
              </Text>
            ) : null}

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Text size="sm" muted>
                Unit: {unitPriceLabel}
              </Text>
              <Text size="sm" muted>
                Total: {lineTotalLabel}
              </Text>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <form ref={updateFormRef} action={updateCartItemAction} className="flex items-center gap-2">
            <input type="hidden" name="lineItemId" value={item.id} />
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="variantId" value={item.variantId ?? ""} />

            <div className="inline-flex items-center overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-soft">
              <button
                type="button"
                onClick={() => setQuantityAndSubmit(quantity - 1)}
                className="flex h-10 w-10 items-center justify-center text-ink-muted transition hover:bg-ink/5 hover:text-ink focus-ring disabled:pointer-events-none disabled:opacity-60"
                aria-label="Decrease quantity"
                disabled={isPending}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>

              <input
                ref={quantityInputRef}
                name="quantity"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={quantity}
                onChange={(event) => onQuantityInputChange(event.target.value)}
                onBlur={() => setQuantityAndSubmit(quantity)}
                disabled={isPending}
                className="h-10 w-16 bg-transparent px-2 text-center type-body-sm text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <button
                type="button"
                onClick={() => setQuantityAndSubmit(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-ink-muted transition hover:bg-ink/5 hover:text-ink focus-ring disabled:pointer-events-none disabled:opacity-60"
                aria-label="Increase quantity"
                disabled={isPending}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <form action={removeCartItemAction}>
            <input type="hidden" name="lineItemId" value={item.id} />
            <Button type="submit" size="sm" variant="ghost" className="gap-2">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}

