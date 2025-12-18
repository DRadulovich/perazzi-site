#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fetch from "node-fetch";
import minimist from "minimist";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import { GENERAL_UNSOURCED_LABEL_PREFIX } from "@/lib/perazzi-evidence";
import type { PerazziAssistantResponse, ChatMessage } from "@/types/perazzi-assistant";

type TestResult = {
  name: string;
  ok: boolean;
  details?: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.length ? trimmed : "http://localhost:3000";
}

async function fetchJson(url: string, init: Parameters<typeof fetch>[1]) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  return { res, text, json };
}

async function waitForOk(url: string, timeoutMs: number): Promise<void> {
  const started = Date.now();
  let lastError: string | null = null;
  // Simple backoff: 50ms -> 250ms -> 1s
  const delays = [50, 250, 1000];
  let delayIdx = 0;

  while (Date.now() - started < timeoutMs) {
    try {
      const { res } = await fetchJson(url, { method: "GET" });
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(delays[Math.min(delayIdx, delays.length - 1)]);
    delayIdx += 1;
  }

  throw new Error(`Timeout waiting for server at ${url} (${lastError ?? "no response"})`);
}

function startDevServer(port: number): ChildProcessWithoutNullStreams {
  const child = spawn(
    "npm",
    ["run", "dev", "--", "-p", String(port)],
    {
      env: { ...process.env, PORT: String(port) },
      stdio: "pipe",
    },
  );
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function requestAssistant(params: {
  baseUrl: string;
  messages: ChatMessage[];
  previousResponseId?: string | null;
  sessionId?: string | null;
  context?: Record<string, unknown>;
  adminDebugToken?: string | null;
}): Promise<PerazziAssistantResponse> {
  const payload = {
    messages: params.messages,
    previousResponseId: params.previousResponseId ?? null,
    sessionId: params.sessionId ?? null,
    context: params.context ?? {
      pageUrl: "/eval",
      mode: "prospect",
      locale: "en-US",
    },
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (params.adminDebugToken) {
    headers["x-perazzi-admin-debug"] = params.adminDebugToken;
  }

  const { res, text, json } = await fetchJson(`${params.baseUrl}/api/perazzi-assistant`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 400)}`);
  }

  assert(json && typeof json === "object", "Expected JSON response object.");
  return json as PerazziAssistantResponse;
}

function requireDebug(
  response: PerazziAssistantResponse,
  testName: string,
): NonNullable<PerazziAssistantResponse["debug"]> {
  const debug = response.debug;
  assert(debug && typeof debug === "object", `${testName}: missing response.debug (admin debug not enabled?)`);
  return debug;
}

async function runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
  try {
    await fn();
    return { name, ok: true };
  } catch (error) {
    return {
      name,
      ok: false,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    boolean: ["start", "verbose", "allow-no-debug", "intentionally-fail"],
    string: ["base-url"],
    default: {
      start: false,
      verbose: false,
      "allow-no-debug": false,
      "intentionally-fail": false,
    },
  });

  const port = Number(process.env.PERAZZI_EVAL_PORT ?? 3000);
  const requestedBaseUrl = normalizeBaseUrl(
    (argv["base-url"] as string | undefined) ??
      process.env.PERAZZI_EVAL_BASE_URL ??
      `http://localhost:${port}`,
  );

  const adminDebugToken = (process.env.PERAZZI_ADMIN_DEBUG_TOKEN ?? "").trim() || null;
  const requireAdminDebug = Boolean(adminDebugToken) && !Boolean(argv["allow-no-debug"]);

  const shouldAutoStart =
    Boolean(argv.start) || process.env.PERAZZI_EVAL_AUTOSTART === "1" || process.env.PERAZZI_EVAL_AUTOSTART === "true";

  const sessionId = "perazzi-eval-smoke";
  const perazziRetrievalPrompt =
    "Explain the practical difference between the Perazzi High Tech platform and the MX8 platform for a sporting clays shooter. Focus on feel and intended use, and avoid purchase guidance. End with 1 clarifying question.";
  const makeShorterPrompt = "Make that shorter and keep only the key differences in 4 bullet points.";
  const generalLabelPrompt =
    "TL;DR: Give 3 general guidelines for choosing an over/under shotgun for sporting clays. Do not mention any brands. Keep it under 120 words.";
  const pricingBlockedPrompt = "What does a new Perazzi High Tech cost?";

  const baseUrl = shouldAutoStart ? `http://localhost:${port}` : requestedBaseUrl;

  console.log(
    JSON.stringify(
      {
        ok: true,
        runner: "scripts/perazzi-eval/smoke.ts",
        baseUrl,
        autoStart: shouldAutoStart,
        requireAdminDebug,
        hasAdminDebugToken: Boolean(adminDebugToken),
        notes: shouldAutoStart
          ? "Auto-start enabled: launches `npm run dev` and waits for it to respond."
          : "Default: assumes a dev/prod server is already running at PERAZZI_EVAL_BASE_URL (or http://localhost:3000).",
      },
      null,
      2,
    ),
  );

  let devProc: ChildProcessWithoutNullStreams | null = null;
  try {
    if (shouldAutoStart) {
      devProc = startDevServer(port);
      await waitForOk(baseUrl, 120_000);
    }

    // --- Test 1: Turn 1 OpenAI path + Perazzi retrieval ---
    let turn1: PerazziAssistantResponse | null = null;
    let turn1ResponseId: string | null = null;
    let turn1Answer: string | null = null;

    // --- Test 2: Turn 2 thread continuity + retrieval skip + thread-only input enforcement ---
    let turn2: PerazziAssistantResponse | null = null;
    let turn2ResponseId: string | null = null;
    let turn2Answer: string | null = null;

    const results: TestResult[] = [];

    results.push(
      await runTest("turn1: perazzi retrieval + responseId", async () => {
        turn1 = await requestAssistant({
          baseUrl,
          adminDebugToken,
          sessionId,
          messages: [{ role: "user", content: perazziRetrievalPrompt }],
          context: { pageUrl: "/shotguns", mode: "prospect", locale: "en-US" },
        });

        assert(typeof turn1.answer === "string" && turn1.answer.length > 0, "Expected non-empty answer.");
        turn1Answer = turn1.answer;
        turn1ResponseId = asString(turn1.responseId);
        assert(turn1ResponseId, "Expected responseId on OpenAI-backed response.");

        if (requireAdminDebug) {
          const debug = requireDebug(turn1, "turn1");
          assert(debug.openai, "turn1: expected debug.openai");
          assert(debug.openai.input_item_count === 1, "turn1: expected OpenAI input_item_count == 1");
          assert(
            debug.openai.input_counts_by_role?.user === 1,
            "turn1: expected OpenAI input_counts_by_role.user == 1",
          );
          assert(debug.retrieval.attempted === true, "turn1: expected retrieval.attempted === true");
          assert(debug.retrieval.chunk_count > 0, "turn1: expected retrieval.chunk_count > 0");
          assert(
            debug.triggers?.evidenceMode === "perazzi_sourced",
            `turn1: expected triggers.evidenceMode === "perazzi_sourced" (got ${String(
              debug.triggers?.evidenceMode,
            )})`,
          );
          assert(
            turn1.citations.length === debug.retrieval.chunk_count,
            "turn1: expected citations.length === debug.retrieval.chunk_count",
          );
        }
      }),
    );

    results.push(
      await runTest("turn2: thread continuity + retrieval skip + thread-only input", async () => {
        assert(turn1ResponseId, "turn2 requires turn1 responseId");
        assert(turn1Answer, "turn2 requires turn1 answer");

        const messages: ChatMessage[] = [
          { role: "user", content: perazziRetrievalPrompt },
          { role: "assistant", content: turn1Answer },
          { role: "user", content: makeShorterPrompt },
        ];

        turn2 = await requestAssistant({
          baseUrl,
          adminDebugToken,
          sessionId,
          previousResponseId: turn1ResponseId,
          messages,
          context: { pageUrl: "/shotguns", mode: "prospect", locale: "en-US" },
        });

        turn2Answer = turn2.answer;
        turn2ResponseId = asString(turn2.responseId);
        assert(turn2ResponseId, "turn2: expected responseId on OpenAI-backed response.");
        assert(
          typeof turn2Answer === "string" && turn2Answer.length > 0,
          "turn2: expected non-empty answer.",
        );

        if (requireAdminDebug) {
          const debug = requireDebug(turn2, "turn2");
          assert(debug.thread.previous_response_id_present === true, "turn2: expected previous_response_id_present=true");
          assert(debug.thread.conversationStrategy === "thread", "turn2: expected conversationStrategy=thread");
          assert(debug.thread.enforced_thread_input === true, "turn2: expected enforced_thread_input=true");

          assert(debug.openai, "turn2: expected debug.openai");
          assert(debug.openai.input_item_count === 1, "turn2: expected OpenAI input_item_count == 1");
          assert(debug.openai.input_counts_by_role?.user === 1, "turn2: expected OpenAI role.user == 1");

          assert(debug.retrieval.attempted === false, "turn2: expected retrieval.attempted=false");
          assert(debug.retrieval.skipped === true, "turn2: expected retrieval.skipped=true");
          assert(debug.retrieval.reason === "chat_meta", `turn2: expected retrieval.reason=chat_meta`);
          assert(
            debug.triggers?.evidenceMode === "general_unsourced",
            `turn2: expected triggers.evidenceMode === "general_unsourced"`,
          );
          assert(
            debug.output?.general_unsourced_label_present === true,
            "turn2: expected output.general_unsourced_label_present=true",
          );
          assert(
            turn2Answer.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
            "turn2: expected general_unsourced label prefix in answer",
          );
        }
      }),
    );

    results.push(
      await runTest("general label: general_unsourced + label prefix", async () => {
        const response = await requestAssistant({
          baseUrl,
          adminDebugToken,
          sessionId,
          messages: [{ role: "user", content: generalLabelPrompt }],
          context: { pageUrl: "/eval/general", mode: "prospect", locale: "en-US" },
        });

        assert(typeof response.answer === "string" && response.answer.length > 0, "Expected non-empty answer.");
        assert(
          response.answer.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
          "Expected general_unsourced label prefix.",
        );
        assert(response.citations.length === 0, "Expected citations.length == 0 when retrieval is skipped.");
        assert(asString(response.responseId), "Expected responseId for OpenAI-backed response.");

        if (requireAdminDebug) {
          const debug = requireDebug(response, "general label");
          assert(debug.retrieval.attempted === false, "expected retrieval.attempted=false");
          assert(debug.retrieval.skipped === true, "expected retrieval.skipped=true");
          assert(debug.retrieval.reason === "chat_meta", "expected retrieval.reason=chat_meta");
          assert(debug.triggers?.evidenceMode === "general_unsourced", "expected triggers.evidenceMode=general_unsourced");
          assert(debug.output?.general_unsourced_label_present === true, "expected output.general_unsourced_label_present=true");
        }
      }),
    );

    results.push(
      await runTest("guardrail: pricing refusal", async () => {
        const response = await requestAssistant({
          baseUrl,
          adminDebugToken,
          sessionId,
          messages: [{ role: "user", content: pricingBlockedPrompt }],
          context: { pageUrl: "/shotguns/high-tech", mode: "prospect", locale: "en-US" },
        });

        assert(response.guardrail?.status === "blocked", "Expected guardrail.status=blocked");
        assert(response.guardrail?.reason === "pricing", "Expected guardrail.reason=pricing");
        assert(response.answer === BLOCKED_RESPONSES.pricing, "Expected strict pricing refusal text.");
        assert(!asString(response.responseId), "Expected no responseId on early-return guardrail.");

        if (requireAdminDebug) {
          const debug = requireDebug(response, "guardrail");
          assert(debug.retrieval.attempted === false, "expected retrieval.attempted=false");
          assert(debug.retrieval.skipped === true, "expected retrieval.skipped=true");
          assert(
            (debug.retrieval.reason ?? "").startsWith("early_return:guardrail:pricing"),
            "expected early_return:guardrail:pricing reason",
          );
          assert(debug.triggers?.blocked_intent === "pricing", "expected triggers.blocked_intent=pricing");
        }
      }),
    );

    results.push(
      await runTest("long chat: 5 meta turns stable", async () => {
        assert(turn2ResponseId, "long chat requires turn2 responseId");
        assert(turn2Answer, "long chat requires turn2 answer");

        const prompts = [
          "Rewrite that as 2 short sentences.",
          "Rewrite it as a single paragraph under 80 words.",
          "Rewrite it as a numbered list of 4 items.",
          "Rewrite it as 3 questions you would ask me to tailor the recommendation.",
          "Summarize it in one line.",
        ];

        let previousId: string | null = turn2ResponseId;
        let lastAssistantText: string = turn2Answer;

        for (let i = 0; i < prompts.length; i += 1) {
          const prompt = prompts[i]!;
          const response = await requestAssistant({
            baseUrl,
            adminDebugToken,
            sessionId,
            previousResponseId: previousId,
            messages: [
              { role: "user", content: perazziRetrievalPrompt },
              { role: "assistant", content: lastAssistantText },
              { role: "user", content: prompt },
            ],
            context: { pageUrl: "/shotguns", mode: "prospect", locale: "en-US" },
          });

          const newId = asString(response.responseId);
          assert(newId, `turn ${i + 3}: expected responseId`);

          if (requireAdminDebug) {
            const debug = requireDebug(response, `long chat turn ${i + 3}`);
            assert(debug.thread.previous_response_id_present === true, `turn ${i + 3}: expected previous_response_id_present=true`);
            assert(debug.thread.enforced_thread_input === true, `turn ${i + 3}: expected enforced_thread_input=true`);
            assert(debug.openai?.input_item_count === 1, `turn ${i + 3}: expected OpenAI input_item_count == 1`);
            assert(debug.retrieval.attempted === false, `turn ${i + 3}: expected retrieval.attempted=false`);
            assert(debug.retrieval.reason === "chat_meta", `turn ${i + 3}: expected retrieval.reason=chat_meta`);
          }

          previousId = newId;
          lastAssistantText = response.answer;
        }
      }),
    );

    // Optional negative-check to prove non-zero exit behavior.
    if (argv["intentionally-fail"]) {
      results.push({
        name: "intentional failure check",
        ok: false,
        details: "Requested via --intentionally-fail",
      });
    }

    const failed = results.filter((r) => !r.ok);
    const passed = results.filter((r) => r.ok);

    const summary = {
      ok: failed.length === 0,
      passed: passed.length,
      failed: failed.length,
      results,
    };

    console.log(JSON.stringify(summary, null, 2));
    if (failed.length) process.exitCode = 1;
  } finally {
    if (devProc && !devProc.killed) {
      devProc.kill("SIGTERM");
      await delay(200);
      if (!devProc.killed) devProc.kill("SIGKILL");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
