import { afterEach, describe, expect, it } from "vitest";
import {
  getArchetypeBoostK,
  computeArchetypeBoost,
  computeBoost,
  computeBoostV2,
  cosineSimilarity,
  extractRelatedEntityIds,
  isConnectionError,
  isEnvTrue,
  getRerankCandidateLimit,
  extractLatestUserMessage,
  parseJsonbStringArray,
} from "@/lib/perazzi-retrieval";
import type { RetrievalHints } from "@/lib/perazzi-intents";
import type { ChatMessage } from "@/types/perazzi-assistant";

type RetrievedRow = Parameters<typeof computeBoostV2>[0];

function buildRow(overrides: Partial<RetrievedRow> = {}): RetrievedRow {
  return {
    chunk_id: "chunk-1",
    content: "content",
    heading_path: null,
    document_path: "doc/path.md",
    document_title: "Doc Title",
    category: null,
    doc_type: null,
    distance: 0.1,
    score: 0.9,
    ...overrides,
  };
}

function buildHints(overrides: Partial<RetrievalHints> = {}): RetrievalHints {
  return {
    mode: "prospect",
    intents: [],
    topics: [],
    focusEntities: [],
    keywords: [],
    ...overrides,
  };
}

describe("getArchetypeBoostK", () => {
  const original = process.env.PERAZZI_ARCHETYPE_BOOST_K;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PERAZZI_ARCHETYPE_BOOST_K;
    } else {
      process.env.PERAZZI_ARCHETYPE_BOOST_K = original;
    }
  });

  it("returns default when unset or invalid", () => {
    delete process.env.PERAZZI_ARCHETYPE_BOOST_K;
    expect(getArchetypeBoostK()).toBeCloseTo(0.08);

    process.env.PERAZZI_ARCHETYPE_BOOST_K = "-1";
    expect(getArchetypeBoostK()).toBeCloseTo(0.08);

    process.env.PERAZZI_ARCHETYPE_BOOST_K = "1.5";
    expect(getArchetypeBoostK()).toBeCloseTo(0.08);
  });

  it("uses a valid in-range value", () => {
    process.env.PERAZZI_ARCHETYPE_BOOST_K = "0.12";
    expect(getArchetypeBoostK()).toBeCloseTo(0.12);
  });
});

describe("isEnvTrue / getRerankCandidateLimit", () => {
  it("parses truthy strings and ignores falsy", () => {
    expect(isEnvTrue("true")).toBe(true);
    expect(isEnvTrue("1")).toBe(true);
    expect(isEnvTrue("yes")).toBe(true);
    expect(isEnvTrue("on")).toBe(true);
    expect(isEnvTrue("false")).toBe(false);
    expect(isEnvTrue(undefined)).toBe(false);
  });

  it("clamps rerank candidate limit with defaults and caps", () => {
    const original = process.env.PERAZZI_RERANK_CANDIDATE_LIMIT;

    process.env.PERAZZI_RERANK_CANDIDATE_LIMIT = "500";
    expect(getRerankCandidateLimit(10)).toBe(200);

    process.env.PERAZZI_RERANK_CANDIDATE_LIMIT = "50";
    expect(getRerankCandidateLimit(80)).toBe(80); // respects final limit floor

    process.env.PERAZZI_RERANK_CANDIDATE_LIMIT = "not-a-number";
    expect(getRerankCandidateLimit(12)).toBe(60); // default

    if (original === undefined) {
      delete process.env.PERAZZI_RERANK_CANDIDATE_LIMIT;
    } else {
      process.env.PERAZZI_RERANK_CANDIDATE_LIMIT = original;
    }
  });
});

describe("parseJsonbStringArray", () => {
  it("normalizes nested jsonb values into unique lowercase tokens", () => {
    const result = parseJsonbStringArray([
      "Owner",
      '["prospect","owner"]',
      { 0: "Dealer" },
      "owner,partner",
      5,
    ]);
    expect(result).toEqual(["owner", "prospect", "dealer", "partner", "5"]);
  });
});

describe("extractRelatedEntityIds", () => {
  it("returns unique normalized entity identifiers", () => {
    const result = extractRelatedEntityIds([
      { entity_id: "MX8" },
      { slug: "HT" },
      "mx2000",
      "mx2000",
      { code: "SCO" },
    ]);
    expect(result).toEqual(["mx8", "ht", "mx2000", "sco"]);
  });
});

describe("cosineSimilarity", () => {
  it("returns 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it("handles differing lengths and computes cosine", () => {
    const result = cosineSimilarity([1, 2, 0], [2, 2]);
    // dot=1*2+2*2=6, normA=sqrt(5), normB=sqrt(8)
    expect(result).toBeCloseTo(6 / (Math.sqrt(5) * Math.sqrt(8)));
  });
});

