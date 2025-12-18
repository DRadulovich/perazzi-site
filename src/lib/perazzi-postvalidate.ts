import { BLOCKED_RESPONSES } from "@/lib/perazzi-guardrail-responses";
import {
  type EvidenceMode,
  GENERAL_UNSOURCED_LABEL_PREFIX,
  ensureGeneralUnsourcedLabelFirstLine,
} from "@/lib/perazzi-evidence";

type DisallowedCategory = "pricing" | "gunsmithing" | "legal";

export type PostValidateResult = {
  text: string;
  triggered: boolean;
  reasons: string[];
  evidenceMode: EvidenceMode;
  replacedWithBlock: boolean;
  labelInjected: boolean;
  qualifierInjected: boolean;
};

const UNSOURCED_QUALIFIER_LINE =
  "Note: I don’t have Perazzi documentation in view for this answer. Treat any Perazzi-specific details (warranty terms, policies, specs, service procedures, pricing) as general guidance, and confirm with Perazzi or an authorized dealer/service center.";

function normalizeText(input: string): string {
  return String(input ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function looksLikeAlreadyRefusingPricing(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("not able to discuss pricing") ||
    t.includes("can’t speak to pricing") ||
    t.includes("can't speak to pricing") ||
    t.includes("price is one of the few things") ||
    t.includes("reach out to an authorized") ||
    t.includes("authorized perazzi dealer")
  );
}

function detectPricingLeak(text: string): boolean {
  if (looksLikeAlreadyRefusingPricing(text)) return false;
  const t = normalizeText(text);
  const hasCurrencyAmount = /(?:[$€£]\s?\d{1,3}(?:[,\d]{0,12})(?:\.\d+)?)/.test(t);
  const hasAmountWithCurrencyWord =
    /\b\d{1,3}(?:[,\d]{0,12})(?:\.\d+)?\s?(?:usd|eur|gbp|dollars?|euros?|pounds?)\b/i.test(t);
  const hasPricePhraseWithDigits =
    /\b(?:msrp|price|priced|cost|costs|runs|street price)\b[^\n]{0,40}\d/i.test(t);
  return hasCurrencyAmount || hasAmountWithCurrencyWord || hasPricePhraseWithDigits;
}

function detectGunsmithingLeak(text: string): boolean {
  const t = normalizeText(text).toLowerCase();
  const hasStepStructure = /^\s*(?:step\s+\d+|\d+\.|\d+\)|-\s+)/m.test(t);
  const unsafeOps =
    /\b(stone|polish|file|grind|dremel|drill|mill|ream|bend|shim|weld|cut)\b/.test(t);
  const triggerParts =
    /\b(sear|hammer|spring|firing pin|trigger|pull weight|engagement|disassemble|take apart)\b/.test(
      t,
    );

  if (/\btrigger job\b/.test(t)) return true;
  if (unsafeOps && triggerParts) return true;
  if (hasStepStructure && unsafeOps) return true;

  return false;
}

function detectLegalLeak(text: string): boolean {
  const t = normalizeText(text);
  if (/\b(itar|atf|nfa|18\s*u\.?\s*s\.?\s*c\.?|form\s+\d+)\b/i.test(t)) return true;
  if (/\b(export license|import permit|customs declaration|tariff code)\b/i.test(t)) return true;
  if (/\bit'?s legal\b/i.test(t) && /\b(in|under)\b/i.test(t)) return true;
  return false;
}

function detectDisallowed(text: string): DisallowedCategory | null {
  if (detectPricingLeak(text)) return "pricing";
  if (detectGunsmithingLeak(text)) return "gunsmithing";
  if (detectLegalLeak(text)) return "legal";
  return null;
}

function containsHighRiskPerazziClaimMarkers(text: string): boolean {
  const t = normalizeText(text);
  const mentionsPerazzi = /\bperazzi\b/i.test(t);
  if (!mentionsPerazzi) return false;

  const riskyKeywords =
    /\b(warranty|guarantee|guaranty|policy|official|msrp|price|pricing|cost|factory|requires|must|authorized|service\s+interval|recommended|serial\s+number|date\s+code|proof\s+mark|specs?)\b/i;
  if (riskyKeywords.test(t)) return true;

  const perazziPlusNumericSpec =
    /\bperazzi\b[^\n]{0,80}\b\d{1,4}(?:\.\d+)?\s?(?:mm|cm|in|inch|\"|kg|g|lbs?|lb|gauge)\b/i;
  if (perazziPlusNumericSpec.test(t)) return true;

  return false;
}

function hasExistingQualifier(text: string): boolean {
  const t = normalizeText(text).toLowerCase();
  return (
    t.includes(UNSOURCED_QUALIFIER_LINE.toLowerCase()) ||
    t.includes("confirm with perazzi") ||
    t.includes("confirm with an authorized") ||
    t.includes("i don’t have perazzi documentation") ||
    t.includes("i don't have perazzi documentation")
  );
}

function insertQualifierAfterFirstLine(text: string, qualifierLine: string): string {
  const normalized = normalizeText(text);
  const newlineIndex = normalized.indexOf("\n");
  if (newlineIndex === -1) return `${normalized}\n\n${qualifierLine}`;

  const firstLine = normalized.slice(0, newlineIndex);
  const rest = normalized.slice(newlineIndex + 1).trimStart();
  return `${firstLine}\n\n${qualifierLine}\n\n${rest}`;
}

export function postValidate(
  text: string,
  options: { evidenceMode: EvidenceMode; requireGeneralLabel?: boolean },
): PostValidateResult {
  const evidenceMode = options.evidenceMode;
  const requireGeneralLabel = options.requireGeneralLabel ?? true;
  const original = String(text ?? "");
  const reasons: string[] = [];

  const disallowed = detectDisallowed(original);
  if (disallowed) {
    return {
      text: BLOCKED_RESPONSES[disallowed],
      triggered: true,
      reasons: [`disallowed:${disallowed}`],
      evidenceMode,
      replacedWithBlock: true,
      labelInjected: false,
      qualifierInjected: false,
    };
  }

  let next = original;
  let labelInjected = false;
  let qualifierInjected = false;

  if (evidenceMode === "general_unsourced") {
    const before = next;
    if (requireGeneralLabel) {
      next = ensureGeneralUnsourcedLabelFirstLine(next);

      const beforeHadLabel = before.trimStart().startsWith(GENERAL_UNSOURCED_LABEL_PREFIX);
      const afterHasLabel = next.trimStart().startsWith(GENERAL_UNSOURCED_LABEL_PREFIX);
      labelInjected = !beforeHadLabel && afterHasLabel;
      if (labelInjected) reasons.push("label_injected");
      if (!labelInjected && before !== next) reasons.push("label_normalized");
    }

    const needsQualifier = containsHighRiskPerazziClaimMarkers(next);
    if (needsQualifier && !hasExistingQualifier(next)) {
      next = insertQualifierAfterFirstLine(next, UNSOURCED_QUALIFIER_LINE);
      qualifierInjected = true;
      reasons.push("unsourced_perazzi_claims_qualified");
    }
  }

  const triggered = reasons.length > 0;
  return {
    text: next,
    triggered,
    reasons,
    evidenceMode,
    replacedWithBlock: false,
    labelInjected,
    qualifierInjected,
  };
}
