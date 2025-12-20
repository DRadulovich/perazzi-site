import { describe, it, expect } from "vitest";
import {
  ensureGeneralUnsourcedLabelFirstLine,
  GENERAL_UNSOURCED_LABEL_PREFIX,
} from "@/lib/perazzi-evidence";

describe("ensureGeneralUnsourcedLabelFirstLine", () => {
  it("adds the general-unsourced label when missing", () => {
    const input = "MX8 has a classic feel.";
    const result = ensureGeneralUnsourcedLabelFirstLine(input);

    expect(result.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX)).toBe(true);
    expect(result).toContain("MX8 has a classic feel.");
  });

  it("normalizes existing labels without duplicating them", () => {
    const input = `${GENERAL_UNSOURCED_LABEL_PREFIX} Already labeled once.`;
    const result = ensureGeneralUnsourcedLabelFirstLine(input);

    expect(result.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX)).toBe(true);
    const occurrences = result.split(GENERAL_UNSOURCED_LABEL_PREFIX).length - 1;
    expect(occurrences).toBe(1);
    expect(result).toContain("Already labeled once.");
  });
});
