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

export function getLogTextMode(metadata: unknown, explicit?: string | null): LogTextMode {
  const meta = asRecord(metadata);
  const raw =
    explicit ??
    (typeof meta?.logTextMode === "string" ? meta.logTextMode : null) ??
    (typeof (meta?.log_text_mode as unknown) === "string" ? (meta?.log_text_mode as string) : null);

  if (typeof raw !== "string") return "unknown";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "omitted" || normalized === "truncate" || normalized === "full") return normalized;
  return "unknown";
}

export function getLogTextMaxChars(metadata: unknown, explicit?: number | null): number | null {
  const meta = asRecord(metadata);
  const raw = explicit ?? meta?.logTextMaxChars ?? meta?.log_text_max_chars;
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : typeof raw === "number" ? raw : null;
  if (!Number.isFinite(n as number) || (n as number) <= 0) return null;
  return Number(n);
}

function resolveFlag(metadata: unknown, key: string, explicit: boolean | null | undefined): boolean | null {
  const fromExplicit = coerceBoolean(explicit);
  if (fromExplicit !== null) return fromExplicit;
  const meta = asRecord(metadata);
  const fromMeta = coerceBoolean(meta?.[key]);
  return fromMeta;
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

  const isOmitted =
    resolveFlag(metadata, `${field}TextOmitted`, omittedFlag) === true ||
    placeholder ||
    (mode === "omitted" && trimmed.length > 0);

  const metaTruncated = resolveFlag(metadata, `${field}TextTruncated`, truncatedFlag);
  const inferredTruncated =
    metaTruncated !== null
      ? metaTruncated
      : mode === "truncate" && maxChars !== null && maxChars > 0 && trimmed.length >= maxChars && !placeholder;
  const isTruncated = !isOmitted && inferredTruncated === true;

  const badge =
    isOmitted ? "OMITTED" : isTruncated ? "TRUNCATED" : mode === "truncate" ? "TRUNCATE MODE" : undefined;
  const badgeTone: BadgeTone | undefined = isOmitted ? "red" : isTruncated ? "amber" : undefined;
  const copyAllowed = !isOmitted;
  const copyLabel = isOmitted ? "Full text not stored" : isTruncated ? "Copy stored excerpt" : "Copy text";
  const callout = isOmitted
    ? "Text omitted by logging settings."
    : isTruncated
      ? `Stored excerpt${maxChars ? ` (max ${maxChars} chars)` : ""}.`
      : mode === "truncate"
        ? `Logging in truncate mode${maxChars ? ` (max ${maxChars} chars)` : ""}.`
        : undefined;

  const displayValue = isOmitted && !trimmed ? TEXT_PLACEHOLDER : stored;

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
