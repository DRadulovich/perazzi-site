import { vi } from "vitest";

export const mockChatCreate = vi.fn();
export const mockResponsesCreate = vi.fn();
export const mockEmbeddingCreate = vi.fn();

vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: mockChatCreate } };
    responses = { create: mockResponsesCreate };
    embeddings = { create: mockEmbeddingCreate };
  }
  return { default: MockOpenAI };
});

if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = "test-openai-key";
}
