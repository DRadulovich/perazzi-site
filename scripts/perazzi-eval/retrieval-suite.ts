#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import minimist from "minimist";
import { createEmbeddings } from "@/lib/aiClient";
import { detectRetrievalHints } from "@/lib/perazzi-intents";
import { getRerankCandidateLimit, retrievePerazziContextWithEmbedding } from "@/lib/perazzi-retrieval";
import type { PerazziAssistantRequest, PerazziMode } from "@/types/perazzi-assistant";

const VALIDATION_SOURCE =
  "PGPT/V2/AI-Docs/P2/Validation.md";
const PROJECT_ROOT = path.resolve(process.cwd());

type RetrievalCase = {
  id: string;
  name: string;
  query: string;
  expectedFamilies: string[];
  minHits?: number;
  forbiddenPathPrefixes?: string[];
  forbiddenCategories?: string[];
  forbiddenDocTypes?: string[];
  sourceSection: string;
};

const RETRIEVAL_CASES: RetrievalCase[] = [
  {
    id: "prospect-platform-diff",
    name: "Prospect - Platform differentiation",
    query: "What's the difference between the MX and the HT platforms?",
    expectedFamilies: [
      "Gun-Info/Models-SpecText-Corpus.md",
      "PGPT/V2/Gun-Info/Base-Models-Corpus.md",
      "Gun-Info/Platforms-Corpus.md",
      "Making-A-Perazzi/1_Product-and-System-Overview.md",
      "Brand-Ethos.md",
    ],
    forbiddenPathPrefixes: ["Pricing-Lists/"],
    sourceSection: "2.2.1",
  },
  {
    id: "prospect-bespoke-journey",
    name: "Prospect - Bespoke journey",
    query: "How does the bespoke build process work at Perazzi?",
    expectedFamilies: [
      "Making-A-Perazzi/1_Product-and-System-Overview.md",
      "Making-A-Perazzi/",
    ],
    forbiddenPathPrefixes: ["Pricing-Lists/"],
    sourceSection: "2.2.2",
  },
  {
    id: "owner-service-timing",
    name: "Owner - Service & timing",
    query: "My top lever is nearing center. What should I do?",
    expectedFamilies: [
      "Company-Info/Recommended-Service-Centers.md",
      "Company-Info/Authorized-Dealers.md",
      "Making-A-Perazzi/",
      "Company-Info/Consumer-Warning.md",
    ],
    sourceSection: "2.2.3",
  },
  {
    id: "owner-year-of-manufacture",
    name: "Owner - Year of manufacture",
    query: "What year was my Perazzi made if my serial is XXXXX?",
    expectedFamilies: ["Gun-Info/Manufacture-Year.md"],
    sourceSection: "2.2.4",
  },
  {
    id: "navigation-dealer-locator",
    name: "Navigation - Dealer locator",
    query: "Where can I find a Perazzi dealer near me?",
    expectedFamilies: [
      "Company-Info/Authorized-Dealers.md",
      "Operational/Site-Overview.md",
    ],
    sourceSection: "2.2.5",
  },
  {
    id: "rerank-platform-comparison",
    name: "Rerank - Platform comparison (MX8 vs High Tech)",
    query: "What's the difference between the MX8 and the High Tech?",
    expectedFamilies: [
      "Gun-Info/Models-SpecText-Corpus.md",
      "PGPT/V2/Gun-Info/Base-Models-Corpus.md",
      "Gun-Info/Platforms-Corpus.md",
      "Making-A-Perazzi/1_Product-and-System-Overview.md",
      "Brand-Ethos.md",
    ],
    forbiddenPathPrefixes: ["Pricing-Lists/"],
    sourceSection: "2.4",
  },
];

type EmbeddingCacheEntry = {
  id?: string;
  query?: string;
  embedding: number[];
};

type EmbeddingCache =
  | {
      model?: string;
      queries?: Record<string, number[]>;
      byId?: Record<string, number[]>;
      byQuery?: Record<string, number[]>;
      [key: string]: unknown;
    }
  | EmbeddingCacheEntry[]
  | Record<string, number[]>;

type ResultRow = {
  rank: number;
  chunkId: string;
  documentPath: string | null;
  headingPath: string | null;
  category: string | null;
  docType: string | null;
  baseScore: number;
  boost: number | null;
  archetypeBoost: number | null;
  finalScore: number;
  expectedMatch: boolean;
  forbiddenMatch: boolean;
};

