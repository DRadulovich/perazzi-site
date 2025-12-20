import { describe, it, expect } from "vitest";
import type { AssistantContext } from "@/hooks/usePerazziAssistant";
import { buildDealerBriefRequest, getDealerBriefPrompt } from "@/lib/dealer-brief";
import type { ChatMessage } from "@/types/perazzi-assistant";

describe("dealer brief helper", () => {
  it("builds a request payload with summaryIntent", () => {
    const messages: ChatMessage[] = [{ role: "user", content: "Tell me about MX8" }];
    const context: AssistantContext = { pageUrl: "/concierge", mode: "prospect" };
    const contextSnapshot = { ...context };

    const request = buildDealerBriefRequest(messages, context);

    expect(request.summaryIntent).toBe("dealer_brief");
    expect(request.messages[request.messages.length - 1]?.content).toBe(getDealerBriefPrompt());
    expect(request.context).toMatchObject(contextSnapshot);
    expect(context).toEqual(contextSnapshot);
  });
});
