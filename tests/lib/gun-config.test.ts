import { describe, it, expect } from "vitest";
import {
  getValidOptions,
  validateSelection,
  getNextField,
  type BuildState,
} from "@/lib/gun-config";

describe("gun-config helpers", () => {
  it("returns valid platforms based on frame size", () => {
    const state: BuildState = { FRAME_SIZE: "12" };
    const opts = getValidOptions("PLATFORM", state).map((o) => o.value);
    expect(opts).toContain("MX");
    expect(opts).toContain("HT");
    expect(opts).toContain("TM");
    expect(opts).toContain("DC");
  });

  it("validates a compatible model selection", () => {
    const state: BuildState = { FRAME_SIZE: "12", PLATFORM: "MX", DISCIPLINE: "TRAP" };
    const result = validateSelection("MODEL", "MX10", state);
    expect(result.valid).toBe(true);
  });

  it("blocks an incompatible model selection", () => {
    const state: BuildState = { FRAME_SIZE: "28", PLATFORM: "MX", DISCIPLINE: "TRAP" };
    const result = validateSelection("MODEL", "TM9", state);
    expect(result.valid).toBe(false);
  });

  it("finds next field whose dependencies are met", () => {
    const state: BuildState = { FRAME_SIZE: "12" };
    const next = getNextField(state);
    expect(next?.id).toBe("PLATFORM");
  });
});
