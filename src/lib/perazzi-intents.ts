import type { PerazziAssistantRequest } from "@/types/perazzi-assistant";

export type RetrievalHints = {
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
    pattern: /\btm\s?(1|x)?\b/i,
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

export function detectRetrievalHints(
  latestQuestion: string | null,
  context?: PerazziAssistantRequest["context"],
): RetrievalHints {
  if (!latestQuestion) {
    return { intents: [], topics: [], focusEntities: [], keywords: [] };
  }
  const lowerQuestion = latestQuestion.toLowerCase();
  const intents = new Set<string>();
  const topics = new Set<string>();

  INTENT_DEFINITIONS.forEach((intent) => {
    if (intent.pattern.test(latestQuestion)) {
      intents.add(intent.name);
      intent.topics.forEach((topic) => topics.add(topic));
    }
  });

  const focusEntities = new Set<string>();
  const keywords = new Set<string>();

  const modelMatches = lowerQuestion.match(/\b(mx\d{1,3}[a-z]?|tm1|tmx|high\s*tech|hts)\b/g);
  if (modelMatches) {
    modelMatches.forEach((match) => {
      const clean = match.replace(/\s+/g, "-");
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

  if (context?.mode === "prospect") {
    topics.add("models");
    topics.add("platforms");
  }

  if (context?.platformSlug) {
    topics.add("platforms");
    topics.add(`platform_${context.platformSlug.toLowerCase()}`);
  }

  return {
    intents: Array.from(intents),
    topics: Array.from(topics),
    focusEntities: Array.from(focusEntities),
    keywords: Array.from(keywords),
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildResponseTemplates(hints: RetrievalHints): string[] {
  const templates = new Set<string>();
  hints.intents.forEach((intent) => {
    if (TEMPLATE_GUIDES[intent]) {
      templates.add(TEMPLATE_GUIDES[intent]);
    }
  });
  if (!templates.size && hints.topics.includes("models")) {
    templates.add(TEMPLATE_GUIDES.models);
  }
  return Array.from(templates);
}
