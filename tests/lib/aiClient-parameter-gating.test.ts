import { beforeEach, describe, expect, it } from "vitest";
import { mockResponsesCreate } from "../mocks/openai";
import { createResponseText } from "@/lib/aiClient";

beforeEach(() => {
  mockResponsesCreate.mockReset();
  mockResponsesCreate.mockResolvedValue({
    output_text: "ok",
    id: "resp_test",
    usage: { input_tokens: 1, output_tokens: 1 },
  });
});

describe("aiClient sampling/logprob gating", () => {
  it("omits sampling params for gpt-5.2 when reasoning effort is high", async () => {
    await createResponseText({
      model: "gpt-5.2",
      input: "hi",
      instructions: "sys",
      temperature: 1,
      top_p: 0.9,
      logprobs: 3,
      top_logprobs: 5,
      reasoningEffort: "high",
    });

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload).toBeDefined();
    expect(payload).not.toHaveProperty("temperature");
    expect(payload).not.toHaveProperty("top_p");
    expect(payload).not.toHaveProperty("logprobs");
    expect(payload).not.toHaveProperty("top_logprobs");
    expect(payload?.reasoning?.effort).toBe("high");
  });

  it("allows sampling params for gpt-5.2 when reasoning effort is none", async () => {
    await createResponseText({
      model: "gpt-5.2",
      input: "hi",
      instructions: "sys",
      temperature: 0.7,
      reasoningEffort: "none",
    });

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.temperature).toBe(0.7);
  });

  it("omits sampling params for older gpt-5 model (gpt-5-mini) even when effort is none", async () => {
    await createResponseText({
      model: "gpt-5-mini",
      input: "hi",
      instructions: "sys",
      temperature: 0.7,
      reasoningEffort: "none",
    });

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("temperature");
    expect(payload).not.toHaveProperty("top_p");
    expect(payload).not.toHaveProperty("logprobs");
    expect(payload).not.toHaveProperty("top_logprobs");
  });

  it("passes sampling params through for non-GPT-5 model", async () => {
    await createResponseText({
      model: "gpt-4.1",
      input: "hi",
      instructions: "sys",
      temperature: 0.2,
      top_p: 0.8,
    });

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.temperature).toBe(0.2);
    expect(payload?.top_p).toBe(0.8);
  });
});
