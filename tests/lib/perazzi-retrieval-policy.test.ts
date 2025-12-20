import { describe, it, expect } from "vitest";
import { shouldRetrieve } from "@/lib/perazzi-retrieval-policy";

describe("shouldRetrieve", () => {
  it("skips when user text is empty", () => {
    expect(shouldRetrieve({ userText: "" })).toEqual({
      retrieve: false,
      reason: "empty_user_text",
    });
  });

  it("retrieves when domain signals are present in text", () => {
    const result = shouldRetrieve({ userText: "Tell me about the Perazzi MX8" });
    expect(result.retrieve).toBe(true);
    expect(result.reason).toBe("domain_signal");
  });

  it("retrieves when page URL contains domain signals", () => {
    const result = shouldRetrieve({
      userText: "hello",
      pageUrl: "https://example.com/perazzi/guide",
    });
    expect(result.retrieve).toBe(true);
    expect(result.reason).toBe("domain_signal");
  });

  it("skips UI/meta controls", () => {
    const result = shouldRetrieve({ userText: "reset the chat history" });
    expect(result.retrieve).toBe(false);
    expect(result.reason).toBe("ui_meta");
  });

  it("skips chat meta rewrite requests", () => {
    const result = shouldRetrieve({ userText: "make that shorter" });
    expect(result.retrieve).toBe(false);
    expect(result.reason).toBe("chat_meta");
  });

  it("skips generic pleasantries", () => {
    const result = shouldRetrieve({ userText: "thanks!" });
    expect(result.retrieve).toBe(false);
    expect(result.reason).toBe("pleasantry");
  });

  it("defaults to retrieve when no other rule applies", () => {
    const result = shouldRetrieve({ userText: "Tell me a story" });
    expect(result.retrieve).toBe(true);
    expect(result.reason).toBe("default");
  });
});
