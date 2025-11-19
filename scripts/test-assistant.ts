#!/usr/bin/env tsx
import fetch from "node-fetch";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2), {
  string: ["question", "mode", "locale", "modelSlug", "pageUrl"],
  default: {
    question: "Help me understand the difference between MX2000 and High Tech",
    mode: "prospect",
    locale: "en-US",
    pageUrl: "/shotguns",
  },
});

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

  const res = await fetch("http://localhost:3000/api/perazzi-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Request failed (${res.status}):`, text);
    process.exit(1);
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
