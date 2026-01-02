// Utilities for short-title reveals. Do not use on paragraphs or long body copy.

export const MAX_LETTER_REVEAL_CHARS = 24;

export function shouldUseLetterReveal(
  text: string,
  reducedMotion: boolean,
  maxChars: number = MAX_LETTER_REVEAL_CHARS
): boolean {
  if (reducedMotion) return false;
  const normalized = text.trim();
  if (!normalized) return false;
  return normalized.length <= maxChars;
}

export type TextRevealUnit = {
  key: string;
  value: string;
  isWhitespace: boolean;
};

export type TextRevealParts = {
  srText: string;
  units: TextRevealUnit[];
};

export type TextRevealSplitMode = "letters" | "words";

export function splitTextForReveal(text: string, mode: TextRevealSplitMode): TextRevealParts {
  const rawText = text ?? "";
  const units =
    mode === "words"
      ? rawText.split(/(\s+)/)
      : Array.from(rawText);

  return {
    srText: rawText,
    units: units
      .filter((unit) => unit.length > 0)
      .map((unit, index) => ({
        key: `${mode}-${index}-${unit}`,
        value: unit,
        isWhitespace: /^\s+$/.test(unit),
      })),
  };
}
