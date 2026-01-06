const TEXT_PLACEHOLDER = "[omitted]";

type LogTextMode = "omitted" | "truncate" | "full" | "unknown";

type BadgeTone = "default" | "red" | "amber";

export type TextFieldStatus = {
  mode: LogTextMode;
  maxChars: number | null;
  isOmitted: boolean;
  isTruncated: boolean;
  badge?: string;
  badgeTone?: BadgeTone;
  copyAllowed: boolean;
  copyLabel: string;
  callout?: string;
  displayValue: string;
};

function coerceBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function getStringMeta(meta: Record<string, unknown> | null, key: string): string | null {
  const value = meta?.[key];
  return typeof value === "string" ? value : null;
}

function parsePositiveMaxChars(value: unknown): number | null {
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
  }
  return null;
}

export function getLogTextMode(metadata: unknown, explicit?: string | null): LogTextMode {
  const meta = asRecord(metadata);
  const raw =
    explicit ??
    getStringMeta(meta, "logTextMode") ??
    getStringMeta(meta, "log_text_mode");

  if (typeof raw !== "string") return "unknown";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "omitted" || normalized === "truncate" || normalized === "full") return normalized;
  return "unknown";
}

export function getLogTextMaxChars(metadata: unknown, explicit?: number | null): number | null {
  const meta = asRecord(metadata);
  const raw = explicit ?? meta?.logTextMaxChars ?? meta?.log_text_max_chars;
  return parsePositiveMaxChars(raw);
}

function resolveFlag(metadata: unknown, key: string, explicit: boolean | null | undefined): boolean | null {
  const fromExplicit = coerceBoolean(explicit);
  if (fromExplicit !== null) return fromExplicit;
  const meta = asRecord(metadata);
  const fromMeta = coerceBoolean(meta?.[key]);
  return fromMeta;
}

function resolveIsOmittedStatus({
  field,
  trimmed,
  metadata,
  mode,
  omittedFlag,
}: {
  field: "prompt" | "response";
  trimmed: string;
  metadata?: unknown;
  mode: LogTextMode;
  omittedFlag?: boolean | null;
}): boolean {
  const explicitOmitted = resolveFlag(metadata, `${field}TextOmitted`, omittedFlag);
  if (explicitOmitted === true) return true;
  if (trimmed === TEXT_PLACEHOLDER) return true;
  if (mode === "omitted" && trimmed.length > 0) return true;
  return false;
}

function resolveIsTruncatedStatus({
  field,
  trimmed,
  metadata,
  mode,
  maxChars,
  truncatedFlag,
  isOmitted,
  placeholder,
}: {
  field: "prompt" | "response";
  trimmed: string;
  metadata?: unknown;
  mode: LogTextMode;
  maxChars: number | null;
  truncatedFlag?: boolean | null;
  isOmitted: boolean;
  placeholder: boolean;
}): boolean {
  if (isOmitted) return false;

  const metaTruncated = resolveFlag(metadata, `${field}TextTruncated`, truncatedFlag);
  if (metaTruncated !== null) return metaTruncated === true;
  if (mode !== "truncate") return false;
  if (maxChars === null || maxChars <= 0) return false;
  if (trimmed.length < maxChars) return false;
  if (placeholder) return false;
  return true;
}

function resolveBadge(isOmitted: boolean, isTruncated: boolean, mode: LogTextMode): string | undefined {
  if (isOmitted) return "OMITTED";
  if (isTruncated) return "TRUNCATED";
  if (mode === "truncate") return "TRUNCATE MODE";
  return undefined;
}

function resolveBadgeTone(isOmitted: boolean, isTruncated: boolean): BadgeTone | undefined {
  if (isOmitted) return "red";
  if (isTruncated) return "amber";
  return undefined;
}

function resolveCopyLabel(isOmitted: boolean, isTruncated: boolean): string {
  if (isOmitted) return "Full text not stored";
  if (isTruncated) return "Copy stored excerpt";
  return "Copy text";
}

function resolveCallout(isOmitted: boolean, isTruncated: boolean, mode: LogTextMode, maxChars: number | null) {
  if (isOmitted) return "Text omitted by logging settings.";

  const maxCharsLabel = maxChars ? ` (max ${maxChars} chars)` : "";
  if (isTruncated) return `Stored excerpt${maxCharsLabel}.`;
  if (mode === "truncate") return `Logging in truncate mode${maxCharsLabel}.`;
  return undefined;
}

function buildFieldStatus({
  field,
  text,
  metadata,
  mode,
  maxChars,
  omittedFlag,
  truncatedFlag,
}: {
  field: "prompt" | "response";
  text: string | null | undefined;
  metadata?: unknown;
  mode: LogTextMode;
  maxChars: number | null;
  omittedFlag?: boolean | null;
  truncatedFlag?: boolean | null;
}): TextFieldStatus {
  const stored = String(text ?? "");
  const trimmed = stored.trim();
  const placeholder = trimmed === TEXT_PLACEHOLDER;

  const isOmitted = resolveIsOmittedStatus({ field, trimmed, metadata, mode, omittedFlag });
  const isTruncated = resolveIsTruncatedStatus({
    field,
    trimmed,
    metadata,
    mode,
    maxChars,
    truncatedFlag,
    isOmitted,
    placeholder,
  });

  const badge = resolveBadge(isOmitted, isTruncated, mode);
  const badgeTone = resolveBadgeTone(isOmitted, isTruncated);
  const copyAllowed = !isOmitted;
  const copyLabel = resolveCopyLabel(isOmitted, isTruncated);
  const callout = resolveCallout(isOmitted, isTruncated, mode, maxChars);

  const displayValue = isOmitted && trimmed.length === 0 ? TEXT_PLACEHOLDER : stored;

  return {
    mode,
    maxChars,
    isOmitted,
    isTruncated,
    badge,
    badgeTone,
    copyAllowed,
    copyLabel,
    callout,
    displayValue,
  };
}

export function getTextStorageBadges(args: {
  promptText?: string | null;
  responseText?: string | null;
  metadata?: unknown;
  logTextMode?: string | null;
  logTextMaxChars?: number | null;
  promptTextOmitted?: boolean | null;
  responseTextOmitted?: boolean | null;
  promptTextTruncated?: boolean | null;
  responseTextTruncated?: boolean | null;
}): { prompt: TextFieldStatus; response: TextFieldStatus } {
  const mode = getLogTextMode(args.metadata, args.logTextMode);
  const maxChars = getLogTextMaxChars(args.metadata, args.logTextMaxChars);

  const prompt = buildFieldStatus({
    field: "prompt",
    text: args.promptText,
    metadata: args.metadata,
    mode,
    maxChars,
    omittedFlag: args.promptTextOmitted,
    truncatedFlag: args.promptTextTruncated,
  });

  const response = buildFieldStatus({
    field: "response",
    text: args.responseText,
    metadata: args.metadata,
    mode,
    maxChars,
    omittedFlag: args.responseTextOmitted,
    truncatedFlag: args.responseTextTruncated,
  });

  return { prompt, response };
}

export function getLogTextCalloutToneClass(
  status: { isOmitted: boolean; isTruncated: boolean } | null | undefined,
): string {
  if (!status) return "border-border bg-muted/10 text-muted-foreground";
  if (status.isOmitted) return "border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-200";
  if (status.isTruncated) return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  return "border-border bg-muted/10 text-muted-foreground";
}
