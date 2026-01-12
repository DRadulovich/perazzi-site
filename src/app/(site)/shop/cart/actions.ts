"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addCartLineItems,
  createCart,
  removeCartLineItem,
  updateCartLineItem,
} from "@/lib/bigcommerce";
import {
  clearCartIdCookie,
  getCartIdFromCookies,
  setCartIdCookie,
} from "@/lib/bigcommerce/cart";
import type { CartLineInput } from "@/lib/bigcommerce/types";

const parseId = (value: FormDataEntryValue | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
};

const parseQuantity = (value: FormDataEntryValue | null): number => {
  if (typeof value !== "string") {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
};

const buildCartLine = (formData: FormData): CartLineInput | null => {
  const productId = parseId(formData.get("productId"));
  const variantId = parseId(formData.get("variantId"));
  const quantity = parseQuantity(formData.get("quantity"));

  if (!productId || !variantId) {
    return null;
  }

  return {
    productEntityId: productId,
    variantEntityId: variantId,
    quantity,
  };
};

export async function addToCartAction(formData: FormData) {
  const line = buildCartLine(formData);
  if (!line) {
    return;
  }

  const existingCartId = await getCartIdFromCookies();

  try {
    if (existingCartId) {
      const cart = await addCartLineItems(existingCartId, [line]);
      await setCartIdCookie(cart.id);
    } else {
      const cart = await createCart([line]);
      await setCartIdCookie(cart.id);
    }
  } catch {
    if (existingCartId) {
      await clearCartIdCookie();
    }

    const cart = await createCart([line]);
    await setCartIdCookie(cart.id);
  }

  revalidatePath("/shop/cart");
  redirect("/shop/cart");
}

export async function updateCartItemAction(formData: FormData) {
  const cartId = await getCartIdFromCookies();
  if (!cartId) {
    return;
  }

  const lineItemId = parseId(formData.get("lineItemId"));
  const productId = parseId(formData.get("productId"));
  const variantId = parseId(formData.get("variantId"));
  const quantity = parseQuantity(formData.get("quantity"));

  if (!lineItemId || !productId || !variantId) {
    return;
  }

  const cart = await updateCartLineItem({
    cartId,
    lineItemId,
    productEntityId: productId,
    variantEntityId: variantId,
    quantity,
  });

  if (cart.totalQuantity === 0) {
    await clearCartIdCookie();
  }

  revalidatePath("/shop/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const cartId = await getCartIdFromCookies();
  if (!cartId) {
    return;
  }

  const lineItemId = parseId(formData.get("lineItemId"));
  if (!lineItemId) {
    return;
  }

  const cart = await removeCartLineItem(cartId, lineItemId);
  if (cart.totalQuantity === 0) {
    await clearCartIdCookie();
  }

  revalidatePath("/shop/cart");
}
