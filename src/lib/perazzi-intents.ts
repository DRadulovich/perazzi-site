import type { PerazziAssistantRequest, PerazziMode, Archetype } from "@/types/perazzi-assistant";

export type RetrievalHints = {
  mode: PerazziMode;
  intents: string[];
  topics: string[];
  focusEntities: string[];
  keywords: string[];
};

const INTENT_DEFINITIONS: Array<{
  name: string;
  pattern: RegExp;
  topics: string[];
}> = [
  {
    name: "platform_mx",
    pattern: /\b(mx\s?(8|10|12|2000)?|mx8|mx10|mx12|mx2000)\b/i,
    topics: ["platforms", "platform_mx", "models"],
  },
  {
    name: "platform_ht",
    pattern: /\b(high\s*tech|hts?|ht)\b/i,
    topics: ["platforms", "platform_ht", "models"],
  },
  {
    name: "platform_tm",
    pattern: /\btm\s?[1x]?\b/i,
    topics: ["platforms", "platform_tm", "models"],
  },
  {
    name: "platform_dc",
    pattern: /\bdc\b/i,
    topics: ["platforms", "platform_dc", "models"],
  },
  {
    name: "platform_sho",
    pattern: /\bsho\b/i,
    topics: ["platforms", "platform_sho", "models"],
  },
  {
    name: "bespoke",
    pattern: /\b(bespoke|atelier|fitting|build process|custom build|made to order)\b/i,
    topics: ["bespoke", "models", "platforms"],
  },
  {
    name: "models",
    pattern: /\b(model|platform|mx\d{1,3}[a-z]?|high\s*tech|hts|tm1|mx2000|mx8|mx10|spec|rib)\b/i,
    topics: ["models", "specs", "platforms"],
  },
  {
    name: "dealers",
    pattern: /\b(dealer|stockist|authorized\s+dealer|where\s+(to\s+)?(buy|try)|demo|store)\b/i,
    topics: ["dealers", "service", "network"],
  },
  {
    name: "service",
    pattern: /\b(service|care|maintenance|clean|repair|schedule|servicing|fitting)\b/i,
    topics: ["service", "care"],
  },
  {
    name: "olympic",
    pattern: /\b(olympic|champion|medal|athlete|shooters?|team)\b/i,
    topics: ["olympic", "athletes", "heritage"],
  },
  {
    name: "heritage",
    pattern: /\b(history|heritage|founder|legacy|story|brand bible)\b/i,
    topics: ["heritage", "history"],
  },
  {
    name: "events",
    pattern: /\b(event|tour|clinic|scheduled|calendar|appearance)\b/i,
    topics: ["events"],
  },
  {
    name: "pricing",
    pattern: /\b(price|cost|how much|msrp|retail)\b/i,
    topics: ["pricing_policies"],
  },
  {
    name: "discipline_trap",
    pattern: /\b(trap|bunker|handicap)\b/i,
    topics: ["discipline_trap"],
  },
  {
    name: "discipline_skeet",
    pattern: /\b(skeet)\b/i,
    topics: ["discipline_skeet"],
  },
  {
    name: "discipline_sporting",
    pattern: /\b(sporting|fitasc|clays)\b/i,
    topics: ["discipline_sporting"],
  },
  {
    name: "discipline_game",
    pattern: /\b(game|field|hunting|live bird|pigeon|helice)\b/i,
    topics: ["discipline_game"],
  },
  {
    name: "rib_adjustable",
    pattern: /\b(adjustable (rib|ribs)|notch rib|high rib)\b/i,
    topics: ["rib_adjustable"],
  },
  {
    name: "rib_fixed",
    pattern: /\b(fixed (rib|ribs))\b/i,
    topics: ["rib_fixed"],
  },
  {
    name: "grade_sc3",
    pattern: /\b(sc3)\b/i,
    topics: ["grade_sc3"],
  },
  {
    name: "grade_sco",
    pattern: /\b(sco|sideplates)\b/i,
    topics: ["grade_sco"],
  },
  {
    name: "grade_lusso",
    pattern: /\b(lusso)\b/i,
    topics: ["grade_lusso"],
  },
];

