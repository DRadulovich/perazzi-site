import type { PerazziMode } from "@/types/perazzi-assistant";

export type ShouldRetrieveInput = {
  userText: string | null | undefined;
  /** Reserved for future mode-specific refinements. */
  mode?: PerazziMode | null;
  pageUrl?: string | null;
};

export type ShouldRetrieveResult = { retrieve: boolean; reason: string };

const MODEL_OR_BRAND_TOKENS = [
  "perazzi",
  "mx 8",
  "mx8",
  "mx 2000",
  "mx2000",
  "mx",
  "high tech",
  "hightech",
  "ht",
  "tm",
  "dc",
  "sco",
  "mirage",
];

const GUN_TERM_TOKENS = [
  "fitting",
  "fit",
  "balance",
  "weight",
  "poi",
  "point of impact",
  "trigger",
  "detachable trigger",
  "group",
  "barrel",
  "rib",
  "choke",
  "stock",
  "comb",
  "forend",
  "forearm",
  "service",
  "servicing",
  "maintenance",
  "repair",
  "warranty",
];

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().replaceAll(/\s+/g, " ");
}

function isAlphaNumeric(char: string): boolean {
  if (!char) return false;
  const code = char.codePointAt(0);
  if (code === undefined) return false;
  return (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
}

function hasLooseToken(haystackLower: string, tokenLower: string): boolean {
  const token = tokenLower.toLowerCase();
  if (!token) return false;

  // Token must be delimited by non-alphanumerics so we don't match e.g. "ht" inside "http".
  let idx = haystackLower.indexOf(token);
  while (idx !== -1) {
    const before = idx === 0 ? "" : haystackLower.charAt(idx - 1);
    const afterIdx = idx + token.length;
    const after = afterIdx >= haystackLower.length ? "" : haystackLower.charAt(afterIdx);
    const hasBoundaryBefore = !before || !isAlphaNumeric(before);
    const hasBoundaryAfter = !after || !isAlphaNumeric(after);

    if (hasBoundaryBefore && hasBoundaryAfter) return true;

    idx = haystackLower.indexOf(token, idx + token.length);
  }

  return false;
}

function hasDomainSignal(text: string, pageUrl?: string | null): boolean {
  const lower = text.toLowerCase();

  // Perazzi brand / platform / model signals (keep this broad; false positives are OK because default=retrieve).
  const modelOrBrand = MODEL_OR_BRAND_TOKENS.some((token) => hasLooseToken(lower, token));

  const gunTerms = GUN_TERM_TOKENS.some((token) => hasLooseToken(lower, token));

  let urlSignals = false;
  if (typeof pageUrl === "string" && pageUrl.trim().length > 0) {
    let urlText = pageUrl;
    try {
      const url = new URL(pageUrl);
      urlText = `${url.hostname}${url.pathname}${url.search}`;
    } catch {
      // ignore invalid URL
    }
    const urlLower = urlText.toLowerCase();
    urlSignals =
      urlLower.includes("perazzi") ||
      urlLower.includes("high-tech") ||
      urlLower.includes("mx8") ||
      urlLower.includes("mx2000") ||
      hasLooseToken(urlLower, "sco") ||
      hasLooseToken(urlLower, "dc") ||
      hasLooseToken(urlLower, "tm") ||
      hasLooseToken(urlLower, "ht");
  }

  return modelOrBrand || gunTerms || urlSignals;
}

function isUiMeta(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\b(reset|clear|wipe)\s+(the\s+)?(chat|conversation|thread|history)\b/.test(lower) ||
    /\b(new|start)\s+(a\s+)?(chat|conversation)\b/.test(lower) ||
    /\b(change|set|switch)\s+(the\s+)?(verbosity|tone|style)\b/.test(lower) ||
    /\b(be|make it)\s+(more\s+)?(concise|brief|short)\b/.test(lower) ||
    /\b(be|make it)\s+(more\s+)?(detailed|verbose|long)\b/.test(lower) ||
    /\b(turn|switch)\s+(on|off)\s+(citations|sources)\b/.test(lower)
  );
}

function isChatMetaRewrite(text: string): boolean {
  const lower = text.toLowerCase();
  const refersToPriorText =
    /\b(this|that|it|above|the above|your answer|the answer|my message|my text|this text)\b/.test(
      lower,
    );
  const isFormattingAboutPrior =
    refersToPriorText &&
    (/\b(format|reformat)\b/.test(lower) ||
      (/\b(put|turn|convert|make)\b/.test(lower) &&
        /\b(bullets?|bullet points?|an outline|outline)\b/.test(lower)));
  return (
    /\b(make|keep)\s+(that|this|it)\s+(shorter|more concise|brief)\b/.test(lower) ||
    /\bshorten\b/.test(lower) ||
    /\btl;?dr\b/.test(lower) ||
    /\bsummarize\b/.test(lower) ||
    /\brewrite\b/.test(lower) ||
    /\brephrase\b/.test(lower) ||
    /\bparaphrase\b/.test(lower) ||
    /\btranslate\b/.test(lower) ||
    /\bfix\b\s+(grammar|spelling)\b/.test(lower) ||
    isFormattingAboutPrior
  );
}

function isGenericPleasantry(text: string): boolean {
  const lower = text.toLowerCase();
  const cleaned = lower.replaceAll(/[.!?]/g, "").trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  if (tokens.length > 5) return false;

  return (
    /^(thanks|thank you|thx|ty|ok|okay|k|cool|great|nice|awesome|perfect|got it|understood|sounds good)$/.test(
      cleaned,
    ) ||
    /^(yes|yep|yeah|no|nope)$/.test(cleaned)
  );
}

export function shouldRetrieve({ userText, pageUrl }: ShouldRetrieveInput): ShouldRetrieveResult {
  const text = normalizeText(userText);
  if (!text) return { retrieve: false, reason: "empty_user_text" };

  // Avoid skipping retrieval when the user mentions Perazzi models/platforms, even if the message is short.
  if (hasDomainSignal(text, pageUrl)) {
    return { retrieve: true, reason: "domain_signal" };
  }

  // UI/meta controls are very unlikely to benefit from retrieval.
  if (isUiMeta(text)) return { retrieve: false, reason: "ui_meta" };

  // Chat meta rewrite requests ("make that shorter") generally refer to the assistant's prior output.
  if (isChatMetaRewrite(text)) return { retrieve: false, reason: "chat_meta" };

  // Generic one-liners don't need retrieval; default is retrieve, so keep this narrow.
  if (isGenericPleasantry(text)) return { retrieve: false, reason: "pleasantry" };

  // Default: retrieve.
  return { retrieve: true, reason: "default" };
}
