// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { browserToken, serverToken } from "./tokens";

const isDev = process.env.NODE_ENV === "development";

// Only enable browser-token based live overlays in development.
// In production builds, this is always disabled so no browser token
// is used for the Live Content API.
const safeBrowserToken = isDev && browserToken ? browserToken : false;

export const { sanityFetch, SanityLive } = defineLive({
  client,
  // Server token never ships to the browser; it's safe to use here.
  serverToken: serverToken || false,
  // Browser token is dev-only and disabled in production.
  browserToken: safeBrowserToken,
  // Only embed stega data in dev for visual editing.
  stega: isDev,
});
