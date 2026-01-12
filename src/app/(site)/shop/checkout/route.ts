import { NextResponse, type NextRequest } from "next/server";
import { createCheckoutRedirectUrl } from "@/lib/bigcommerce";
import { getCartIdFromCookies } from "@/lib/bigcommerce/cart";

export async function GET(request: NextRequest) {
  const cartId = await getCartIdFromCookies();
  if (!cartId) {
    return NextResponse.redirect(new URL("/shop/cart", request.url));
  }

  try {
    const redirectUrl = await createCheckoutRedirectUrl(cartId);
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error("[shop-checkout]", error);
    return NextResponse.redirect(new URL("/shop/cart?checkout=error", request.url));
  }
}