const TEMPLATE_GUIDES: Record<string, string> = {
  models:
    "- When comparing Perazzi platforms or models, include a short comparison table or bullet list highlighting handling, disciplines, and fit guidance.\n- Close with a \"Next step\" line that suggests bespoke fitting or dealer intro.",
  dealers:
    "- List up to three recommended dealers with **Name — City/State** and one line about what they offer.\n- Remind the user that Perazzi can coordinate introductions for fittings or demo days.",
  service:
    "- Provide a concise care schedule: immediate post-shoot care, periodic inspections, and when to involve Perazzi service centers.\n- Encourage using authorized centers rather than DIY gunsmithing.",
  olympic:
    "- Share a short vignette about the athlete(s) referenced, including medal, discipline, and the Perazzi platform they trusted.\n- Tie the story back to Perazzi craftsmanship and heritage.",
  heritage:
    "- Frame the answer as a narrative with a bold subheading, then 2–3 paragraphs connecting heritage moments to modern Perazzi ownership.",
  events:
    "- Present upcoming events as a list with **Event — Location — Date** plus how to register or inquire.",
};

const TEMPLATE_GUIDES_BY_ARCHETYPE: Partial<Record<string, Partial<Record<Archetype, string>>>> = {
  models: {
    loyalist: [
      "- Start by affirming long-term partnership: how each model stands up over decades of use.",
      "- Highlight durability features (steel inserts, serviceability) before tech specs.",
      "- Compare models in terms of ease of getting spare parts & factory support.",
      "- Close with a next step: schedule a fitting session to find the model they will keep for life.",
    ].join("\n"),

    prestige: [
      "- Begin with craftsmanship: engraving options, wood grades, and bespoke accents per model.",
      "- Compare how each platform presents visually on the line and at rest.",
      "- Note which upgrades pair naturally with each model (sideplates, gold inlays, case).",
      "- End with a discreet next step: private atelier consultation to finalise aesthetics.",
    ].join("\n"),

    analyst: [
      "- Start with a compact comparison table (Platform — Handling — Best-fit disciplines — Tradeoffs).",
      "- Then give 3–5 decision criteria (fit, POI/rib options, trigger feel, balance).",
      "- Add a short “How to test” checklist (patterning/POI check, fit checkpoints, trigger feel).",
      "- Close with a clear decision path (If X → consider A; if Y → consider B).",
    ].join("\n"),

    achiever: [
      "- Lead with the performance path: what each option optimizes for consistency and match execution.",
      "- Map choices to training implications (what changes in mount, sight picture, recovery).",
      "- Call out discipline-specific setups (trap/skeet/sporting) and why they matter.",
      "- Close with a “next practice session” plan (what to run, what to measure).",
    ].join("\n"),

    legacy: [
      "- Put heritage first: outline which classic models align with multi-generation ownership stories.",
      "- Compare how each platform’s parts availability supports long-term preservation.",
      "- Mention documented provenance value differences between models.",
      "- Finish with a next step: archival lookup for year-correct parts & papers.",
    ].join("\n"),
  },

  pricing: {
    loyalist: [
      "- Frame pricing as an investment in decades of reliable partnership rather than initial cost.",
      "- Outline typical service costs over 10+ years to demonstrate total ownership value.",
      "- Note the stable resale market for well-maintained examples.",
      "- Close with a next step: request a personalised ownership cost breakdown from a dealer.",
    ].join("\n"),

    prestige: [
      "- Emphasise discretion: indicate price ranges rather than exact figures.",
      "- Highlight how bespoke options influence tiered pricing (wood, engraving, sideplates).",
      "- Compare how limited editions appreciate over time.",
      "- End with a next step: private quotation through atelier manager.",
    ].join("\n"),

    analyst: [
      "- Provide a clear table: Base MSRP — Typical Options — Incremental Cost — Total.",
      "- Include lifetime service cost estimate and potential resale range.",
      "- Explain factors that move price: exchange rates, grade, engraving hours.",
      "- Finish with a next step: create spec-and-price worksheet to model scenarios.",
    ].join("\n"),

    achiever: [
      "- Relate price to performance ROI: cost per season vs. expected target count.",
      "- Note budget allocation between gun, travel, and coaching for balanced spend.",
      "- Mention trade-in programs that keep focus on results, not depreciation.",
      "- Close with a next step: speak with a dealer about financing aligned to match calendar.",
    ].join("\n"),

    legacy: [
      "- Discuss long-term value retention and vintage appreciation curves.",
      "- Compare restoration vs. replacement costs for heirloom guns.",
      "- Mention insurance valuation services and documentation bundles.",
      "- End with a next step: schedule appraisal and certified valuation report.",
    ].join("\n"),
  },

  dealers: {
    loyalist: [
      "- List dealers known for long-term customer relationships and post-sale support.",
      "- Highlight services like annual check-ups and community shoots.",
      "- End with a next step: introduction email offering ongoing partnership.",
    ].join("\n"),

    prestige: [
      "- Feature boutique dealers with private fitting rooms and bespoke options on display.",
      "- Note white-glove shipping and concierge appointment scheduling.",
      "- Close with a next step: arrange a discreet showroom visit.",
    ].join("\n"),

    analyst: [
      "- Pick dealers with on-site pattern boards and measurement tools.",
      "- Include bullet on in-stock demo barrels/ribs for direct comparison.",
      "- End with a next step: book a technical fitting + patterning session.",
    ].join("\n"),

    achiever: [
      "- Highlight dealers who sponsor local matches or operate practice facilities.",
      "- Mention demo days where users can shoot multiple configurations back-to-back.",
      "- Finish with a next step: reserve a slot at the next performance clinic.",
    ].join("\n"),

    legacy: [
      "- List dealers experienced in vintage models and restoration consulting.",
      "- Note ability to source period-correct parts and provenance documentation.",
      "- Close with a next step: set up inspection of heirloom gun with master gunsmith.",
    ].join("\n"),
  },

  events: {
    loyalist: [
      "- Promote upcoming owner reunions and brand-hosted fun shoots.",
      "- Emphasise community and shared stories over competition.",
      "- Next step: RSVP link to local Perazzi Owner Day.",
    ].join("\n"),

    prestige: [
      "- Feature invitation-only factory tours, engraving showcases, or gala dinners.",
      "- Keep tone discreet; no prices, just experiential highlights.",
      "- Next step: concierge contact to confirm availability.",
    ].join("\n"),

    analyst: [
      "- List technical workshops (POI tuning, stock measurements, pattern testing).",
      "- Include speaker credentials and data-driven agenda points.",
      "- Next step: register for workshop and receive pre-read materials.",
    ].join("\n"),

    achiever: [
      "- Promote high-level competitions, training camps, and champion seminars.",
      "- Include quick bullets on what metrics attendees will track (hit %, recovery time).",
      "- Next step: sign-up link for next competition prep camp.",
    ].join("\n"),

    legacy: [
      "- Highlight heritage anniversaries, museum exhibits, and vintage shoots.",
      "- Note opportunities to display heirloom guns alongside factory archives.",
      "- Next step: secure display slot / tickets for heritage weekend.",
    ].join("\n"),
  },

  service: {
    loyalist: [
      "- Outline a simple, dependable maintenance timeline (post-shoot wipe-down, annual inspection).",
      "- Emphasise trust in factory-trained technicians over DIY fixes.",
      "- Provide contact method to set up recurring service reminders.",
      "- Next step: schedule yearly check-up with authorised center.",
    ].join("\n"),

    prestige: [
      "- Focus on preserving finish and engraving: suggest micro-fiber cloths, safe storage humidity.",
      "- Include bullet on using OEM parts to retain presentation quality.",
      "- Recommend insured shipping with custom case.",
      "- Next step: arrange white-glove pick-up for service.",
    ].join("\n"),

    analyst: [
      "- Provide numeric service intervals (round-count or months).",
      "- Suggest logging trigger weight and POI before/after service for comparison.",
      "- Include checklist of tolerances gunsmith will verify.",
      "- Next step: download service log template and book inspection.",
    ].join("\n"),

    achiever: [
      "- Tie service schedule to competition calendar to avoid equipment surprises.",
      "- Recommend pre-major-event tune-up and spare parts kit.",
      "- Include quick self-check list for match week.",
      "- Next step: lock-in service slot six weeks before Nationals.",
    ].join("\n"),

    legacy: [
      "- Lead with preservation: storage, corrosion prevention, and conservative post-shoot care.",
      "- Include documentation: record serial, service history, and any fit/POI changes over time.",
      "- Provide a conservative schedule plus red flags that justify professional inspection.",
      "- Always recommend Perazzi-authorized service centers; avoid DIY gunsmithing or timing work.",
    ].join("\n"),
  },

  // NOTE: no neutral "bespoke" template exists today; keep it that way for neutral parity.
  bespoke: {
    prestige: [
      "- Start with a curated set of options (receiver style, engraving direction, wood/stock figure, finish).",
      "- Offer 2–4 tasteful pathways rather than an exhaustive list.",
      "- Keep the tone discreet and focused on fit + personal preference.",
      "- End with a clear next step: consultation/fitting + dealer introduction; avoid quoting prices.",
    ].join("\n"),
  },
};

