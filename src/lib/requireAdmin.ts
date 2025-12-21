import { headers } from "next/headers";

export async function requireAdmin(): Promise<Response | null> {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const allowInProd = process.env.PGPT_INSIGHTS_ALLOW_PROD === "true";
  if (env === "production" && !allowInProd) {
    return new Response("Not found", { status: 404 });
  }

  const expectedToken = (process.env.PGPT_INSIGHTS_ADMIN_TOKEN ?? "").trim();
  if (!expectedToken) return null; // no token required

  const headerList = await headers();
  const provided = (headerList.get("x-perazzi-admin-debug") ?? headerList.get("x-admin-token") ?? "").trim();
  if (provided !== expectedToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
