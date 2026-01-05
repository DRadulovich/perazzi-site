import type { RetrievedChunk } from "@/types/perazzi-assistant";

const MODELS_REGISTRY_FILENAME = "v2_rag_corpus-models-details.json";

const MODEL_SPEC_PATTERNS: RegExp[] = [
  /\bplatforms?\b/i,
  /\bbase[- ]model\b/i,
  /\bgauges?\b/i,
  /\bbarrels?\b/i,
  /\btrigger(?:\s+group)?\b/i,
  /\bribs?\b/i,
  /\bdisciplines?\b/i,
  /\bcombo\b/i,
  /\bconfigurations?\b/i,
  /\bconfig\b/i,
  /\bspecs?\b/i,
  /\bspecifications?\b/i,
];

export function isModelsRegistryChunk(chunk: RetrievedChunk): boolean {
  const sourcePath = chunk?.sourcePath ?? "";
  if (!sourcePath) return false;
  const normalized = sourcePath.toLowerCase().replaceAll("\\", "/");
  return normalized.endsWith(MODELS_REGISTRY_FILENAME);
}

export function isModelSpecFactQuery(userText: string | null | undefined): boolean {
  if (!userText) return false;
  const text = userText.toLowerCase();
  return MODEL_SPEC_PATTERNS.some((pattern) => pattern.test(text));
}

export type ModelsRegistrySotResult = {
  applied: boolean;
  reason: string;
  registryChunkCount: number;
  totalChunkCountBefore: number;
  totalChunkCountAfter: number;
  chunks: RetrievedChunk[];
};

export function applyModelsRegistrySot(params: {
  enabled: boolean;
  modelSpecFactQuery: boolean;
  retrievalAttempted: boolean;
  chunks: RetrievedChunk[];
}): ModelsRegistrySotResult {
  const totalChunkCountBefore = params.chunks.length;
  const registryChunks = params.chunks.filter(isModelsRegistryChunk);
  const registryChunkCount = registryChunks.length;

  if (!params.retrievalAttempted) {
    return {
      applied: false,
      reason: "retrieval_skipped",
      registryChunkCount,
      totalChunkCountBefore,
      totalChunkCountAfter: totalChunkCountBefore,
      chunks: params.chunks,
    };
  }

  if (!params.enabled) {
    return {
      applied: false,
      reason: "disabled:env_flag",
      registryChunkCount,
      totalChunkCountBefore,
      totalChunkCountAfter: totalChunkCountBefore,
      chunks: params.chunks,
    };
  }

  if (!params.modelSpecFactQuery) {
    return {
      applied: false,
      reason: "not_applicable:query_classifier",
      registryChunkCount,
      totalChunkCountBefore,
      totalChunkCountAfter: totalChunkCountBefore,
      chunks: params.chunks,
    };
  }

  if (registryChunkCount === 0) {
    return {
      applied: false,
      reason: "not_applicable:no_registry_chunks",
      registryChunkCount,
      totalChunkCountBefore,
      totalChunkCountAfter: totalChunkCountBefore,
      chunks: params.chunks,
    };
  }

  const otherChunks = params.chunks.filter((chunk) => !isModelsRegistryChunk(chunk));
  const reordered = [...registryChunks, ...otherChunks];

  return {
    applied: true,
    reason: "applied:registry_first",
    registryChunkCount,
    totalChunkCountBefore,
    totalChunkCountAfter: reordered.length,
    chunks: reordered,
  };
}
