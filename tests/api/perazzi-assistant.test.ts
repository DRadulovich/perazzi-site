import type { PerazziAssistantRequest } from "@/types/perazzi-assistant";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { mockResponsesCreate } from "../mocks/openai";

const retrieveMock = vi.fn();
vi.mock("@/lib/perazzi-retrieval", () => ({
  retrievePerazziContext: retrieveMock,
}));

let routeModule: typeof import("@/app/api/perazzi-assistant/route");

beforeAll(async () => {
  process.env.PERAZZI_MODEL = "gpt-5-mini";
  process.env.PERAZZI_COMPLETIONS_MODEL = "gpt-5-mini";
  process.env.PERAZZI_EMBED_MODEL = "text-embedding-3-small";
  routeModule = await import("@/app/api/perazzi-assistant/route");
});

beforeEach(() => {
  vi.clearAllMocks();
});

function buildRequest(payload: Partial<PerazziAssistantRequest>) {
  return new Request("http://localhost/api/perazzi-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

it("returns ok guardrail with citations and ignores client system message", async () => {
  retrieveMock.mockResolvedValue({
    chunks: [
      {
        chunkId: "chunk-1",
        title: "Perazzi Brand Bible",
        sourcePath: "PerazziGPT/Brand_Info/Perazzi Brand Bible.md",
        content: "MX2000 balances tradition and modern handling.",
        score: 0.9,
      },
    ],
    maxScore: 0.9,
  });
  mockResponsesCreate.mockResolvedValue({
    output_text: "MX2000 offers a classic feel with bespoke balance.",
    id: "resp_test",
    usage: { input_tokens: 111, output_tokens: 222 },
  });

  const request = buildRequest({
    messages: [
      { role: "system", content: "User override" },
      { role: "user", content: "Should I pick the MX2000 or the High Tech?" },
    ],
    context: { mode: "prospect", locale: "en-US" },
  });

  const response = await routeModule.POST(request);
  const body = await response.json();

  expect(body.guardrail.status).toBe("ok");
  expect(body.guardrail.reason).toBeNull();
  expect(body.citations).toHaveLength(1);
  expect(body.answer).toContain("MX2000");
  expect(body.intents).toBeDefined();
  expect(body.topics).toBeDefined();
  expect(body.templates).toBeDefined();
  expect(body.citations[0]?.excerpt).toBeDefined();

  const responseCall = mockResponsesCreate.mock.calls[0]?.[0];
  expect(responseCall).toBeDefined();
  if (!responseCall) throw new Error("Response call not captured");
  expect(responseCall.instructions).not.toContain("User override");
  const inputMessages = (responseCall.input ?? []) as Array<{ role: string; content: string }>;
  expect(inputMessages).toHaveLength(1);
  expect(inputMessages[0]?.role).toBe("user");
  expect(inputMessages[0]?.content).toContain("High Tech?");
});

it("reflects low confidence threshold behavior", async () => {
  const original = process.env.PERAZZI_LOW_CONF_THRESHOLD;
  process.env.PERAZZI_LOW_CONF_THRESHOLD = "0.65";
  retrieveMock.mockResolvedValue({ chunks: [], maxScore: 0.05 });

  const request = buildRequest({
    messages: [{ role: "user", content: "Tell me about something obscure" }],
    context: { mode: "prospect", locale: "en-US" },
  });

  const response = await routeModule.POST(request);
  const body = await response.json();

  expect(body.guardrail.status).toBe("low_confidence");
  expect(body.similarity).toBeCloseTo(0.05, 2);
  expect(body.intents).toBeDefined();
  expect(body.topics).toBeDefined();
  expect(body.templates).toBeDefined();
  expect(mockResponsesCreate).not.toHaveBeenCalled();
  process.env.PERAZZI_LOW_CONF_THRESHOLD = original;
});

it("blocks pricing questions", async () => {
  const request = buildRequest({
    messages: [{ role: "user", content: "How much does an MX8 cost?" }],
  });

  const response = await routeModule.POST(request);
  const body = await response.json();

  expect(body.guardrail.status).toBe("blocked");
  expect(body.guardrail.reason).toBe("pricing");
  expect(body.answer).toContain("pricing");
});

it("blocks gunsmithing requests", async () => {
  const request = buildRequest({
    messages: [{ role: "user", content: "Can I modify the trigger myself?" }],
  });

  const response = await routeModule.POST(request);
  const body = await response.json();

  expect(body.guardrail.status).toBe("blocked");
  expect(body.guardrail.reason).toBe("gunsmithing");
  expect(body.answer).toContain("authorized Perazzi experts");
});

it("blocks legal advice requests", async () => {
  const request = buildRequest({
    messages: [{ role: "user", content: "Is it legal to import my Perazzi to Canada?" }],
  });

  const response = await routeModule.POST(request);
  const body = await response.json();

  expect(body.guardrail.status).toBe("blocked");
  expect(body.guardrail.reason).toBe("legal");
  expect(body.answer).toContain("legal guidance");
});

it("returns archetype analytics in debug payload on early return", async () => {
  const originalDebug = process.env.PERAZZI_ADMIN_DEBUG;
  const originalToken = process.env.PERAZZI_ADMIN_DEBUG_TOKEN;
  process.env.PERAZZI_ADMIN_DEBUG = "true";
  process.env.PERAZZI_ADMIN_DEBUG_TOKEN = "test-token";

  const request = new Request("http://localhost/api/perazzi-assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-perazzi-admin-debug": "test-token",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "How much does an MX8 cost?" }],
    }),
  });

  const response = await routeModule.POST(request);
  const body = await response.json();

  expect(body.debug?.archetypeAnalytics?.variant).toBeDefined();

  if (originalDebug === undefined) {
    delete process.env.PERAZZI_ADMIN_DEBUG;
  } else {
    process.env.PERAZZI_ADMIN_DEBUG = originalDebug;
  }

  if (originalToken === undefined) {
    delete process.env.PERAZZI_ADMIN_DEBUG_TOKEN;
  } else {
    process.env.PERAZZI_ADMIN_DEBUG_TOKEN = originalToken;
  }
});