type CaseResult = {
  id: string;
  name: string;
  query: string;
  sourceSection: string;
  expectedFamilies: string[];
  minHits: number;
  rerankEnabled: boolean;
  candidateLimit: number;
  pass: boolean;
  reason: string;
  expectedHits: number;
  forbiddenHits: number;
  matchedFamilies: string[];
  results: ResultRow[];
};

type CliOptions = {
  k: number;
  candidateLimit: number | null;
  rerankEnabled: boolean;
  minHitsGlobal: number | null;
  reportPath: string;
  embeddingCachePath: string | null;
  embeddingModel: string;
};

type EmbeddingState = {
  embeddingCache: EmbeddingCache | null;
  embeddingsById: Map<string, number[]>;
};

type RetrievalResponse = Awaited<ReturnType<typeof retrievePerazziContextWithEmbedding>>;

function fail(message: string): never {
  throw new Error(message);
}

function normalizePathToken(value: string): string {
  return value.replaceAll("\\", "/").trim().toLowerCase();
}

function matchesFamily(docPath: string | null | undefined, family: string): boolean {
  if (!docPath) return false;
  const doc = normalizePathToken(docPath);
  const fam = normalizePathToken(family);
  if (!fam) return false;
  if (doc === fam) return true;
  if (doc.startsWith(fam)) return true;
  if (doc.endsWith(fam)) return true;
  if (doc.includes(`/${fam}`)) return true;
  return false;
}

function matchesAnyFamily(docPath: string | null | undefined, families: string[] | undefined): boolean {
  if (!families?.length) return false;
  return families.some((family) => matchesFamily(docPath, family));
}

