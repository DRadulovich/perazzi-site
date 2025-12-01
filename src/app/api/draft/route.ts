import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/sanity/lib/client";
import { serverToken } from "@/sanity/lib/tokens";

if (!serverToken) {
  // Draft mode will fall back to public content without this token.
  console.warn("Missing SANITY_API_READ_TOKEN (or SANITY_READ_TOKEN); draft previews may fail.");
}

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: serverToken }),
});
