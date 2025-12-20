#!/usr/bin/env tsx
import fetch from "node-fetch";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2), {
  string: ["question", "mode", "locale", "modelSlug", "pageUrl", "baseUrl"],
  alias: { baseUrl: "base-url" },
  default: {
    question: "Help me understand the difference between MX2000 and High Tech",
    mode: "prospect",
    locale: "en-US",
    pageUrl: "/shotguns",
  },
});

function resolveAssistantUrl(): URL {
  const baseUrl =
    (argv.baseUrl as string | undefined) ?? process.env.PERAZZI_ASSISTANT_URL ?? "http://localhost:3000";
  const url = new URL("/api/perazzi-assistant", baseUrl);
  const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (url.protocol !== "https:" && !isLocalHost) {
    throw new Error(`Refusing to call assistant over insecure protocol: ${url.href}`);
  }

  return url;
}

async function main() {
  const payload = {
    messages: [{ role: "user", content: argv.question }],
    context: {
      pageUrl: argv.pageUrl,
      modelSlug: argv.modelSlug ?? null,
      mode: argv.mode,
      locale: argv.locale,
    },
  };

  const assistantUrl = resolveAssistantUrl();

  const res = await fetch(assistantUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Request failed (%s): %s", res.status, text);
    process.exit(1);
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