const MAX_QUESTION_LENGTH = 500;

// Clamp user input before running regex checks to keep regex processing predictable.
function clampQuestionLength(input: string): string {
  return input.length > MAX_QUESTION_LENGTH ? input.slice(0, MAX_QUESTION_LENGTH) : input;
}

const ALLOWED_MODES: PerazziMode[] = ["prospect", "owner", "navigation"];

function normalizeMode(input: unknown): PerazziMode | null {
  if (typeof input !== "string") return null;
  const cleaned = input.trim().toLowerCase();
  return (ALLOWED_MODES as string[]).includes(cleaned) ? (cleaned as PerazziMode) : null;
}

function inferMode(
  latestQuestion: string,
  contextMode: PerazziMode | null,
  intents: Set<string>,
): PerazziMode {
  const q = clampQuestionLength(latestQuestion).toLowerCase();

  const hasNavigationSignal =
    intents.has("dealers") ||
    intents.has("events") ||
    /\b(where\s+can\s+i\s+(find|get|buy|try|contact|reach)|link\s+me|show\s+me|what\s+page|contact|dealer|stockist|authorized\s+dealer|near\s+me)\b/i.test(
      q,
    );

  const hasOwnerSignal =
    intents.has("service") ||
    /\b(my\s+(gun|perazzi|shotgun)|serial(\s*number)?|s\/n|maintenance|servic(e|ing)|clean(ing)?|repair|timing|warranty)\b/i.test(
      q,
    );

  const hasProspectSignal =
    intents.has("models") ||
    intents.has("bespoke") ||
    /\b(mx\s?(8|10|12|2000)?|mx8|mx10|mx12|mx2000|high\s*tech|hts?|tm1|tmx|compare|difference|vs\.?|which\s+(model|platform)|recommend|bespoke|atelier|made\s+to\s+order|sco|sc3|lusso)\b/i.test(
      q,
    );

  if (hasNavigationSignal) return "navigation";
  if (hasOwnerSignal) return "owner";
  if (hasProspectSignal) return "prospect";

  if (contextMode === "owner" || contextMode === "navigation") return contextMode;

  return "prospect";
}

