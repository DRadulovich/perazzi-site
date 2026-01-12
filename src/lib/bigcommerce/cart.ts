import "server-only";

import { cookies } from "next/headers";
import { getCart } from "./index";
import type { Cart } from "./types";

export const CART_COOKIE_NAME = "perazzi-shop-cart";

const cartCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

export const getCartIdFromCookies = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
};

export const setCartIdCookie = async (cartId: string) => {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, cartId, cartCookieOptions);
};

export const clearCartIdCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE_NAME);
};

export const getCartFromCookies = async (): Promise<Cart | null> => {
  const cartId = await getCartIdFromCookies();
  if (!cartId) {
    return null;
  }

  const cart = await getCart(cartId);
  if (!cart) {
    await clearCartIdCookie();
    return null;
  }

  return cart;
};
