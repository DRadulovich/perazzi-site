import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type OpenAI from "openai";
import { mockChatCreate } from "../mocks/openai";
import { runChatCompletion, type RunChatCompletionParams } from "@/lib/aiClient";

const baseParams: RunChatCompletionParams = {
  model: "gpt-4.1",
  messages: [{ role: "user", content: "hi" }],
};

let originalAllow: string | undefined;

beforeEach(() => {
  originalAllow = process.env.PERAZZI_ALLOW_CHAT_COMPLETIONS;
  delete process.env.PERAZZI_ALLOW_CHAT_COMPLETIONS;
  mockChatCreate.mockReset();
});

afterEach(() => {
  if (originalAllow === undefined) {
    delete process.env.PERAZZI_ALLOW_CHAT_COMPLETIONS;
  } else {
    process.env.PERAZZI_ALLOW_CHAT_COMPLETIONS = originalAllow;
  }
  mockChatCreate.mockReset();
});

describe("runChatCompletion guard", () => {
  it("throws when chat completions are not explicitly enabled", async () => {
    await expect(runChatCompletion(baseParams)).rejects.toThrow("PERAZZI_ALLOW_CHAT_COMPLETIONS");
    expect(mockChatCreate).not.toHaveBeenCalled();
  });

  it("invokes OpenAI when explicitly enabled", async () => {
    process.env.PERAZZI_ALLOW_CHAT_COMPLETIONS = "true";
    const completion: OpenAI.Chat.Completions.ChatCompletion = {
      id: "chatcmpl_test",
      choices: [
        {
          finish_reason: "stop",
          index: 0,
          logprobs: null,
          message: { content: "hi", refusal: null, role: "assistant" },
        },
      ],
      created: 0,
      model: baseParams.model,
      object: "chat.completion",
      usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
    };
    mockChatCreate.mockResolvedValueOnce(completion);

    const result = await runChatCompletion(baseParams);

    expect(mockChatCreate).toHaveBeenCalledTimes(1);
    expect(result).toBe(completion);
  });
});