export function detectRetrievalHints(
  latestQuestion: string | null,
  context?: PerazziAssistantRequest["context"],
): RetrievalHints {
  const contextMode = normalizeMode(context?.mode);

  if (!latestQuestion) {
    return { mode: contextMode ?? "prospect", intents: [], topics: [], focusEntities: [], keywords: [] };
  }
  const safeQuestion = clampQuestionLength(latestQuestion);
  const lowerQuestion = safeQuestion.toLowerCase();
  const intents = new Set<string>();
  const topics = new Set<string>();

  INTENT_DEFINITIONS.forEach((intent) => {
    if (intent.pattern.test(safeQuestion)) {
      intents.add(intent.name);
      intent.topics.forEach((topic) => topics.add(topic));
    }
  });

  const mode = inferMode(safeQuestion, contextMode, intents);
  const focusEntities = new Set<string>();
  const keywords = new Set<string>();

  const modelMatches = lowerQuestion.match(/\b(mx\d{1,3}[a-z]?|tm1|tmx|high\s*tech|hts)\b/g);
  if (modelMatches) {
    modelMatches.forEach((match) => {
      const clean = match.replaceAll(/\s+/g, "-");
      keywords.add(clean);
      focusEntities.add(slugify(clean));
    });
    topics.add("models");
    topics.add("specs");
  }

  if (context?.modelSlug) {
    focusEntities.add(context.modelSlug.toLowerCase());
    topics.add("models");
    topics.add("specs");
  }
  if (context?.platformSlug) {
    topics.add(`platform_${context.platformSlug.toLowerCase()}`);
  }

  if (mode === "prospect") {
    topics.add("models");
    topics.add("platforms");
  }

  if (context?.platformSlug) {
    topics.add("platforms");
    topics.add(`platform_${context.platformSlug.toLowerCase()}`);
  }

  const notchMatch = /(\d+)(?:\s*-|\s+)\s*notch/.exec(lowerQuestion);
  if (notchMatch) {
    keywords.add(`rib_notch_${notchMatch[1]}`);
    topics.add(`rib_notch_${notchMatch[1]}`);
  }
  if (lowerQuestion.includes("adjustable rib")) {
    topics.add("rib_adjustable");
  }
  if (lowerQuestion.includes("fixed rib")) {
    topics.add("rib_fixed");
  }

  return {
    mode,
    intents: Array.from(intents),
    topics: Array.from(topics),
    focusEntities: Array.from(focusEntities),
    keywords: Array.from(keywords),
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(?:^-+|-+$)/g, "");
}

