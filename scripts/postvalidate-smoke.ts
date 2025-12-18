import { postValidate } from "@/lib/perazzi-postvalidate";
import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import { GENERAL_UNSOURCED_LABEL_PREFIX } from "@/lib/perazzi-evidence";

type Case = {
  name: string;
  input: string;
  evidenceMode: "perazzi_sourced" | "general_unsourced";
  expect: (output: string) => void;
};

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const cases: Case[] = [
  {
    name: "pricing slip -> strict blocked response",
    input: "A new Perazzi can cost around $12,000 depending on configuration.",
    evidenceMode: "perazzi_sourced",
    expect: (output) => {
      assert(output === BLOCKED_RESPONSES.pricing, "Expected pricing strict refusal output.");
    },
  },
  {
    name: "general_unsourced missing label -> label injected",
    input: "Here’s a general overview of what to consider when choosing a competition over/under.",
    evidenceMode: "general_unsourced",
    expect: (output) => {
      assert(
        output.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
        "Expected general_unsourced label prefix.",
      );
    },
  },
  {
    name: "general_unsourced Perazzi claim marker -> qualifier inserted",
    input: "Perazzi’s warranty is lifetime for the original owner.",
    evidenceMode: "general_unsourced",
    expect: (output) => {
      assert(
        output.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
        "Expected general_unsourced label prefix.",
      );
      assert(
        output.toLowerCase().includes("i don’t have perazzi documentation in view".toLowerCase()) ||
          output.toLowerCase().includes("i don't have perazzi documentation in view".toLowerCase()),
        "Expected unsourced Perazzi qualifier line to be inserted.",
      );
    },
  },
];

const results = cases.map((testCase) => {
  const result = postValidate(testCase.input, { evidenceMode: testCase.evidenceMode });
  testCase.expect(result.text);
  return {
    name: testCase.name,
    ok: true,
    meta: {
      triggered: result.triggered,
      reasons: result.reasons,
      replacedWithBlock: result.replacedWithBlock,
      labelInjected: result.labelInjected,
      qualifierInjected: result.qualifierInjected,
    },
    outputPreview: result.text.slice(0, 120),
  };
});

console.log(JSON.stringify({ ok: true, results }, null, 2));