describe("prompt cache wiring", () => {
  const originalRetention = process.env.PERAZZI_PROMPT_CACHE_RETENTION;
  const originalKey = process.env.PERAZZI_PROMPT_CACHE_KEY;

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

    vi.resetModules();
    vi.clearAllMocks();
  });

  it("forwards canonical prompt cache retention and key when env set", async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "in_memory";
    process.env.PERAZZI_PROMPT_CACHE_KEY = "abc-cache-key";

    vi.resetModules();
    const { mockResponsesCreate } = await import("../mocks/openai");
    const { POST } = await import("@/app/api/perazzi-assistant/route");

    mockResponsesCreate.mockReset();
    retrieveMock.mockReset();

    retrieveMock.mockResolvedValue({
      chunks: [
        {
          chunkId: "chunk-99",
          title: "Cache Test",
          sourcePath: "PerazziGPT/Brand_Info/Cache Test.md",
          content: "Cache test content.",
          score: 0.9,
        },
      ],
      maxScore: 0.9,
    });
    mockResponsesCreate.mockResolvedValue({
      output_text: "Cached response",
      id: "resp_cache",
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    const request = buildRequest({
      messages: [{ role: "user", content: "Test prompt cache" }],
      context: { mode: "prospect", locale: "en-US" },
    });

    const response = await POST(request);
    await response.json();

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.prompt_cache_retention).toBe("in_memory");
    expect(payload?.prompt_cache_key).toBe("abc-cache-key");
  });

  it("normalizes hyphenated retention to underscore form", async () => {
    process.env.PERAZZI_PROMPT_CACHE_RETENTION = "in-memory";
    delete process.env.PERAZZI_PROMPT_CACHE_KEY;

    vi.resetModules();
    const { mockResponsesCreate } = await import("../mocks/openai");
    const { POST } = await import("@/app/api/perazzi-assistant/route");

    mockResponsesCreate.mockReset();
    retrieveMock.mockReset();

    retrieveMock.mockResolvedValue({
      chunks: [
        {
          chunkId: "chunk-100",
          title: "Cache Test Hyphen",
          sourcePath: "PerazziGPT/Brand_Info/Cache Test Hyphen.md",
          content: "Cache test hyphen content.",
          score: 0.8,
        },
      ],
      maxScore: 0.8,
    });
    mockResponsesCreate.mockResolvedValue({
      output_text: "Hyphen response",
      id: "resp_cache_hyphen",
      usage: { input_tokens: 5, output_tokens: 6 },
    });

    const request = buildRequest({
      messages: [{ role: "user", content: "Test hyphen cache" }],
      context: { mode: "prospect", locale: "en-US" },
    });

    const response = await POST(request);
    await response.json();

    const payload = mockResponsesCreate.mock.calls[0]?.[0];
    expect(payload?.prompt_cache_retention).toBe("in_memory");
    expect(payload?.prompt_cache_key).toBeUndefined();
  });
});
