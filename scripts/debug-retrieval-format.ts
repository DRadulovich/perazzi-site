import type { RetrievedChunk } from "../src/types/perazzi-assistant";
import {
  buildDynamicContext,
  buildRetrievedReferencesForPrompt,
} from "../src/app/api/perazzi-assistant/route";

function repeat(value: string, count: number): string {
  return Array.from({ length: count }).fill(value).join("");
}

const chunks: RetrievedChunk[] = [
  {
    chunkId: "chunk-001",
    title: "MX8 — Service intervals and wear points",
    sourcePath: "V2-PGPT/Perazzi/Service/mx8.md",
    score: 0.92,
    content: repeat(
      "Lockup feel, ejector timing, and hinge pin wear are the leading indicators. ",
      80,
    ),
  },
  {
    chunkId: "chunk-002",
    title: "V2-PGPT/Perazzi/Pricing/pricing_and_models.md",
    sourcePath: "V2-PGPT/Perazzi/Pricing/pricing_and_models.md",
    score: 0.88,
    content: repeat(
      "Pricing is handled through authorized dealers; focus on configuration, fit, and intended discipline. ",
      60,
    ),
  },
];

const retrievalPrompt = buildRetrievedReferencesForPrompt(chunks);

console.info("\n=== Retrieved references prompt block ===\n");
console.info(retrievalPrompt.promptBlock);

const dynamicContext = buildDynamicContext(
  {
    pageUrl: "http://localhost:3000/debug",
    mode: "prospect",
    modelSlug: "mx8",
  },
  chunks,
);

console.info("\n=== dynamicContext (includes retrieval block) ===\n");
console.info(dynamicContext);

const forbidden = [
  "Source:",
  "chunk-001",
  "chunk-002",
  "V2-PGPT/Perazzi/Service/mx8.md",
  "V2-PGPT/Perazzi/Pricing/pricing_and_models.md",
];

const failures = forbidden.filter((needle) => retrievalPrompt.promptBlock.includes(needle));

console.info("\n=== Prompt block checks ===\n");
if (failures.length) {
  console.error("FAIL: prompt block contains forbidden substrings:", failures);
  process.exitCode = 1;
} else {
  console.info("PASS: prompt block contains no chunk IDs, no paths, and no `Source:` lines.");
}

console.info("\n=== Sample structured log payload (includes full retrieval metadata) ===\n");
console.info(
  JSON.stringify({
    type: "perazzi-assistant-log",
    retrieved: retrievalPrompt.metadata,
  }),
);

