export type EvidenceMode = "perazzi_sourced" | "general_unsourced";

export const GENERAL_UNSOURCED_LABEL_PREFIX = "General answer (not sourced from Perazzi docs): ";

export function ensureGeneralUnsourcedLabelFirstLine(text: string): string {
  const lines = String(text ?? "").split(/\r?\n/);
  const normalizedLines = lines.map((line) => {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith(GENERAL_UNSOURCED_LABEL_PREFIX)) return line;
    return trimmed.slice(GENERAL_UNSOURCED_LABEL_PREFIX.length);
  });
  const body = normalizedLines.join("\n").trimStart();
  return `${GENERAL_UNSOURCED_LABEL_PREFIX}${body}`;
}