function getTemplateGuide(intent: string, archetype: Archetype | null): string | undefined {
  if (archetype) {
    const variant = TEMPLATE_GUIDES_BY_ARCHETYPE[intent]?.[archetype];
    if (variant) return variant;
  }
  return TEMPLATE_GUIDES[intent];
}

export function buildResponseTemplates(hints: RetrievalHints, archetype?: Archetype | null): string[] {
  const resolvedArchetype = archetype ?? null;
  const templates = new Set<string>();
  hints.intents.forEach((intent) => {
    const guide = getTemplateGuide(intent, resolvedArchetype);
    if (guide) templates.add(guide);
  });

  // Preserve existing fallback behavior when nothing matched but the question is model-related.
  if (!templates.size && hints.topics.includes("models")) {
    const fallback = getTemplateGuide("models", resolvedArchetype) ?? TEMPLATE_GUIDES.models;
    templates.add(fallback);
  }
  return Array.from(templates);
}

function __assertEqual(name: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(
      `[perazzi-intents] detectRetrievalHints mode self-test failed: ${name} (expected ${expected}, got ${String(actual)})`,
    );
  }
}

function __assert(name: string, condition: boolean) {
  if (!condition) {
    throw new Error(`[perazzi-intents] template self-test failed: ${name}`);
  }
}

const __DEV__ = process.env.NODE_ENV === "development";

