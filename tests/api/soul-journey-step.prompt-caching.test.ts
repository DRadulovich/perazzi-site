import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockResponsesCreate } from "../mocks/openai";

vi.mock("@/lib/soulJourneyPrompts", () => ({
  getSoulArtisanPromptForStep: (step: string) =>
    step === "step_test" ? "Prompt: {{USER_ANSWER}}" : null,
}));

async function importRoute() {
  vi.resetModules();
  return await import("@/app/api/soul-journey-step/route");
}

const originalRetention = process.env.PERAZZI_PROMPT_CACHE_RETENTION;
const originalKey = process.env.PERAZZI_PROMPT_CACHE_KEY;

beforeEach(() => {
  mockResponsesCreate.mockReset();
  mockResponsesCreate.mockResolvedValue({
    output_text: "ok",
    id: "resp_test",
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  });
});

afterEach(() => {
  if (originalRetention === undefined) {
    delete process.env.PERAZZI_PROMPT_CACHE_RETENTION;
  } else {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = originalRetention;
  }

  if (originalKey === undefined) {
    delete process.env.PERAZZI_PROMPT_CACHE_KEY;
  } else {
    process.env.PERAZZI_PROMPT_CACHE_KEY = originalKey;
  }

  vi.clearAllMocks();
  vi.resetModules();
});

function buildRequest() {
  return new Request("http://localhost/api/soul-journey-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step: "step_test",
      userAnswer: "hello",
      title: "T",
      sessionId: "S",
    }),
  });
}

describe("soul-journey prompt caching", () => {
  it("forwards underscore retention value when env already canonical", async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "in_memory";
    delete process.env.PERAZZI_PROMPT_CACHE_KEY;

    const { POST } = await importRoute();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.prompt_cache_retention).toBe("in_memory");
    expect(payload).not.toHaveProperty("prompt_cache_key");
  });

  it('normalizes hyphenated retention "in-memory" to underscore form', async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "in-memory";
    delete process.env.PERAZZI_PROMPT_CACHE_KEY;

    const { POST } = await importRoute();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.prompt_cache_retention).toBe("in_memory");
    expect(payload?.prompt_cache_retention).not.toBe("in-memory");
  });

  it("omits invalid prompt cache retention values", async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "inmemory";

    const { POST } = await importRoute();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("prompt_cache_retention");
  });

  it("forwards prompt cache key when set (trimmed)", async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "in_memory";
    process.env.PERAZZI_PROMPT_CACHE_KEY = "  abc  ";

    const { POST } = await importRoute();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.prompt_cache_key).toBe("abc");
  });

  it("omits prompt cache key when blank", async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "in_memory";
    process.env.PERAZZI_PROMPT_CACHE_KEY = "   ";

    const { POST } = await importRoute();
    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("prompt_cache_key");
  });
});
