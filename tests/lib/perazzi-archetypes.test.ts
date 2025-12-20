import { afterEach, describe, expect, it } from "vitest";
import {
  getNeutralArchetypeVector,
  getSmoothingFactor,
  smoothUpdateArchetypeVector,
} from "@/lib/perazzi-archetypes";

describe("getSmoothingFactor", () => {
  const original = process.env.PERAZZI_SMOOTHING_FACTOR;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PERAZZI_SMOOTHING_FACTOR;
    } else {
      process.env.PERAZZI_SMOOTHING_FACTOR = original;
    }
  });

  it("returns default when unset or invalid", () => {
    delete process.env.PERAZZI_SMOOTHING_FACTOR;
    expect(getSmoothingFactor()).toBeCloseTo(0.75);

    process.env.PERAZZI_SMOOTHING_FACTOR = "-0.5";
    expect(getSmoothingFactor()).toBeCloseTo(0.75);

    process.env.PERAZZI_SMOOTHING_FACTOR = "1.2";
    expect(getSmoothingFactor()).toBeCloseTo(0.75);
  });

  it("uses a valid in-range value", () => {
    process.env.PERAZZI_SMOOTHING_FACTOR = "0.4";
    expect(getSmoothingFactor()).toBeCloseTo(0.4);
  });
});

describe("smoothUpdateArchetypeVector", () => {
  const original = process.env.PERAZZI_SMOOTHING_FACTOR;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PERAZZI_SMOOTHING_FACTOR;
    } else {
      process.env.PERAZZI_SMOOTHING_FACTOR = original;
    }
  });

  it("honors env-provided smoothing factor when blending vectors", () => {
    const previous = getNeutralArchetypeVector();
    const delta = {
      loyalist: 0,
      prestige: 0.8,
      analyst: 0,
      achiever: 0,
      legacy: 0,
    };

    process.env.PERAZZI_SMOOTHING_FACTOR = "1";
    const fullySmoothed = smoothUpdateArchetypeVector(previous, delta);

    process.env.PERAZZI_SMOOTHING_FACTOR = "0";
    const zeroSmoothed = smoothUpdateArchetypeVector(previous, delta);

    expect(fullySmoothed.prestige).toBeCloseTo(0.2);
    expect(zeroSmoothed.prestige).toBeGreaterThan(0.5);
  });
});