if (__DEV__ && typeof (globalThis as any).jest === "undefined") {
  const ctxProspect: PerazziAssistantRequest["context"] = { mode: "prospect" };

  __assertEqual(
    "service my gun => owner",
    detectRetrievalHints("How often should I service my gun?", ctxProspect).mode,
    "owner",
  );

  __assertEqual(
    "where can I find dealer => navigation",
    detectRetrievalHints("Where can I find a dealer? Link me to one.", ctxProspect).mode,
    "navigation",
  );

  __assertEqual(
    "mx8 vs high tech => prospect",
    detectRetrievalHints("Explain MX8 vs High Tech", ctxProspect).mode,
    "prospect",
  );

  const ctxOwner: PerazziAssistantRequest["context"] = { mode: "owner" };
  __assertEqual(
    "neutral follow-up keeps owner",
    detectRetrievalHints("Thanks", ctxOwner).mode,
    "owner",
  );

  const baseHints: RetrievalHints = {
    mode: "prospect",
    intents: ["models"],
    topics: ["models", "specs"],
    focusEntities: [],
    keywords: [],
  };

  const neutralTemplates = buildResponseTemplates(baseHints, null);
  __assert("neutral uses the existing models template", neutralTemplates.includes(TEMPLATE_GUIDES.models));

  const analystTemplates = buildResponseTemplates(baseHints, "analyst");
  __assert("models+analyst selects a variant", analystTemplates.some((t) => t.includes("How to test")));
  __assert("models+analyst does not include neutral models template", !analystTemplates.includes(TEMPLATE_GUIDES.models));

  const achieverTemplates = buildResponseTemplates(baseHints, "achiever");
  __assert("models+achiever selects a variant", achieverTemplates.some((t) => t.includes("next practice session")));

  const serviceHints: RetrievalHints = {
    mode: "owner",
    intents: ["service"],
    topics: ["service"],
    focusEntities: [],
    keywords: [],
  };
  const serviceLegacyTemplates = buildResponseTemplates(serviceHints, "legacy");
  __assert("service+legacy includes authorized service guidance", serviceLegacyTemplates.some((t) => t.toLowerCase().includes("authorized")));
  __assert("service+legacy discourages diy gunsmithing", serviceLegacyTemplates.some((t) => t.toLowerCase().includes("avoid diy")));

  const bespokeHints: RetrievalHints = {
    mode: "prospect",
    intents: ["bespoke"],
    topics: ["bespoke", "models"],
    focusEntities: [],
    keywords: [],
  };
  const bespokeNeutral = buildResponseTemplates(bespokeHints, null);
  __assert("bespoke+null falls back to models template (current behavior)", bespokeNeutral.includes(TEMPLATE_GUIDES.models));

  const bespokePrestige = buildResponseTemplates(bespokeHints, "prestige");
  __assert("bespoke+prestige selects bespoke variant", bespokePrestige.some((t) => t.toLowerCase().includes("curated")));

  // ---- Leak-guard tests ----
  const forbidden = ["analyst", "achiever", "prestige", "legacy", "loyalist"];

  const collectAllTemplates = (): string[] => {
    const out: string[] = [];
    Object.values(TEMPLATE_GUIDES).forEach((v) => out.push(v));
    Object.values(TEMPLATE_GUIDES_BY_ARCHETYPE).forEach((intentBlock) => {
      Object.values(intentBlock ?? {}).forEach((tpl) => out.push(tpl));
    });
    return out;
  };
  const everyTemplate = collectAllTemplates();
  __assert(
    "no template leaks archetype labels",
    !everyTemplate.some((tpl) => {
      const lower = tpl.toLowerCase();
      return forbidden.some((w) => lower.includes(w));
    }),
  );

  // Ensure each intent x archetype has coverage (specific or fallback)
  const TARGET_INTENTS = ["models", "pricing", "dealers", "events", "service"] as const;
  const ARCHES: Archetype[] = ["loyalist", "prestige", "analyst", "achiever", "legacy"];
  TARGET_INTENTS.forEach((intent) => {
    ARCHES.forEach((arch) => {
      const guide = getTemplateGuide(intent, arch);
      __assert(`coverage for ${intent}/${arch}`, typeof guide === "string" && guide.length > 0);
    });
  });
}