describe("extractLatestUserMessage", () => {
  it("returns the last user message or null", () => {
    const msgs: ChatMessage[] = [
      { role: "assistant", content: "hi" },
      { role: "user", content: "first" },
      { role: "assistant", content: "ok" },
      { role: "user", content: "last" },
    ];
    expect(extractLatestUserMessage(msgs)).toBe("last");
    const assistantOnly: ChatMessage[] = [{ role: "assistant", content: "only assistant" }];
    expect(extractLatestUserMessage(assistantOnly)).toBeNull();
  });
});

describe("isConnectionError", () => {
  it("detects common connection error codes and messages", () => {
    expect(isConnectionError({ code: "ENOTFOUND" })).toBe(true);
    expect(isConnectionError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isConnectionError(new Error("connection error: fetch failed"))).toBe(true);
    expect(isConnectionError({ message: "FETCH FAILED" })).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isConnectionError({ code: "OTHER" })).toBe(false);
    expect(isConnectionError(new Error("some other error"))).toBe(false);
  });
});

describe("computeBoost", () => {
  it("adds platform alignment boost", () => {
    const boost = computeBoost(
      { platform_tags: ["ht"] },
      { platformSlug: "ht" },
      buildHints(),
    );
    expect(boost).toBeCloseTo(0.1, 5);
  });

  it("adds focus entity boost", () => {
    const boost = computeBoost(
      { entity_ids: ["mx8"] },
      {},
      buildHints({ focusEntities: ["mx8"] }),
    );
    expect(boost).toBeCloseTo(0.15, 5);
  });

  it("boosts topic and keyword alignment", () => {
    const boost = computeBoost(
      {
        topics: ["discipline_trap"],
        title: "High Tech Trap Guide",
        summary: "Fit and balance",
      },
      {},
      buildHints({ topics: ["discipline_trap"], keywords: ["balance"] }),
    );
    expect(boost).toBeGreaterThan(0);
  });

  it("applies negative adjustment for sanity info", () => {
    const boost = computeBoost({ source_path: "foo/sanity_info/bar.md" }, {}, buildHints());
    expect(boost).toBeLessThan(0);
  });
});

describe("computeBoostV2", () => {
  it("aggregates aligned signals across mode, platform, discipline, topics, and keywords", () => {
    const row = buildRow({
      chunk_primary_modes: ["prospect"],
      doc_platforms: ["ht"],
      chunk_platforms: ["ht"],
      doc_disciplines: ["trap"],
      chunk_disciplines: ["trap"],
      chunk_context_tags: ["fit"],
      chunk_section_labels: ["service"],
      doc_tags: ["care"],
      doc_summary: "care and service info",
    });

    const boost = computeBoostV2(
      row,
      { mode: "prospect", platformSlug: "ht" },
      buildHints({ topics: ["platform_ht", "discipline_trap", "fit", "service"], keywords: ["care"] }),
    );

    expect(boost).toBeCloseTo(0.43, 2);
  });

  it("clamps the boost to the maximum cap", () => {
    const row = buildRow({
      chunk_primary_modes: ["prospect"],
      doc_platforms: ["ht"],
      chunk_platforms: ["ht"],
      doc_disciplines: ["trap"],
      chunk_disciplines: ["trap"],
      chunk_context_tags: ["fit", "service"],
      chunk_section_labels: ["service"],
      doc_tags: ["warranty"],
      chunk_related_entities: ["mx8"],
      doc_summary: "warranty fit service",
      heading_path: "Fit",
      document_title: "HT MX8 warranty fit service",
    });

    const boost = computeBoostV2(
      row,
      { mode: "prospect", platformSlug: "ht", modelSlug: "mx8" },
      buildHints({
        topics: ["platform_ht", "discipline_trap", "fit", "service", "warranty"],
        keywords: ["warranty", "service", "fit", "doc"],
        focusEntities: ["mx8"],
      }),
    );

    expect(boost).toBeCloseTo(0.5, 5);
  });

  it("adds small boosts for mode and capped keyword matches", () => {
    const row = buildRow({
      chunk_primary_modes: ["prospect"],
      doc_summary: "fit service warranty care detail info",
    });

    const boost = computeBoostV2(
      row,
      { mode: "prospect" },
      buildHints({ keywords: ["fit", "service", "warranty", "care", "detail"] }),
    );

    expect(boost).toBeGreaterThan(0); // mode + keyword clamp at 0.06
    expect(boost).toBeLessThanOrEqual(0.12); // mode (0.06) + keyword cap (0.06)
  });
});

