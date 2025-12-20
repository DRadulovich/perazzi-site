import { headers } from "next/headers";
import { notFound } from "next/navigation";

/**
 * Minimal admin gate for PGPT Insights screens.
 * - Blocks production unless PGPT_INSIGHTS_ALLOW_PROD=true.
 * - Optional header token check when PGPT_INSIGHTS_ADMIN_TOKEN is set.
 */
export async function withAdminAuth() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    notFound();
  }

  const expectedToken = (process.env.PGPT_INSIGHTS_ADMIN_TOKEN ?? "").trim();
  if (!expectedToken) return;

  const headerList = await headers();
  const provided = (headerList.get("x-perazzi-admin-debug") ?? headerList.get("x-admin-token") ?? "").trim();

  if (provided !== expectedToken) {
    notFound();
  }
}
