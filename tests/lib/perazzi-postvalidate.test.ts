import { describe, it, expect } from "vitest";
import { postValidate } from "@/lib/perazzi-postvalidate";
import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import { GENERAL_UNSOURCED_LABEL_PREFIX } from "@/lib/perazzi-evidence";

describe("postValidate", () => {
  it("blocks pricing content", () => {
    const result = postValidate("This costs $5,000", { evidenceMode: "perazzi_sourced" });

    expect(result.replacedWithBlock).toBe(true);
    expect(result.text).toBe(BLOCKED_RESPONSES.pricing);
    expect(result.triggered).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("blocked:pricing"))).toBe(true);
  });

  it("blocks risky gunsmithing instructions", () => {
    const result = postValidate(
      "Step 1: remove the trigger group. Then polish the sear for a lighter pull.",
      { evidenceMode: "perazzi_sourced" },
    );

    expect(result.replacedWithBlock).toBe(true);
    expect(result.text).toBe(BLOCKED_RESPONSES.gunsmithing);
    expect(result.reasons.some((r) => r.startsWith("blocked:gunsmithing"))).toBe(true);
  });

  it("injects general-unsourced label and qualifier for risky Perazzi claims", () => {
    const result = postValidate("Perazzi warranty covers everything.", {
      evidenceMode: "general_unsourced",
    });

    expect(result.replacedWithBlock).toBe(false);
    expect(result.labelInjected).toBe(true);
    expect(result.qualifierInjected).toBe(true);
    expect(result.text.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX)).toBe(true);
    expect(result.text).toContain("Perazzi-source confirmation");
  });
});
