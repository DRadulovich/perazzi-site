#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });

import fetch from "node-fetch";
import minimist from "minimist";
import { spawn, type ChildProcess } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import { GENERAL_UNSOURCED_LABEL_PREFIX } from "@/lib/perazzi-evidence";
import type { PerazziAssistantResponse, ChatMessage } from "@/types/perazzi-assistant";

type SmokeSummary = {
  ok: true;
  runner: "scripts/perazzi-eval/smoke.ts";
  baseUrl: string;
  requestCount: number;
  tests: string[];
  durationMs: number;
};

function fail(message: string): never {
  throw new Error(message);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

function assertEqual<T>(name: string, got: T, expected: T): void {
  if (got !== expected) {
    fail(`${name}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(got)}`);
  }
}

const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "::1"];

function parseAllowedHosts(value: string | undefined): Set<string> {
  if (!value) return new Set(DEFAULT_ALLOWED_HOSTS);
  const hosts = value
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set(hosts.length ? hosts : DEFAULT_ALLOWED_HOSTS);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.length ? trimmed : "http://localhost:3333";
}

function parseAndValidateUrl(value: string, allowedHosts: Set<string>): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail(`Invalid URL "${value}". Expected http(s)://host[:port].`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail(`Unsupported URL protocol "${url.protocol}" in "${value}".`);
  }
  if (url.username || url.password) {
    fail(`URL "${value}" must not include credentials.`);
  }
  const hostname = url.hostname.toLowerCase();
  if (!allowedHosts.has(hostname)) {
    const allowed = Array.from(allowedHosts).sort((a, b) => a.localeCompare(b)).join(", ");
    fail(`URL host "${hostname}" is not in allowlist (${allowed}). Set PERAZZI_EVAL_ALLOWED_HOSTS to override.`);
  }
  return url;
}

