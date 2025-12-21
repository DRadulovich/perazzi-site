function isPromptDebugEnabled(): boolean {
  return process.env.PERAZZI_DEBUG_PROMPT === "true";
}

function countTextChars(value: unknown): number {
  if (typeof value === "string") return value.length;
  return 0;
}

function countContentChars(content: unknown): number {
  if (typeof content === "string") return content.length;
  if (Array.isArray(content)) {
    return content.reduce((sum, part) => {
      if (typeof part === "string") return sum + part.length;
      if (part && typeof part === "object") {
        const candidate = part as Record<string, unknown>;
        if (typeof candidate.text === "string") return sum + candidate.text.length;
        if (typeof candidate.input_text === "string") return sum + candidate.input_text.length;
        if (typeof candidate.content === "string") return sum + candidate.content.length;
      }
      return sum;
    }, 0);
  }
  return 0;
}

type SummarizedInput = {
  items: Array<{ type: string; role?: string; chars: number }>;
  countsByType: Record<string, number>;
  countsByRole: Record<string, number>;
  totalChars: number;
};

function summarizeInputItem(item: unknown) {
  if (typeof item === "string") {
    return { type: "input_text", chars: item.length };
  }

  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const role = typeof obj.role === "string" ? obj.role : undefined;
    let type = "object";
    if (typeof obj.type === "string") {
      type = obj.type;
    } else if (role) {
      type = "message";
    }
    const chars = countContentChars(obj.content);
    return { type, role, chars };
  }

  return { type: "unknown", chars: 0 };
}

function summarizeArrayInput(input: unknown[]): SummarizedInput {
  const items: SummarizedInput["items"] = [];
  const countsByType: Record<string, number> = {};
  const countsByRole: Record<string, number> = {};
  let totalChars = 0;

  input.forEach((item) => {
    const summary = summarizeInputItem(item);
    items.push(summary);
    totalChars += summary.chars;
    countsByType[summary.type] = (countsByType[summary.type] ?? 0) + 1;
    if (summary.role) {
      countsByRole[summary.role] = (countsByRole[summary.role] ?? 0) + 1;
    }
  });

  return { items, countsByType, countsByRole, totalChars };
}

function summarizeInput(input: unknown): SummarizedInput {
  if (typeof input === "string") {
    return {
      items: [{ type: "input_text", chars: input.length }],
      countsByType: { input_text: 1 },
      countsByRole: {},
      totalChars: input.length,
    };
  }

  if (Array.isArray(input)) {
    return summarizeArrayInput(input);
  }

  return {
    items: [],
    countsByType: {},
    countsByRole: {},
    totalChars: 0,
  };
}

function summarizeResponsesCreatePayload(payload: Record<string, unknown>) {
  const instructions = payload.instructions;
  const previousResponseId = payload.previous_response_id;
  const store = payload.store;
  const promptCacheKey = payload.prompt_cache_key;
  const { items, countsByRole, countsByType, totalChars } = summarizeInput(payload.input);

  const instructionsChars = countTextChars(instructions);

  return {
    keys: Object.keys(payload).sort((a, b) => a.localeCompare(b)),
    model: typeof payload.model === "string" ? payload.model : null,
    hasInstructions: instructionsChars > 0,
    instructionsChars,
    inputItemCount: items.length,
    inputItems: items,
    inputTotalChars: totalChars,
    inputCountsByType: countsByType,
    inputCountsByRole: Object.keys(countsByRole).length ? countsByRole : undefined,
    previous_response_id_present: typeof previousResponseId === "string" && previousResponseId.length > 0,
    store_present: Object.prototype.hasOwnProperty.call(payload, "store"),
    store_value: typeof store === "boolean" || store === null ? store : undefined,
    prompt_cache_key_present: typeof promptCacheKey === "string" && promptCacheKey.length > 0,
    prompt_cache_key_chars: countTextChars(promptCacheKey),
  };
}

export { isPromptDebugEnabled, summarizeResponsesCreatePayload };
