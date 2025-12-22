export type Status = "active" | "planned" | "deprecated";
export type EmbedMode = "full" | "metadata-only" | "ignore";

export interface ActiveDoc {
  path: string;
  category: string;
  docType: string;
  status: Status;
  embedMode: EmbedMode;
  pricingSensitive: boolean;
}

export interface DocumentMetadata {
  title?: string;
  summary?: string;
  series_part_number?: number | null;
  series_part_roman?: string | null;
  series_part_title?: string | null;
  series_chapter_code?: string | null;
  series_chapter_title?: string | null;
  series_chapter_global_index?: number | null;
  series_chapter_part_index?: number | null;
  language?: string | null;
  disciplines?: string[] | null;
  platforms?: string[] | null;
  audiences?: string[] | null;
  tags?: string[] | null;
}

export interface ModelDetailsRecord {
  name?: string;
  slug?: string;
  id?: string;
  platform?: string;
  platformSlug?: string;
  category?: string;
  specText?: string;
  disciplines?: string[];
  gauges?: string[];
  barrelConfig?: string;
}

export interface OlympicMedalEntry {
  Athlete?: string;
  Event?: string;
  Medal?: string;
  Olympics?: string;
  "Perazzi Model"?: string;
  Country?: string;
  Evidence?: string;
  Sources?: Array<string | number | boolean | null | undefined>;
}

export interface ChunkInput {
  text: string;
  chunkIndex: number;
  heading?: string;
  headingPath?: string;
  sectionLabels?: string[];
  primaryModes?: string[];
  archetypeBias?: string[];
}

export interface IngestOptions {
  full: boolean;
  dryRun: boolean;
}

export interface DocChunkStats {
  chunkCount: number;
  maxChars: number;
  maxTokens: number;
  overMaxCharsCount: number;
  overMaxTokensCount: number;
  docType: string;
  path: string;
}

export interface ChunkAnalysisEntry {
  path: string;
  headingPath: string;
  chunkIndex: number;
  chars: number;
  estTokens: number;
  partMarker?: string;
}

export interface TokenHistogramBin {
  label: string;
  min: number;
  max?: number;
}

export interface IngestStats {
  scanned: number;
  newCount: number;
  updated: number;
  skipped: number;
  chunksWritten: number;
}