function assertAllowedBaseUrl(value: string, allowedHosts: Set<string>): string {
  const url = parseAndValidateUrl(value, allowedHosts);
  const normalizedPath = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${normalizedPath}`;
}

function assertAllowedUrl(value: string, allowedHosts: Set<string>): string {
  return parseAndValidateUrl(value, allowedHosts).toString();
}

async function fetchJson(url: string, init: Parameters<typeof fetch>[1], allowedHosts: Set<string>) {
  const safeUrl = assertAllowedUrl(url, allowedHosts);
  const res = await fetch(safeUrl, init);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  return { res, text, json };
}

async function waitForOk(url: string, timeoutMs: number, allowedHosts: Set<string>): Promise<void> {
  const started = Date.now();
  let lastError: string | null = null;
  // Simple backoff: 50ms -> 250ms -> 1s
  const delays = [50, 250, 1000];
  let delayIdx = 0;

  while (Date.now() - started < timeoutMs) {
    try {
      const { res } = await fetchJson(url, { method: "GET" }, allowedHosts);
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

function startDevServer(port: number, verbose: boolean): ChildProcess {
  return spawn("npm", ["run", "dev", "--", "-p", String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: verbose ? "inherit" : "ignore",
  });
}

async function requestAssistant(params: {
  baseUrl: string;
  messages: ChatMessage[];
  previousResponseId?: string | null;
  sessionId?: string | null;
  context?: Record<string, unknown>;
  adminDebugToken: string;
  requestCountRef: { count: number };
  allowedHosts: Set<string>;
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-perazzi-admin-debug": params.adminDebugToken,
  };

  params.requestCountRef.count += 1;
  const { res, text, json } = await fetchJson(`${params.baseUrl}/api/perazzi-assistant`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  }, params.allowedHosts);

  if (!res.ok) {
    fail(`Request failed (${res.status}): ${text.slice(0, 400)}`);
  }

  assert(json && typeof json === "object", "Expected JSON response object.");
  return json as PerazziAssistantResponse;
}

function requireDebug(
  response: PerazziAssistantResponse,
  testName: string,
): NonNullable<PerazziAssistantResponse["debug"]> {
  const debug = response.debug;
  assert(
    debug && typeof debug === "object",
    `${testName}: Debug not authorized (check PERAZZI_ADMIN_DEBUG + token header)`,
  );
  return debug;
}

async function runTest(name: string, fn: () => Promise<void>, tests: string[]): Promise<void> {
  try {
    await fn();
    tests.push(name);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    fail(`${name}: ${msg}`);
  }
}

function parsePortFromBaseUrl(baseUrl: string): number {
  try {
    const url = new URL(baseUrl);
    if (url.port) return Number(url.port);
    if (url.protocol === "https:") return 443;
    return 80;
  } catch {
    return 3333;
  }
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    boolean: ["start", "intentionally-fail", "verbose"],
    string: ["base-url"],
    default: {
      start: false,
      "intentionally-fail": false,
      verbose: false,
    },
  });

  const baseUrl = normalizeBaseUrl(
    (argv["base-url"] as string | undefined) ?? process.env.PERAZZI_EVAL_BASE_URL ?? "http://localhost:3333",
  );
  const allowedHosts = parseAllowedHosts(process.env.PERAZZI_EVAL_ALLOWED_HOSTS);
  const baseUrlAllowed = assertAllowedBaseUrl(baseUrl, allowedHosts);
  const port = parsePortFromBaseUrl(baseUrlAllowed);

  const adminDebugToken = (process.env.PERAZZI_ADMIN_DEBUG_TOKEN ?? "").trim();
  if (!adminDebugToken) {
    fail("Missing PERAZZI_ADMIN_DEBUG_TOKEN (required for deterministic assertions).");
  }

  const shouldAutoStart = Boolean(argv.start);

  const sessionId = "perazzi-eval-smoke";
  const perazziRetrievalPrompt =
    "Perazzi question: In sporting clays, what’s the practical feel difference between the High Tech platform and an MX8? Keep it concise and end with 1 clarifying question.";
  const makeShorterPrompt = "Make that shorter. Keep only the key differences in 4 bullet points.";
  const generalLabelPrompt =
    "TL;DR: Give 3 general guidelines for choosing an over/under shotgun for sporting clays. Do not mention any brands. Under 120 words.";
  const pricingBlockedPrompt = "What does a new Perazzi High Tech cost?";

  const tests: string[] = [];
  const requestCountRef = { count: 0 };
  const startedAt = Date.now();

  let devProc: ChildProcess | null = null;
  try {
    if (shouldAutoStart) {
      devProc = startDevServer(port, Boolean(argv.verbose));
      await waitForOk(baseUrlAllowed, 120_000, allowedHosts);
    } else {
      await waitForOk(baseUrlAllowed, 10_000, allowedHosts);
    }

    if (argv["intentionally-fail"]) {
      fail("Intentional failure requested via --intentionally-fail");
    }

    // --- Test 1: Turn 1 OpenAI path + Perazzi retrieval ---
    let turn1ResponseId: string | null = null;
    let turn1Answer: string | null = null;

    await runTest(
      "turn1: perazzi retrieval + responseId",
      async () => {
        const turn1 = await requestAssistant({
          baseUrl: baseUrlAllowed,
          adminDebugToken,
          sessionId,
          messages: [{ role: "user", content: perazziRetrievalPrompt }],
          context: { pageUrl: "/shotguns", mode: "prospect", locale: "en-US" },
          requestCountRef,
          allowedHosts,
        });

        assert(typeof turn1.answer === "string" && turn1.answer.length > 0, "Expected non-empty answer.");
        assert(!turn1.answer.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX), "Expected NO general_unsourced label on Perazzi-sourced answer.");
        turn1Answer = turn1.answer;

        turn1ResponseId = asString(turn1.responseId);
        assert(turn1ResponseId, "Expected responseId on OpenAI-backed response.");

        const debug = requireDebug(turn1, "turn1");
        assert(debug.openai, "turn1: expected debug.openai");
        assertEqual("turn1.openai.input_item_count", debug.openai.input_item_count, 1);
        assertEqual("turn1.openai.input_counts_by_role.user", debug.openai.input_counts_by_role["user"] ?? 0, 1);

        assertEqual("turn1.retrieval.attempted", debug.retrieval.attempted, true);
        assert(
          debug.retrieval.chunk_count > 0,
          "turn1: expected retrieval.chunk_count > 0 (configure PERAZZI_RETRIEVAL_POLICY=hybrid and ingest corpus/vector DB)",
        );
        assertEqual("turn1.triggers.evidenceMode", debug.triggers?.evidenceMode ?? null, "perazzi_sourced");
        assertEqual("turn1.citations.length", turn1.citations.length, debug.retrieval.chunk_count);
      },
      tests,
    );

    // --- Test 2: Turn 2 thread continuity + retrieval skip + thread-only input enforcement ---
    let turn2ResponseId: string | null = null;
    let turn2Answer: string | null = null;

    await runTest(
      "turn2: continuity + chat_meta skip + thread-only OpenAI input",
      async () => {
        assert(turn1ResponseId, "turn2 requires turn1 responseId");
        assert(turn1Answer, "turn2 requires turn1 answer");

        const messages: ChatMessage[] = [
          { role: "user", content: perazziRetrievalPrompt },
          { role: "assistant", content: turn1Answer },
          { role: "user", content: makeShorterPrompt },
        ];

        const turn2 = await requestAssistant({
          baseUrl: baseUrlAllowed,
          adminDebugToken,
          sessionId,
          previousResponseId: turn1ResponseId,
          messages,
          context: { pageUrl: "/shotguns", mode: "prospect", locale: "en-US" },
          requestCountRef,
          allowedHosts,
        });

        turn2Answer = turn2.answer;
        turn2ResponseId = asString(turn2.responseId);
        assert(turn2ResponseId, "turn2: expected responseId on OpenAI-backed response.");
        assert(typeof turn2Answer === "string" && turn2Answer.length > 0, "turn2: expected non-empty answer.");

        const debug = requireDebug(turn2, "turn2");
        assertEqual("turn2.thread.previous_response_id_present", debug.thread.previous_response_id_present, true);

        assert(debug.openai, "turn2: expected debug.openai");
        assertEqual("turn2.openai.input_item_count", debug.openai.input_item_count, 1);
        assertEqual("turn2.openai.input_counts_by_role.user", debug.openai.input_counts_by_role["user"] ?? 0, 1);

        assertEqual("turn2.retrieval.skipped", debug.retrieval.skipped, true);
        assertEqual("turn2.retrieval.reason", debug.retrieval.reason, "chat_meta");
      },
      tests,
    );

    // --- Test 3: General label enforcement on general_unsourced output ---
    await runTest(
      "general label: general_unsourced prefix present",
      async () => {
        const response = await requestAssistant({
          baseUrl: baseUrlAllowed,
          adminDebugToken,
          sessionId,
          messages: [{ role: "user", content: generalLabelPrompt }],
          context: { pageUrl: "/eval/general", mode: "prospect", locale: "en-US" },
          requestCountRef,
          allowedHosts,
        });

        assert(typeof response.answer === "string" && response.answer.length > 0, "Expected non-empty answer.");
        assert(
          response.answer.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX),
          "Expected GENERAL_UNSOURCED_LABEL_PREFIX at start of answer.",
        );

        const debug = requireDebug(response, "general label");
        assertEqual("generalLabel.retrieval.skipped", debug.retrieval.skipped, true);
        assertEqual("generalLabel.retrieval.reason", debug.retrieval.reason, "chat_meta");
        assertEqual(
          "generalLabel.output.general_unsourced_label_present",
          debug.output?.general_unsourced_label_present ?? false,
          true,
        );
      },
      tests,
    );

    // --- Test 4: Guardrail refusal (pricing) ---
    await runTest(
      "guardrail: pricing refusal exact text",
      async () => {
        const response = await requestAssistant({
          baseUrl: baseUrlAllowed,
          adminDebugToken,
          sessionId,
          messages: [{ role: "user", content: pricingBlockedPrompt }],
          context: { pageUrl: "/shotguns/high-tech", mode: "prospect", locale: "en-US" },
          requestCountRef,
          allowedHosts,
        });

        assertEqual("pricing.guardrail.status", response.guardrail?.status, "blocked");
        assertEqual("pricing.guardrail.reason", response.guardrail?.reason, "pricing");
        assertEqual("pricing.answer", response.answer, BLOCKED_RESPONSES.pricing);

        const debug = requireDebug(response, "pricing guardrail");
        assertEqual("pricing.retrieval.skipped", debug.retrieval.skipped, true);
        assert((debug.retrieval.reason ?? "").startsWith("early_return:guardrail:pricing"), "Expected early_return:guardrail:pricing reason.");
      },
      tests,
    );

    // --- Test 5: Long chat mini-run (5 turns) thread-only + chat_meta skip ---
    await runTest(
      "long chat: 5 meta turns stable",
      async () => {
        assert(turn2ResponseId, "long chat requires turn2 responseId");
        assert(turn2Answer, "long chat requires turn2 answer");

        const prompts = [
          "Rewrite that as 2 short sentences.",
          "Rewrite it as a single paragraph under 80 words.",
          "Rewrite it as a numbered list of 4 items.",
          "Rewrite it as 3 clarifying questions you’d ask me next.",
          "Summarize it in one line.",
        ];

        let previousId: string | null = turn2ResponseId;
        let lastAssistantText: string = turn2Answer;
        let consecutiveThreadResetMessages = 0;

        for (const [i, prompt] of prompts.entries()) {
          const turnNumber = i + 3;
          const response = await requestAssistant({
            baseUrl: baseUrlAllowed,
            adminDebugToken,
            sessionId,
            previousResponseId: previousId,
            messages: [
              { role: "user", content: perazziRetrievalPrompt },
              { role: "assistant", content: lastAssistantText },
              { role: "user", content: prompt },
            ],
            context: { pageUrl: "/shotguns", mode: "prospect", locale: "en-US" },
            requestCountRef,
            allowedHosts,
          });

          assert(
            typeof response.answer === "string" && response.answer.length > 0,
            `turn ${turnNumber}: expected non-empty answer`,
          );
          const newId = asString(response.responseId);
          assert(newId, `turn ${turnNumber}: expected responseId`);

          const debug = requireDebug(response, `long chat turn ${turnNumber}`);
          assertEqual(`turn ${turnNumber}.thread.previous_response_id_present`, debug.thread.previous_response_id_present, true);
          assertEqual(`turn ${turnNumber}.openai.input_item_count`, debug.openai?.input_item_count ?? 0, 1);
          assertEqual(
            `turn ${turnNumber}.openai.input_counts_by_role.user`,
            debug.openai?.input_counts_by_role?.["user"] ?? 0,
            1,
          );
          assertEqual(`turn ${turnNumber}.retrieval.skipped`, debug.retrieval.skipped, true);
          assertEqual(`turn ${turnNumber}.retrieval.reason`, debug.retrieval.reason, "chat_meta");

          const isThreadReset = Boolean(response.thread_reset_required || debug.thread.thread_reset_required);
          const looksLikeThreadResetMessage = response.answer.startsWith("Quick rebuild:");
          if (looksLikeThreadResetMessage) consecutiveThreadResetMessages += 1;
          else consecutiveThreadResetMessages = 0;
          assert(
            !looksLikeThreadResetMessage || isThreadReset,
            `turn ${turnNumber}: got thread-reset rebuild message but thread_reset_required was false`,
          );
          assert(
            consecutiveThreadResetMessages <= 1 || isThreadReset,
            `turn ${turnNumber}: repeated thread-reset loop without thread_reset_required=true`,
          );

          previousId = newId;
          lastAssistantText = response.answer;
        }
      },
      tests,
    );

    const summary: SmokeSummary = {
      ok: true,
      runner: "scripts/perazzi-eval/smoke.ts",
      baseUrl: baseUrlAllowed,
      requestCount: requestCountRef.count,
      tests,
      durationMs: Date.now() - startedAt,
    };

    console.log(JSON.stringify(summary));
  } finally {
    if (devProc && !devProc.killed) {
      devProc.kill("SIGTERM");
      await delay(200);
      if (!devProc.killed) devProc.kill("SIGKILL");
    }
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
