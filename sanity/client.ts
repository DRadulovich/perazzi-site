import "server-only";

import { createClient } from "next-sanity";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || "2023-10-01";

if (!projectId) {
  throw new Error("Missing SANITY_PROJECT_ID");
}

if (!dataset) {
  throw new Error("Missing SANITY_DATASET");
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
});
