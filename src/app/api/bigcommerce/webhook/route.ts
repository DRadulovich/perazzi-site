import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getCategoryTree, getProductById } from "@/lib/bigcommerce";
import type { Category } from "@/lib/bigcommerce/types";
import { getProductSlug } from "@/components/shop/utils";

export const runtime = "nodejs";

type WebhookPayload = {
  scope?: string;
  data?: {
    id?: number | string;
    type?: string;
  };
};

const SIGNATURE_HEADER = "x-bc-signature";

const parseId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      return null;
    }
    return trimmed;
  }
  return null;
};

const findCategoryById = (categories: Category[], id: string): Category | null => {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children.length) {
      const match = findCategoryById(category.children, id);
      if (match) {
        return match;
      }
    }
  }
  return null;
};

const verifySignature = (secret: string, signature: string, payload: string): boolean => {
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("base64");
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);
  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
};

const resolveEntityType = (payload: WebhookPayload): string | undefined => {
  if (payload.data?.type) {
    return payload.data.type;
  }
  if (!payload.scope) {
    return undefined;
  }
  const [, type] = payload.scope.split("/");
  return type;
};

export async function POST(request: NextRequest) {
  const secret = process.env.BIGCOMMERCE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[bigcommerce-webhook] Missing BIGCOMMERCE_WEBHOOK_SECRET.");
    return NextResponse.json({ ok: false, error: "Missing secret" }, { status: 500 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER)?.trim() ?? "";
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!verifySignature(secret, signature, rawBody)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch (error) {
    console.error("[bigcommerce-webhook] Invalid payload.", error);
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const revalidatedPaths = new Set<string>();
  const markRevalidated = (path: string) => {
    if (revalidatedPaths.has(path)) {
      return;
    }
    revalidatePath(path);
    revalidatedPaths.add(path);
  };

  markRevalidated("/shop");

  const entityType = resolveEntityType(payload)?.toLowerCase();
  const entityId = parseId(payload.data?.id);

  try {
    if (entityType === "product" && entityId) {
      const product = await getProductById(entityId);
      if (product) {
        const slug = getProductSlug(product.path, product.name);
        markRevalidated(`/shop/product/${encodeURIComponent(slug)}`);
      }
    }

    if (entityType === "category" && entityId) {
      const categories = await getCategoryTree();
      const category = findCategoryById(categories, entityId);
      if (category?.slug) {
        markRevalidated(`/shop/category/${encodeURIComponent(category.slug)}`);
      }
    }
  } catch (error) {
    console.error("[bigcommerce-webhook] Revalidation failed.", error);
  }

  return NextResponse.json({ ok: true, revalidated: Array.from(revalidatedPaths) });
}
