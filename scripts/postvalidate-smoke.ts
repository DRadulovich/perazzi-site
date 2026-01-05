#!/usr/bin/env tsx
import { postValidate } from "@/lib/perazzi-postvalidate";
import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import { GENERAL_UNSOURCED_LABEL_PREFIX } from "@/lib/perazzi-evidence";

function fail(message: string): never {
  throw new Error(message);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

function assertEqual<T>(name: string, got: T, expected: T): void {
  if (got !== expected) {
    fail(`${name}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(got)}`);
  }
}

function normalizeNewlines(text: string): string {
  return String(text ?? "").replaceAll(/\r\n?/g, "\n");
}

const EXPECTED_QUALIFIER_LINE =
  "Note: I don’t have Perazzi-source confirmation for any warranty/policy/pricing details below—please verify with Perazzi or an authorized dealer/service center.";

async function main() {
  const tests: string[] = [];

  {
    const name = "pricing slip → strict refusal";
    const input = "A new Perazzi High Tech is around $20,000—ballpark—depending on configuration.";
    const result = postValidate(input, { evidenceMode: "general_unsourced", requireGeneralLabel: true });

    assertEqual(`${name} replacedWithBlock`, result.replacedWithBlock, true);
    assertEqual(`${name} text`, result.text, BLOCKED_RESPONSES.pricing);
    assert(result.reasons.includes("blocked:pricing"), `${name}: expected reasons to include blocked:pricing`);
    assertEqual(`${name} labelInjected`, result.labelInjected, false);
    assertEqual(`${name} qualifierInjected`, result.qualifierInjected, false);
    assertEqual(`${name} changed`, result.changed, true);

    console.log(JSON.stringify({ name, ok: true, reasons: result.reasons }, null, 2));
    tests.push(name);
  }

  {
    const name = "general_unsourced missing label → label injected";
    const input = "Here’s a high-level overview of the HT platform and how it tends to feel in the hands.";
    const result = postValidate(input, { evidenceMode: "general_unsourced", requireGeneralLabel: true });

    assertEqual(`${name} replacedWithBlock`, result.replacedWithBlock, false);
    assert(
      result.text.trimStart().startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
      `${name}: expected output to start with the general-unsourced label`,
    );
    assertEqual(`${name} labelInjected`, result.labelInjected, true);
    assertEqual(`${name} qualifierInjected`, result.qualifierInjected, false);
    assertEqual(`${name} changed`, result.changed, true);

    console.log(JSON.stringify({ name, ok: true, reasons: result.reasons }, null, 2));
    tests.push(name);
  }

  {
    const name = "general_unsourced Perazzi policy claim → qualifier inserted";
    const input =
      "Perazzi’s warranty policy is typically handled through the dealer network, and you’ll want to keep purchase documentation.";
    const result = postValidate(input, { evidenceMode: "general_unsourced", requireGeneralLabel: true });

    const lines = normalizeNewlines(result.text).split("\n");
    assert(
      lines[0]?.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
      `${name}: expected line 1 to start with the general-unsourced label`,
    );
    assertEqual(`${name} qualifier line`, lines[1], EXPECTED_QUALIFIER_LINE);
    assertEqual(`${name} qualifierInjected`, result.qualifierInjected, true);
    assert(result.reasons.includes("unsourced_perazzi_claims_qualified"), `${name}: expected qualifier reason`);
    assertEqual(`${name} changed`, result.changed, true);

    console.log(JSON.stringify({ name, ok: true, reasons: result.reasons }, null, 2));
    tests.push(name);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        runner: "scripts/postvalidate-smoke.ts",
        testCount: tests.length,
        tests,
      },
      null,
      2,
    ),
  );
}

await main();
