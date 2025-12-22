import type { ChunkInput } from "../types";
import { slugify } from "../utils";

export interface Section {
  heading?: string;
  headingPath?: string;
  content: string[];
}

export function defaultModesForCategory(category: string): string[] {
  if (category === "operational") return ["Navigation"];
  return ["Prospect", "Owner", "Navigation"];
}

export function defaultArchetypes(): string[] {
  return ["Loyalist", "Prestige", "Analyst", "Achiever", "Legacy"];
}

export function parseSections(rawText: string): Section[] {
  const lines = rawText.split(/\r?\n/);
  const stack: { level: number; text: string }[] = [];
  const sections: Section[] = [
    { heading: undefined, headingPath: undefined, content: [] },
  ];

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      while (stack.length && stack.at(-1)!.level >= level) {
        stack.pop();
      }
      stack.push({ level, text });
      const headingPath = stack.map((h) => h.text).join(" > ");
      sections.push({ heading: text, headingPath, content: [] });
    } else {
      sections.at(-1)!.content.push(line);
    }
  }

  return sections;
}

export function createChunkFromBuffer(
  buffer: string[],
  chunkIndex: number,
  section: Section,
  primaryModes: string[],
  archetypeBias: string[],
): ChunkInput | null {
  if (!buffer.length) return null;
  const text = buffer.join("\n\n").trim();
  if (!text) return null;

  const labels = section.heading
    ? [slugify(section.heading), slugify(section.headingPath)].filter(Boolean)
    : undefined;

  return {
    text,
    chunkIndex,
    heading: section.heading,
    headingPath: section.headingPath,
    sectionLabels: labels as string[] | undefined,
    primaryModes,
    archetypeBias,
  };
}
