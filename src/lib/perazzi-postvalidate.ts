import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import {
  type EvidenceMode,
  GENERAL_UNSOURCED_LABEL_PREFIX,
  ensureGeneralUnsourcedLabelFirstLine,
} from "@/lib/perazzi-evidence";

type DisallowedCategory = keyof typeof BLOCKED_RESPONSES;

export type PostValidateResult = {
  text: string;
  triggered: boolean;
  reasons: string[];
  replacedWithBlock: boolean;
  labelInjected: boolean;
  qualifierInjected: boolean;
  changed: boolean;
};

const GENERAL_UNSOURCED_QUALIFIER_LINE =
  "Note: I don’t have Perazzi-source confirmation for any warranty/policy/pricing details below—please verify with Perazzi or an authorized dealer/service center.";

function normalizeText(input: string): string {
  return String(input ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

type Pattern = { id: string; re: RegExp };

const SYSTEM_META_PATTERNS: Pattern[] = [
  { id: "system_prompt_markers", re: /\b(system prompt|developer message|hidden instructions)\b/i },
  { id: "prompt_injection", re: /\b(prompt injection|jailbreak|override instructions)\b/i },
  { id: "tooling_markers", re: /\b(tool call|function call|api key|bearer token)\b/i },
  { id: "model_markers", re: /\b(openai|chatgpt|gpt-\d|responses api)\b/i },
  { id: "retrieval_markers", re: /\b(rag|retrieval|embedding|vector database|pgvector|rerank)\b/i },
  { id: "system_block_header", re: /(^|\n)\s*(?:SYSTEM|DEVELOPER)\s*[:\-]/i },
];

const PRICING_PATTERNS: Pattern[] = [
  { id: "currency_symbol_amount", re: /[$€£¥]\s*\d{1,3}(?:[,\d]{0,12})(?:\.\d+)?/ },
  {
    id: "currency_code_amount",
    re: /\b\d{1,3}(?:[,\d]{0,12})(?:\.\d+)?\s*(?:usd|eur|gbp|cad|aud|chf|jpy)\b/i,
  },
  {
    id: "price_word_with_digits",
    re: /\b(?:msrp|price|pricing|cost|costs|priced|retail|street price|starts?\s+at|runs?\s+about)\b[\s\S]{0,40}\d/i,
  },
  {
    id: "ballpark_or_range_with_k",
    re: /\b(?:ballpark|in the|around|roughly|typically)\b[\s\S]{0,30}\b\d{2,3}\s?k\b/i,
  },
  {
    id: "k_with_ballpark_or_range",
    re: /\b\d{2,3}\s?k\b[\s\S]{0,20}\b(?:range|ballpark)\b/i,
  },
  {
    id: "figure_phrases",
    re: /\b(?:low|mid|high)\s+(?:five|six)\s*figures\b|\b(?:five|six)\s*figures\b|\b(?:tens?\s+of\s+thousands)\b/i,
  },
];

const GUNSMITHING_PATTERNS: Pattern[] = [
  {
    id: "procedural_steps",
    re: /^\s*(?:step\s+\d+|\d+\.|\d+\)|-\s+|•\s+)/m,
  },
  {
    id: "unsafe_ops",
    re: /\b(stone|polish|file|grind|dremel|drill|mill|ream|tap|weld|cut|bend|shim|heat)\b/i,
  },
  {
    id: "critical_parts",
    re: /\b(sear|hammer|spring|firing pin|trigger|pull weight|engagement|ejector|extractor|locking)\b/i,
  },
  { id: "disassembly", re: /\b(disassemble|take apart|strip down|remove the trigger)\b/i },
  { id: "trigger_job", re: /\btrigger job\b/i },
];

const LEGAL_PATTERNS: Pattern[] = [
  { id: "us_federal_markers", re: /\b(atf|ffl|nfa|form\s+4473|922r|18\s*u\.?\s*s\.?\s*c\.?)\b/i },
  { id: "export_import", re: /\b(itar|export license|import permit|customs declaration|tariff code)\b/i },
  { id: "legal_status", re: /\b(it'?s\s+legal|it'?s\s+illegal|legally\s+allowed)\b/i },
];

function matchesAny(text: string, patterns: Pattern[]): string | null {
  for (const pattern of patterns) {
    if (pattern.re.test(text)) return pattern.id;
  }
  return null;
}

function detectDisallowedCategory(text: string): { category: DisallowedCategory; matchId: string } | null {
  const t = normalizeText(text);

  const systemMeta = matchesAny(t, SYSTEM_META_PATTERNS);
  if (systemMeta) return { category: "system_meta", matchId: systemMeta };

  const pricing = matchesAny(t, PRICING_PATTERNS);
  if (pricing) return { category: "pricing", matchId: pricing };

  const gunsmithingUnsafe = matchesAny(t, [
    GUNSMITHING_PATTERNS.find((p) => p.id === "trigger_job")!,
  ]);
  if (gunsmithingUnsafe) return { category: "gunsmithing", matchId: gunsmithingUnsafe };

  const hasSteps = Boolean(matchesAny(t, [GUNSMITHING_PATTERNS.find((p) => p.id === "procedural_steps")!]));
  const hasUnsafeOps = Boolean(matchesAny(t, [GUNSMITHING_PATTERNS.find((p) => p.id === "unsafe_ops")!]));
  const hasCriticalParts = Boolean(matchesAny(t, [GUNSMITHING_PATTERNS.find((p) => p.id === "critical_parts")!]));
  const hasDisassembly = Boolean(matchesAny(t, [GUNSMITHING_PATTERNS.find((p) => p.id === "disassembly")!]));
  if ((hasUnsafeOps && (hasCriticalParts || hasDisassembly)) || (hasSteps && hasUnsafeOps)) {
    return { category: "gunsmithing", matchId: "gunsmithing_combo" };
  }

  const legal = matchesAny(t, LEGAL_PATTERNS);
  if (legal) return { category: "legal", matchId: legal };

  return null;
}

function containsHighRiskPerazziClaimMarkers(text: string): boolean {
  const t = normalizeText(text);
  const mentionsPerazzi = /\bperazzi\b/i.test(t);
  if (!mentionsPerazzi) return false;

  const riskyKeywords =
    /\b(warranty|guarantee|guaranty|policy|return|refund|exchange|msrp|price|pricing|cost)\b/i;
  if (riskyKeywords.test(t)) return true;

  return false;
}

function hasExistingQualifier(text: string): boolean {
  const t = normalizeText(text);
  return t.split("\n").some((line) => line.trim() === GENERAL_UNSOURCED_QUALIFIER_LINE);
}

function insertQualifierAfterFirstLine(text: string, qualifierLine: string): string {
  const normalized = normalizeText(text);
  const newlineIndex = normalized.indexOf("\n");
  if (newlineIndex === -1) return `${normalized}\n${qualifierLine}`;

  const firstLine = normalized.slice(0, newlineIndex);
  const rest = normalized.slice(newlineIndex + 1).trimStart();
  return `${firstLine}\n${qualifierLine}\n\n${rest}`;
}

export function postValidate(
  text: string,
  options: { evidenceMode: EvidenceMode; requireGeneralLabel?: boolean },
): PostValidateResult {
  const evidenceMode = options.evidenceMode;
  const requireGeneralLabel = options.requireGeneralLabel ?? true;
  const original = String(text ?? "");
  const reasons: string[] = [];

  const disallowed = detectDisallowedCategory(original);
  if (disallowed) {
    const replacement = BLOCKED_RESPONSES[disallowed.category];
    return {
      text: replacement,
      triggered: true,
      reasons: [`blocked:${disallowed.category}`, `match:${disallowed.matchId}`],
      replacedWithBlock: true,
      labelInjected: false,
      qualifierInjected: false,
      changed: replacement !== original,
    };
  }

  let next = original;
  let labelInjected = false;
  let qualifierInjected = false;

  if (evidenceMode === "general_unsourced") {
    if (requireGeneralLabel) {
      const before = next;
      const hadLabelAtStart = before.trimStart().startsWith(GENERAL_UNSOURCED_LABEL_PREFIX);
      next = ensureGeneralUnsourcedLabelFirstLine(before);
      const hasLabelAtStart = next.trimStart().startsWith(GENERAL_UNSOURCED_LABEL_PREFIX);
      labelInjected = !hadLabelAtStart && hasLabelAtStart;
      if (labelInjected) reasons.push("label_injected");
      if (!labelInjected && before !== next) reasons.push("label_normalized");
    }

    const needsQualifier = containsHighRiskPerazziClaimMarkers(next);
    if (needsQualifier && !hasExistingQualifier(next)) {
      next = insertQualifierAfterFirstLine(next, GENERAL_UNSOURCED_QUALIFIER_LINE);
      qualifierInjected = true;
      reasons.push("unsourced_perazzi_claims_qualified");
    }
  }

  const triggered = reasons.length > 0;
  const changed = next !== original;
  return {
    text: next,
    triggered,
    reasons,
    replacedWithBlock: false,
    labelInjected,
    qualifierInjected,
    changed,
  };
}
