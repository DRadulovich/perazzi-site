import { beforeEach, describe, expect, it } from "vitest";
import { mockResponsesCreate } from "../mocks/openai";
import { createResponseText, type CreateResponseTextParams } from "@/lib/aiClient";

beforeEach(() => {
  mockResponsesCreate.mockReset();
  mockResponsesCreate.mockResolvedValue({
    output_text: "ok",
    id: "resp_test",
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  });
});

describe("aiClient GPT-5.2 gotchas", () => {
  it("omits sampling params when reasoning effort is not none (gpt-5.2)", async () => {
    await createResponseText({
      model: "gpt-5.2",
      instructions: "sys",
      input: "hi",
      reasoningEffort: "high",
      temperature: 0.9,
      top_p: 0.2,
      logprobs: true,
      top_logprobs: 3,
    } satisfies CreateResponseTextParams);

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload).toBeDefined();
    expect(payload).not.toHaveProperty("temperature");
    expect(payload).not.toHaveProperty("top_p");
    expect(payload).not.toHaveProperty("logprobs");
    expect(payload).not.toHaveProperty("top_logprobs");
    expect(payload?.reasoning?.effort).toBe("high");
  });

  it("allows sampling params when reasoning effort is none (gpt-5.2)", async () => {
    await createResponseText({
      model: "gpt-5.2",
      instructions: "sys",
      input: "hi",
      reasoningEffort: "none",
      temperature: 0.7,
      top_p: 0.3,
    });

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.temperature).toBe(0.7);
    expect(payload?.top_p).toBe(0.3);
  });

  it("does not forward sampling params for older gpt-5 models even when effort is none", async () => {
    await createResponseText({
      model: "gpt-5-mini",
      instructions: "sys",
      input: "hi",
      reasoningEffort: "none",
      temperature: 0.7,
      top_p: 0.5,
      logprobs: true,
    });

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("temperature");
    expect(payload).not.toHaveProperty("top_p");
    expect(payload).not.toHaveProperty("logprobs");
    expect(payload).not.toHaveProperty("top_logprobs");
  });
});
