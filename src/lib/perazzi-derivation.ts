import type { PlatformSlug } from "@/hooks/usePerazziAssistant";
import type { ChatMessage, Citation } from "@/types/perazzi-assistant";

export type AssistantMeta = {
  intents: string[];
  topics: string[];
  citations: Citation[];
  templates?: string[];
  guardrailStatus?: string;
};

export type DerivedPanels = {
  activePlatforms: PlatformSlug[];
  fitProfile: {
    disciplines: string[];
    experienceLevel?: string;
    preferences: string[];
  };
  nextSteps: Array<{ id: string; label: string; intent: string }>;
};

const PLATFORM_TOPIC_MAP: Record<string, PlatformSlug> = {
  platform_mx: "mx",
  platform_ht: "ht",
  platform_tm: "tm",
  platform_dc: "dc",
  platform_sho: "sho",
};

const PLATFORM_REGEX_MAP: Array<{ slug: PlatformSlug; regex: RegExp }> = [
  { slug: "mx", regex: /\bmx(?:8|10|12|2000)?\b/i },
  { slug: "ht", regex: /\b(high\s*tech|hts?)\b/i },
  { slug: "tm", regex: /\btm\s?(1|x)?\b/i },
  { slug: "dc", regex: /\bdc\b/i },
  { slug: "sho", regex: /\bsho\b/i },
];

const DISCIPLINE_REGEX = /\b(sporting|fitasc|trap|skeet|clays|live bird)\b/gi;
const EXPERIENCE_HINTS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\bnew to perazzi|first (gun|perazzi|build)|beginner\b/i, label: "New to Perazzi" },
  { regex: /\bcompetitive|champion|tournament|match\b/i, label: "Competitive shooter" },
  { regex: /\bowner|already own\b/i, label: "Existing owner" },
];
const PREFERENCE_HINTS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\bstable|stability|flatter\b/i, label: "Prefers added stability / flatter recoil" },
  { regex: /\bbalance|neutral balance\b/i, label: "Prefers neutral balance" },
  { regex: /\bquick|fast handling\b/i, label: "Prefers quick handling" },
  { regex: /\blighter\b/i, label: "Prefers lighter feel" },
  { regex: /\bheavier\b/i, label: "Comfortable with added mass" },
];

export function derivePanels(messages: ChatMessage[], meta: AssistantMeta | null): DerivedPanels {
  const safeMeta: AssistantMeta = meta ?? { intents: [], topics: [], citations: [], templates: [] };
  const latestAssistant = findLatestByRole(messages, "assistant");
  const latestUser = findLatestByRole(messages, "user");
  const searchText = `${latestAssistant?.content ?? ""} ${latestUser?.content ?? ""}`;

  const activePlatforms = derivePlatforms(safeMeta, searchText);
  const fitProfile = deriveFitProfile(searchText);
  const nextSteps = deriveNextSteps(safeMeta, activePlatforms);

  return {
    activePlatforms,
    fitProfile,
    nextSteps,
  };
}

function derivePlatforms(meta: AssistantMeta, text: string): PlatformSlug[] {
  const found = new Set<PlatformSlug>();
  meta.topics.forEach((topic) => {
    const matched = PLATFORM_TOPIC_MAP[topic];
    if (matched) found.add(matched);
  });
  meta.intents.forEach((intent) => {
    const matched = PLATFORM_TOPIC_MAP[intent];
    if (matched) found.add(matched);
  });
  PLATFORM_REGEX_MAP.forEach(({ slug, regex }) => {
    if (regex.test(text)) {
      found.add(slug);
    }
  });
  return Array.from(found);
}

function deriveFitProfile(text: string) {
  const lower = text.toLowerCase();
  const disciplines = uniqueMatches(lower, DISCIPLINE_REGEX).map((value) => capitalize(value));
  const preferences = new Set<string>();
  PREFERENCE_HINTS.forEach(({ regex, label }) => {
    if (regex.test(text)) preferences.add(label);
  });

  let experienceLevel: string | undefined;
  for (const hint of EXPERIENCE_HINTS) {
    if (hint.regex.test(text)) {
      experienceLevel = hint.label;
      break;
    }
  }

  return {
    disciplines,
    experienceLevel,
    preferences: Array.from(preferences),
  };
}

function deriveNextSteps(meta: AssistantMeta, platforms: PlatformSlug[]) {
  const steps: Array<{ id: string; label: string; intent: string }> = [];
  const templates = meta.templates ?? [];

  if (meta.intents.includes("dealers")) {
    steps.push({
      id: "find-dealer",
      label: "Find an authorized dealer",
      intent: "contact_dealer",
    });
  }
  if (meta.intents.includes("service")) {
    steps.push({
      id: "service-care",
      label: "Plan service & care",
      intent: "service_plan",
    });
  }
  if (meta.intents.includes("models") || templates.some((t) => t.toLowerCase().includes("comparison"))) {
    steps.push({
      id: "compare-platforms",
      label: "Understand Perazzi platforms",
      intent: "learn_platforms",
    });
  }
  if (meta.intents.includes("bespoke")) {
    steps.push({
      id: "bespoke-process",
      label: "Learn the bespoke build process",
      intent: "learn_bespoke_process",
    });
  }

  if (platforms.length) {
    platforms.forEach((platform) => {
      steps.push({
        id: `platform-${platform}`,
        label: `Explore the ${platform.toUpperCase()} platform`,
        intent: `platform_${platform}`,
      });
    });
  }

  if (!steps.length) {
    steps.push({
      id: "bespoke-overview",
      label: "Learn the bespoke build process",
      intent: "learn_bespoke_process",
    });
  }

  const seen = new Set<string>();
  return steps.filter((step) => {
    if (seen.has(step.id)) return false;
    seen.add(step.id);
    return true;
  });
}

function uniqueMatches(text: string, regex: RegExp): string[] {
  const matches = text.match(regex);
  if (!matches) return [];
  const seen = new Set<string>();
  matches.forEach((match) => seen.add(match.toLowerCase()));
  return Array.from(seen);
}

function capitalize(input: string) {
  if (!input) return input;
  return input.slice(0, 1).toUpperCase() + input.slice(1);
}

function findLatestByRole(messages: ChatMessage[], role: ChatMessage["role"]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === role) return messages[i];
  }
  return null;
}
