import { describe, it, expect } from "vitest";
import { buildDealerBriefRequest, getDealerBriefPrompt } from "@/lib/dealer-brief";

describe("dealer brief helper", () => {
  it("builds a request payload with summaryIntent", () => {
    const messages = [{ role: "user", content: "Tell me about MX8" }] as any;
    const context = { pageUrl: "/concierge", mode: "prospect" } as any;
    const contextSnapshot = { ...context };

    const request = buildDealerBriefRequest(messages, context);

    expect(request.summaryIntent).toBe("dealer_brief");
    expect(request.messages[request.messages.length - 1]?.content).toBe(getDealerBriefPrompt());
    expect(request.context).toMatchObject(contextSnapshot);
    expect(context).toEqual(contextSnapshot);
  });
});