describe("computeBoostV2 (rerank tuning v2)", () => {
  const originalEnabled = process.env.PERAZZI_RERANK_TUNING_V2;
  const originalMaxBoost = process.env.PERAZZI_RERANK_TUNING_V2_MAX_BOOST;

  afterEach(() => {
    if (originalEnabled === undefined) {
      delete process.env.PERAZZI_RERANK_TUNING_V2;
    } else {
      process.env.PERAZZI_RERANK_TUNING_V2 = originalEnabled;
    }
    if (originalMaxBoost === undefined) {
      delete process.env.PERAZZI_RERANK_TUNING_V2_MAX_BOOST;
    } else {
      process.env.PERAZZI_RERANK_TUNING_V2_MAX_BOOST = originalMaxBoost;
    }
  });

  it("uses max-style platform alignment (no double counting)", () => {
    process.env.PERAZZI_RERANK_TUNING_V2 = "true";
    delete process.env.PERAZZI_RERANK_TUNING_V2_MAX_BOOST;

    const row = buildRow({
      doc_platforms: ["ht"],
      chunk_platforms: ["ht"],
    });

    const boost = computeBoostV2(
      row,
      { platformSlug: "ht" },
      buildHints({ topics: ["platform_ht"] }),
    );

    expect(boost).toBeCloseTo(0.08, 5);
  });

  it("avoids stacking topical matches across tags/labels", () => {
    process.env.PERAZZI_RERANK_TUNING_V2 = "true";

    const row = buildRow({
      chunk_context_tags: ["service"],
      chunk_section_labels: ["service"],
      doc_tags: ["service"],
    });

    const boost = computeBoostV2(row, {}, buildHints({ topics: ["service"] }));
    expect(boost).toBeCloseTo(0.05, 5);
  });

  it("uses strict keyword matching to avoid substring noise", () => {
    process.env.PERAZZI_RERANK_TUNING_V2 = "true";

    const row = buildRow({
      doc_summary: "outfit options",
    });

    const boost = computeBoostV2(row, {}, buildHints({ keywords: ["fit"] }));
    expect(boost).toBe(0);
  });

  it("caps overall boost lower (as a nudge)", () => {
    process.env.PERAZZI_RERANK_TUNING_V2 = "true";
    delete process.env.PERAZZI_RERANK_TUNING_V2_MAX_BOOST;

    const row = buildRow({
      chunk_primary_modes: ["prospect"],
      doc_platforms: ["ht"],
      chunk_platforms: ["ht"],
      doc_disciplines: ["trap"],
      chunk_disciplines: ["trap"],
      chunk_context_tags: ["fit", "service"],
      chunk_section_labels: ["service"],
      doc_tags: ["warranty"],
      chunk_related_entities: ["mx8"],
      doc_summary: "warranty fit service",
      heading_path: "Fit",
      document_title: "HT MX8 warranty fit service",
    });

    const boost = computeBoostV2(
      row,
      { mode: "prospect", platformSlug: "ht", modelSlug: "mx8" },
      buildHints({
        topics: ["platform_ht", "discipline_trap", "fit", "service", "warranty"],
        keywords: ["warranty", "service", "fit", "doc"],
        focusEntities: ["mx8"],
      }),
    );

    expect(boost).toBeCloseTo(0.25, 5);
  });
});

describe("computeArchetypeBoost", () => {
  it("returns a positive boost when user vector aligns with biased archetype", () => {
    const boost = computeArchetypeBoost(
      { prestige: 0.6, analyst: 0.2, loyalist: 0.1, achiever: 0.05, legacy: 0.05 },
      ["prestige"],
      0.4,
    );

    expect(boost).toBeGreaterThan(0);
    expect(boost).toBeLessThanOrEqual(0.15);
  });

  it("returns zero when the chunk claims all archetypes", () => {
    const boost = computeArchetypeBoost(
      { prestige: 0.6, analyst: 0.2, loyalist: 0.1, achiever: 0.05, legacy: 0.05 },
      ["prestige", "analyst", "loyalist", "achiever", "legacy"],
      0.5,
    );
    expect(boost).toBe(0);
  });

  it("returns zero for missing vector and tolerates noisy inputs", () => {
    expect(computeArchetypeBoost(null, ["prestige"], 0.2)).toBe(0);

    const boost = computeArchetypeBoost(
      { prestige: -1, analyst: NaN, loyalist: 0, achiever: 0, legacy: 0 },
      ["prestige"],
      0.1,
    );
    expect(boost).toBeGreaterThanOrEqual(0);
    expect(boost).toBeLessThanOrEqual(0.15);
  });
});