function normalizeList(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function parseBooleanString(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function parseNumber(value: unknown, fallback: number, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) fail(`${label} must be a positive number.`);
  return Math.floor(n);
}

function parseOptionalNumber(value: unknown, fallback: number, label: string): number | null {
  if (value === undefined || value === null) return null;
  return parseNumber(value, fallback, label);
}

function ensurePathWithinBase(basePath: string, targetPath: string, label: string): string {
  const normalizedBase = path.resolve(basePath);
  const normalizedTarget = path.normalize(targetPath);
  const relative = path.relative(normalizedBase, normalizedTarget);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} must resolve within ${normalizedBase}.`);
  }
  return normalizedTarget;
}

function resolveCliPath(value: unknown, label: string): string {
  const normalized = Array.isArray(value) ? value.at(-1) : value;
  if (typeof normalized !== "string" || !normalized.trim()) {
    fail(`${label} must be a non-empty string.`);
  }
  const input = normalized.trim();
  const resolved = path.resolve(PROJECT_ROOT, input);
  return ensurePathWithinBase(PROJECT_ROOT, resolved, label);
}

function formatScore(value: number | null | undefined): string {
  if (!Number.isFinite(value)) return "n/a";
  return Number(value).toFixed(4);
}

function formatOptionalScore(label: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return ` ${label}=${formatScore(value)}`;
}

function resolveMinHits(caseItem: RetrievalCase, globalMinHits?: number | null): number {
  if (Number.isFinite(caseItem.minHits)) return Math.max(1, Math.floor(caseItem.minHits!));
  if (Number.isFinite(globalMinHits)) return Math.max(1, Math.floor(globalMinHits!));
  return Math.max(1, Math.min(2, caseItem.expectedFamilies.length));
}

function resolveEmbeddingFromCache(cache: EmbeddingCache, testCase: RetrievalCase): number[] | null {
  if (Array.isArray(cache)) {
    const match = cache.find(
      (entry) => entry && typeof entry === "object" && (entry.id === testCase.id || entry.query === testCase.query),
    );
    const embedding = match?.embedding;
    return Array.isArray(embedding) ? embedding : null;
  }

  if (cache && typeof cache === "object") {
    const typed = cache as Record<string, unknown>;
    const byId = typed.byId as Record<string, number[]> | undefined;
    const byQuery = typed.byQuery as Record<string, number[]> | undefined;
    const queries = typed.queries as Record<string, number[]> | undefined;
    const direct = typed as Record<string, number[]>;

    return (
      byId?.[testCase.id] ??
      byQuery?.[testCase.query] ??
      queries?.[testCase.id] ??
      queries?.[testCase.query] ??
      direct[testCase.id] ??
      direct[testCase.query] ??
      null
    );
  }

  return null;
}

function ensureEmbeddingVector(value: number[] | null, id: string): number[] {
  if (!value || !Array.isArray(value) || value.length === 0) {
    fail(`Missing embedding vector for "${id}".`);
  }
  if (!value.every((v) => Number.isFinite(v))) {
    fail(`Embedding vector for "${id}" contains non-numeric values.`);
  }
  return value;
}

async function loadEmbeddingCache(filePath: string): Promise<EmbeddingCache> {
  const safePath = ensurePathWithinBase(PROJECT_ROOT, filePath, "--embedding-cache");
  const raw = await fs.readFile(
    safePath,
    "utf-8",
  ); // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename -- Path is normalized and constrained within PROJECT_ROOT.
  return JSON.parse(raw) as EmbeddingCache;
}

function describeForbiddenHit(result: ResultRow): string {
  const parts = [result.documentPath ?? "unknown"];
  if (result.docType) parts.push(`docType=${result.docType}`);
  if (result.category) parts.push(`category=${result.category}`);
  return parts.join(" ");
}

function buildContext(mode: PerazziMode | null): PerazziAssistantRequest["context"] {
  return {
    pageUrl: "/eval/retrieval",
    mode: mode ?? undefined,
    locale: "en-US",
  };
}

function evaluateCase(params: {
  testCase: RetrievalCase;
  results: ResultRow[];
  minHits: number;
}): Omit<CaseResult, "rerankEnabled" | "candidateLimit"> {
  const { testCase, results, minHits } = params;
  const expectedFamilies = testCase.expectedFamilies;
  const expectedHits = results.filter((row) => row.expectedMatch).length;
  const forbiddenHits = results.filter((row) => row.forbiddenMatch).length;
  const matchedFamilies = Array.from(
    new Set(
      results
        .flatMap((row) =>
          expectedFamilies.filter((family) => matchesFamily(row.documentPath, family)),
        )
        .filter(Boolean),
    ),
  );

  if (forbiddenHits > 0) {
    const offenders = results
      .filter((row) => row.forbiddenMatch)
      .slice(0, 3)
      .map(describeForbiddenHit)
      .join("; ");
    return {
      id: testCase.id,
      name: testCase.name,
      query: testCase.query,
      sourceSection: testCase.sourceSection,
      expectedFamilies: testCase.expectedFamilies,
      minHits,
      pass: false,
      reason: `Forbidden families found in top results (${forbiddenHits}). ${offenders}`,
      expectedHits,
      forbiddenHits,
      matchedFamilies,
      results,
    };
  }

  if (expectedHits >= minHits) {
    return {
      id: testCase.id,
      name: testCase.name,
      query: testCase.query,
      sourceSection: testCase.sourceSection,
      expectedFamilies: testCase.expectedFamilies,
      minHits,
      pass: true,
      reason: `Expected hits ${expectedHits}/${results.length} (min ${minHits}).`,
      expectedHits,
      forbiddenHits,
      matchedFamilies,
      results,
    };
  }

  return {
    id: testCase.id,
    name: testCase.name,
    query: testCase.query,
    sourceSection: testCase.sourceSection,
    expectedFamilies: testCase.expectedFamilies,
    minHits,
    pass: false,
    reason: `Expected at least ${minHits} hits in top ${results.length}; got ${expectedHits}.`,
    expectedHits,
    forbiddenHits,
    matchedFamilies,
    results,
  };
}

function printHelp() {
  console.log(`
Usage: pnpm perazzi:eval:retrieval [options]

Options:
  --k <number>                 Top-k results to return (default: 12)
  --candidate-limit <number>   Candidate pool size when rerank is enabled
  --rerank on|off               Enable reranking (default: env PERAZZI_ENABLE_RERANK or on)
  --min-hits <number>           Minimum expected-family hits to PASS (default: min(2, expected count))
  --json <path>                 Output JSON report path (default: retrieval-report.json; must stay within project root)
  --embedding-cache <path>      JSON file with precomputed embeddings (offline mode; must stay within project root)
  --help                        Show this help

Embedding cache formats:
  - { "queries": { "<query>": [..embedding..] } }
  - { "byId": { "<case id>": [..] } }
  - { "<query>": [..] }
  - [ { "id": "<case id>", "embedding": [..] } ]
`);
}

function assertDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return;
  fail("DATABASE_URL is required for retrieval (read-only).");
}

function parseCliOptions(argv: minimist.ParsedArgs): CliOptions {
  const k = parseNumber(argv.k, 12, "--k");
  const candidateLimit = parseOptionalNumber(argv["candidate-limit"], k, "--candidate-limit");
  const rerankFlag = parseBooleanString(argv.rerank);
  const rerankEnabled =
    rerankFlag ?? parseBooleanString(process.env.PERAZZI_ENABLE_RERANK) ?? true;
  const minHitsGlobal = parseOptionalNumber(argv["min-hits"], 1, "--min-hits");
  const reportPath = resolveCliPath(argv.json ?? "retrieval-report.json", "--json");
  const embeddingCachePath = argv["embedding-cache"]
    ? resolveCliPath(argv["embedding-cache"], "--embedding-cache")
    : null;
  const embeddingModel = process.env.PERAZZI_EMBED_MODEL ?? "text-embedding-3-large";

  return {
    k,
    candidateLimit,
    rerankEnabled,
    minHitsGlobal,
    reportPath,
    embeddingCachePath,
    embeddingModel,
  };
}

async function resolveEmbeddings(
  embeddingCachePath: string | null,
  embeddingModel: string,
): Promise<EmbeddingState> {
  if (embeddingCachePath) {
    const embeddingCache = await loadEmbeddingCache(embeddingCachePath);
    const embeddingsById = new Map(
      RETRIEVAL_CASES.map((testCase) => [
        testCase.id,
        ensureEmbeddingVector(resolveEmbeddingFromCache(embeddingCache, testCase), testCase.id),
      ]),
    );
    return { embeddingCache, embeddingsById };
  }

  const input = RETRIEVAL_CASES.map((testCase) => testCase.query);
  let embeddingResponse;
  try {
    embeddingResponse = await createEmbeddings({
      model: embeddingModel,
      input,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    fail(
      `Embedding generation failed: ${msg}. ` +
        "Set OPENAI_API_KEY (or AI gateway) or use --embedding-cache for offline runs.",
    );
  }
  const data = embeddingResponse.data ?? [];
  if (data.length !== RETRIEVAL_CASES.length) {
    fail(`Embedding response size mismatch (expected ${RETRIEVAL_CASES.length}, got ${data.length}).`);
  }
  const embeddingsById = new Map(
    RETRIEVAL_CASES.map((testCase, idx) => [
      testCase.id,
      ensureEmbeddingVector(data[idx]?.embedding ?? null, testCase.id),
    ]),
  );
  return { embeddingCache: null, embeddingsById };
}

function buildResultRows(
  retrieval: RetrievalResponse,
  testCase: RetrievalCase,
  rerankEnabled: boolean,
): ResultRow[] {
  const breakdownByChunkId = new Map(
    retrieval.rerankMetrics.topReturnedChunks.map((row) => [row.chunkId, row]),
  );

  const forbiddenPathPrefixes = testCase.forbiddenPathPrefixes ?? [];
  const forbiddenCategories = normalizeList(testCase.forbiddenCategories);
  const forbiddenDocTypes = normalizeList(testCase.forbiddenDocTypes);

  return retrieval.chunks.map((chunk, idx) => {
    const breakdown = breakdownByChunkId.get(chunk.chunkId);
    const documentPath = chunk.documentPath ?? chunk.sourcePath ?? null;
    const category = chunk.category ?? null;
    const docType = chunk.docType ?? null;
    const expectedMatch = matchesAnyFamily(documentPath, testCase.expectedFamilies);
    const forbiddenMatch =
      matchesAnyFamily(documentPath, forbiddenPathPrefixes) ||
      (category ? forbiddenCategories.includes(category.toLowerCase()) : false) ||
      (docType ? forbiddenDocTypes.includes(docType.toLowerCase()) : false);

    return {
      rank: idx + 1,
      chunkId: chunk.chunkId,
      documentPath,
      headingPath: chunk.headingPath ?? null,
      category,
      docType,
      baseScore: Number(chunk.baseScore ?? chunk.score ?? 0),
      boost: breakdown?.boost ?? (rerankEnabled ? null : 0),
      archetypeBoost: breakdown?.archetypeBoost ?? (rerankEnabled ? null : 0),
      finalScore: Number(chunk.score ?? chunk.baseScore ?? 0),
      expectedMatch,
      forbiddenMatch,
    };
  });
}

function logCaseResult(params: {
  testCase: RetrievalCase;
  evaluation: Omit<CaseResult, "rerankEnabled" | "candidateLimit">;
  retrieval: RetrievalResponse;
  rows: ResultRow[];
}) {
  const { testCase, evaluation, retrieval, rows } = params;

  console.log("\n---");
  console.log(`${testCase.name} (${testCase.sourceSection})`);
  console.log(`Query: ${testCase.query}`);
  console.log(
    `Result: ${evaluation.pass ? "PASS" : "FAIL"} - ${evaluation.reason}`,
  );
  console.log(
    `Rerank: ${retrieval.rerankMetrics.rerankEnabled ? "on" : "off"} (candidateLimit=${retrieval.rerankMetrics.candidateLimit})`,
  );
  console.log("Top results:");
  for (const row of rows) {
    const heading = row.headingPath ?? "(none)";
    const boost = formatOptionalScore("boost", row.boost);
    const archetypeBoost = formatOptionalScore("archetypeBoost", row.archetypeBoost);
    console.log(
      `${row.rank}. ${row.documentPath ?? "unknown"} | ${heading} | base=${formatScore(row.baseScore)}${boost}${archetypeBoost} final=${formatScore(row.finalScore)}`,
    );
  }
}

async function runRetrievalCase(params: {
  testCase: RetrievalCase;
  embeddingsById: Map<string, number[]>;
  k: number;
  effectiveCandidateLimit: number;
  rerankEnabled: boolean;
  minHitsGlobal: number | null;
}): Promise<CaseResult> {
  const { testCase, embeddingsById, k, effectiveCandidateLimit, rerankEnabled, minHitsGlobal } =
    params;
  const hints = detectRetrievalHints(testCase.query);
  const context = buildContext(hints.mode ?? null);
  const embedding = embeddingsById.get(testCase.id);
  const minHits = resolveMinHits(testCase, minHitsGlobal);

  const retrieval = await retrievePerazziContextWithEmbedding({
    queryEmbedding: ensureEmbeddingVector(embedding ?? null, testCase.id),
    limit: k,
    candidateLimit: effectiveCandidateLimit,
    rerankEnabled,
    hints,
    context,
  });

  const rows = buildResultRows(retrieval, testCase, rerankEnabled);
  const evaluation = evaluateCase({ testCase, results: rows, minHits });
  const caseResult = {
    ...evaluation,
    rerankEnabled: retrieval.rerankMetrics.rerankEnabled,
    candidateLimit: retrieval.rerankMetrics.candidateLimit,
  };

  logCaseResult({ testCase, evaluation, retrieval, rows });
  return caseResult;
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ["json", "embedding-cache", "rerank"],
    boolean: ["help"],
    default: {
      k: 12,
    },
  });

  if (argv.help) {
    printHelp();
    return;
  }

  assertDatabaseUrl();

  const options = parseCliOptions(argv);
  const effectiveCandidateLimit = options.rerankEnabled
    ? options.candidateLimit ?? getRerankCandidateLimit(options.k)
    : options.k;
  const { embeddingCache, embeddingsById } = await resolveEmbeddings(
    options.embeddingCachePath,
    options.embeddingModel,
  );

  const results: CaseResult[] = [];

  for (const testCase of RETRIEVAL_CASES) {
    const caseResult = await runRetrievalCase({
      testCase,
      embeddingsById,
      k: options.k,
      effectiveCandidateLimit,
      rerankEnabled: options.rerankEnabled,
      minHitsGlobal: options.minHitsGlobal,
    });
    results.push(caseResult);
  }

  const passed = results.filter((result) => result.pass).length;
  const report = {
    runner: "scripts/perazzi-eval/retrieval-suite.ts",
    generatedAt: new Date().toISOString(),
    validationSource: VALIDATION_SOURCE,
    model: embeddingCache ? "embedding-cache" : options.embeddingModel,
    embeddingCache: options.embeddingCachePath,
    k: options.k,
    rerank: {
      enabled: options.rerankEnabled,
      candidateLimit: effectiveCandidateLimit,
    },
    totals: {
      tests: results.length,
      passed,
      failed: results.length - passed,
    },
    results,
  };

  const safeReportPath = ensurePathWithinBase(PROJECT_ROOT, options.reportPath, "--json");
  await fs.mkdir(path.dirname(safeReportPath), {
    recursive: true,
  }); // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename -- Path is normalized and constrained within PROJECT_ROOT.
  await fs.writeFile(
    safeReportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf-8",
  ); // nosemgrep: codacy.tools-configs.javascript_pathtraversal_rule-non-literal-fs-filename -- Path is normalized and constrained within PROJECT_ROOT.

  console.log("\n---");
  console.log(`Report: ${safeReportPath}`);
  console.log(`Summary: ${passed}/${results.length} passed`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
