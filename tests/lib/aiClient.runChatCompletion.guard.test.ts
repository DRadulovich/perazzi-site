import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockChatCreate } from "../mocks/openai";
import { runChatCompletion } from "@/lib/aiClient";

const baseParams = {
  model: "gpt-4.1",
  messages: [{ role: "user", content: "hi" }],
} as any;

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
    const completion = { id: "chatcmpl_test", choices: [] } as any;
    mockChatCreate.mockResolvedValueOnce(completion);

    const result = await runChatCompletion(baseParams);

    expect(mockChatCreate).toHaveBeenCalledTimes(1);
    expect(result).toBe(completion);
  });
});
