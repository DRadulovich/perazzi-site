import { describe, it, expect, beforeAll } from "vitest";
import "../mocks/openai";

let retrievalModule: typeof import("@/lib/perazzi-retrieval");

beforeAll(async () => {
  retrievalModule = await import("@/lib/perazzi-retrieval");
});

describe("language helpers", () => {
  it("derives base language from locale", () => {
    expect(retrievalModule.getBaseLanguage("en-US")).toBe("en");
    expect(retrievalModule.getBaseLanguage("it-IT")).toBe("it");
    expect(retrievalModule.getBaseLanguage("fr")).toBe("fr");
    expect(retrievalModule.getBaseLanguage(undefined)).toBeNull();
  });

  it("builds language fallback list", () => {
    expect(retrievalModule.buildLanguageFallbacks("it-IT")).toEqual(["it", "en"]);
    expect(retrievalModule.buildLanguageFallbacks("en-US")).toEqual(["en"]);
    expect(retrievalModule.buildLanguageFallbacks(undefined)).toEqual(["en"]);
  });
});
