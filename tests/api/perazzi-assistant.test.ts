import type { PerazziAssistantRequest } from "@/types/perazzi-assistant";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
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
