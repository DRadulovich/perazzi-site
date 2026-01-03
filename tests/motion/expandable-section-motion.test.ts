import { describe, expect, it } from "vitest";
import {
  DEFAULT_SPEC,
  capStagger,
  getNextPhase,
  mergeSpec,
} from "@/motion/expandable/expandable-section-motion";

describe("mergeSpec layering", () => {
  it("merges nested overrides without mutating the base", () => {
    const routeOverride = {
      timeScale: { expand: 1.2 },
      distance: { contentY: 24 },
    };
    const registryOverride = {
      timing: { expand: { mainIn: 0.42 } },
    };
    const runtimeOverride = {
      timeScale: { collapse: 0.4 },
    };

    const merged = mergeSpec(DEFAULT_SPEC, routeOverride, registryOverride, runtimeOverride);

    expect(merged.timeScale.expand).toBe(1.2);
    expect(merged.timeScale.collapse).toBe(0.4);
    expect(merged.distance.contentY).toBe(24);
    expect(merged.timing.expand.mainIn).toBe(0.42);
    expect(merged.timing.expand.glassIn).toBe(DEFAULT_SPEC.timing.expand.glassIn);
    expect(DEFAULT_SPEC.timeScale.expand).toBe(1);
  });
});

describe("capStagger", () => {
  it("caps total stagger spread", () => {
    expect(capStagger(0.1, 1, 0.4)).toBe(0);
    expect(capStagger(0.1, 5, 0.4)).toBe(0.1);
    expect(capStagger(0.2, 5, 0.4)).toBeCloseTo(0.1, 4);
  });
});

describe("phase guards", () => {
  it("prevents double open/close", () => {
    expect(getNextPhase("collapsed", "open")).toBe("expanding");
    expect(getNextPhase("expanding", "open")).toBeNull();
    expect(getNextPhase("expanded", "open")).toBeNull();
    expect(getNextPhase("collapsed", "close")).toBeNull();
    expect(getNextPhase("expanded", "close")).toBe("collapsing");
    expect(getNextPhase("collapsing", "close")).toBeNull();
  });
});

